import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { db, factEvents, facts, FactStatus, provenance } from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { recordAuditEvent } from '@/lib/audit';
import { IdempotencyConflictError, withIdempotency } from '@/lib/idempotency';
import { provenanceIntegrityHash } from '@/lib/provenance';
import { createV1FactSchema, factPayloadSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = createV1FactSchema.safeParse(body);
  if (!parsed.success) {
    return apiError({ status: 400, code: 'INVALID_FACT_VALUE', message: 'Invalid Fact request', details: parsed.error.flatten().fieldErrors, correlationId: correlation });
  }
  const payloadResult = factPayloadSchema.safeParse({
    key: parsed.data.fact_type,
    value: parsed.data.value,
    sourceText: parsed.data.source_context,
  });
  if (!payloadResult.success) {
    return apiError({ status: 400, code: 'INVALID_FACT_VALUE', message: 'The Fact value does not match its Fact type.', details: payloadResult.error.flatten().fieldErrors, correlationId: correlation });
  }
  const userId = session.user.id;
  if (!(await checkRateLimit(`v1-facts:${userId}`, 60, 60_000))) {
    return apiError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many Fact requests. Please wait a moment.',
      retryable: true,
      correlationId: correlation,
    });
  }

  try {
    const result = await db.transaction(async tx =>
      withIdempotency(
        tx,
        {
          userId,
          operationType: 'V1_FACT_CREATE',
          idempotencyKey: parsed.data.idempotency_key,
          request: parsed.data,
        },
        async () => {
          const [source] = await tx
            .select()
            .from(provenance)
            .where(
              and(
                eq(provenance.id, parsed.data.provenance_id),
                eq(provenance.userId, userId),
                eq(provenance.status, 'DRAFT')
              )
            )
            .limit(1);
          if (!source) {
            throw new V1FactError(404, 'PROVENANCE_NOT_FOUND', 'Provenance not found');
          }
          if (source.factId) {
            throw new V1FactError(409, 'INVALID_PROVENANCE', 'This Provenance already supports another Fact.');
          }

          const factId = crypto.randomUUID();
          const [created] = await tx
            .insert(facts)
            .values({
              id: factId,
              userId,
              factType: parsed.data.fact_type,
              provenanceId: source.id,
              factText: JSON.stringify(payloadResult.data),
              status: FactStatus.Proposed,
              expiresAt: parsed.data.expires_at ? new Date(parsed.data.expires_at) : null,
            })
            .returning();
          const linkedSource = { ...source, factId };
          const [claimedSource] = await tx
            .update(provenance)
            .set({
              factId,
              status: 'PUBLISHED',
              integrityHash: provenanceIntegrityHash(linkedSource),
            })
            .where(
              and(
                eq(provenance.id, source.id),
                eq(provenance.userId, userId),
                eq(provenance.status, 'DRAFT')
              )
            )
            .returning({ id: provenance.id });
          if (!claimedSource) {
            throw new V1FactError(
              409,
              'PROVENANCE_ALREADY_CLAIMED',
              'This Provenance was already used. Refresh and try again.'
            );
          }
          await tx.insert(factEvents).values({
            factId,
            userId,
            eventType: 'PROPOSE',
            actorId: userId,
          });
          await recordAuditEvent(
            {
              userId,
              actorId: userId,
              eventType: 'FACT_PROPOSED',
              resourceType: 'FACT',
              resourceId: factId,
              correlationId: correlation,
              metadata: { factType: parsed.data.fact_type },
            },
            tx
          );
          return serializeV1Fact(created);
        }
      )
    );
    return apiSuccess(
      { fact: result.value, idempotent_replay: result.replayed },
      request,
      201,
      correlation
    );
  } catch (error) {
    if (error instanceof V1FactError) {
      return apiError({ status: error.status, code: error.code, message: error.message, correlationId: correlation });
    }
    if (error instanceof IdempotencyConflictError) {
      return apiError({ status: 409, code: 'IDEMPOTENCY_CONFLICT', message: error.message, correlationId: correlation });
    }
    console.error('POST /v1/facts failed:', error);
    return apiError({ status: 500, code: 'INTERNAL_ERROR', message: 'The Fact could not be created.', retryable: true, correlationId: correlation });
  }
}

export async function GET(request: Request) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const url = new URL(request.url);
  const conditions = [eq(facts.userId, session.user.id)];
  const status = url.searchParams.get('status');
  if (status) conditions.push(eq(facts.status, status));
  const factType = url.searchParams.get('fact_type');
  if (factType) conditions.push(eq(facts.factType, factType));
  const after = safeDate(url.searchParams.get('created_after'));
  if (after) conditions.push(gte(facts.createdAt, after));
  const before = safeDate(url.searchParams.get('created_before'));
  if (before) conditions.push(lte(facts.createdAt, before));
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100);

  const rows = await db
    .select()
    .from(facts)
    .where(and(...conditions))
    .orderBy(desc(facts.createdAt), desc(facts.id))
    .limit(limit);
  return apiSuccess(
    { facts: rows.map(serializeV1Fact), page: { limit, count: rows.length } },
    request,
    200,
    correlation
  );
}

export function serializeV1Fact(row: typeof facts.$inferSelect) {
  let payload: { value?: unknown } = {};
  try {
    payload = JSON.parse(row.factText);
  } catch {
    // Corrupt values stay absent rather than leaking parser details.
  }
  return {
    fact_id: row.id,
    fact_type: row.factType,
    value: payload.value ?? null,
    status: row.status,
    provenance_id: row.provenanceId,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    confirmed_at: row.confirmedAt,
    confirmed_by: row.confirmedBy,
    supersedes_fact_id: row.supersedesFactId,
    superseded_by_fact_id: row.supersededByFactId,
    expires_at: row.expiresAt,
    version: row.version,
  };
}

class V1FactError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

function safeDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
