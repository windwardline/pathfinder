import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { db, provenance } from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { recordAuditEvent } from '@/lib/audit';
import { IdempotencyConflictError, withIdempotency } from '@/lib/idempotency';
import { provenanceIntegrityHash } from '@/lib/provenance';
import { createProvenanceSchema } from '@/lib/validation';
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
  const parsed = createProvenanceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError({
      status: 400,
      code: 'INVALID_PROVENANCE',
      message: 'Invalid Provenance request',
      details: parsed.error.flatten().fieldErrors,
      correlationId: correlation,
    });
  }
  const userId = session.user.id;
  if (!(await checkRateLimit(`v1-provenance:${userId}`, 30, 60_000))) {
    return apiError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many Provenance requests. Please wait a moment.',
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
          operationType: 'PROVENANCE_CREATE',
          idempotencyKey: parsed.data.idempotency_key,
          request: parsed.data,
        },
        async () => {
          const fields = {
            userId,
            factId: null,
            sourceType: parsed.data.source_type,
            sourceReference: parsed.data.source_reference,
            documentId: parsed.data.document_id ?? null,
            pageReference: parsed.data.page_reference ?? null,
            sectionReference: parsed.data.section_reference ?? null,
            ruleId: parsed.data.rule_id ?? null,
            extractionMetadata: parsed.data.extraction_metadata ?? null,
            retentionPolicy: parsed.data.retention_policy ?? null,
            derivedFromFactId: null,
          };
          const [created] = await tx
            .insert(provenance)
            .values({
              ...fields,
              source: parsed.data.source_type.toLowerCase(),
              integrityHash: provenanceIntegrityHash(fields),
              createdBy: userId,
              status: 'DRAFT',
            })
            .returning();
          await recordAuditEvent(
            {
              userId,
              actorId: userId,
              eventType: 'PROVENANCE_CREATED',
              resourceType: 'PROVENANCE',
              resourceId: created.id,
              correlationId: correlation,
              metadata: { sourceType: created.sourceType },
            },
            tx
          );
          return serializeProvenance(created);
        }
      )
    );
    return apiSuccess(
      { provenance: result.value, idempotent_replay: result.replayed },
      request,
      201,
      correlation
    );
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return apiError({ status: 409, code: 'IDEMPOTENCY_CONFLICT', message: error.message, correlationId: correlation });
    }
    console.error('POST /v1/provenance failed:', error);
    return apiError({ status: 500, code: 'INTERNAL_ERROR', message: 'Provenance could not be created.', retryable: true, correlationId: correlation });
  }
}

export async function GET(request: Request) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const url = new URL(request.url);
  const conditions = [eq(provenance.userId, session.user.id)];
  const sourceType = url.searchParams.get('source_type');
  if (sourceType) conditions.push(eq(provenance.sourceType, sourceType));
  const documentId = url.searchParams.get('document_id');
  if (documentId) conditions.push(eq(provenance.documentId, documentId));
  const ruleId = url.searchParams.get('rule_id');
  if (ruleId) conditions.push(eq(provenance.ruleId, ruleId));
  const createdAfter = safeDate(url.searchParams.get('created_after'));
  if (createdAfter) conditions.push(gte(provenance.createdAt, createdAfter));
  const createdBefore = safeDate(url.searchParams.get('created_before'));
  if (createdBefore) conditions.push(lte(provenance.createdAt, createdBefore));
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100);

  try {
    const records = await db
      .select()
      .from(provenance)
      .where(and(...conditions))
      .orderBy(desc(provenance.createdAt), desc(provenance.id))
      .limit(limit);
    return apiSuccess(
      { provenance: records.map(serializeProvenance), page: { limit, count: records.length } },
      request,
      200,
      correlation
    );
  } catch (error) {
    console.error('GET /v1/provenance failed:', error);
    return apiError({ status: 500, code: 'INTERNAL_ERROR', message: 'Provenance could not be loaded.', retryable: true, correlationId: correlation });
  }
}

export function serializeProvenance(row: typeof provenance.$inferSelect) {
  return {
    provenance_id: row.id,
    source_type: row.sourceType,
    source_reference: row.sourceReference,
    integrity_hash: row.integrityHash,
    created_by: row.createdBy,
    created_at: row.createdAt,
    document_id: row.documentId,
    page_reference: row.pageReference,
    section_reference: row.sectionReference,
    rule_id: row.ruleId,
    extraction_metadata: row.extractionMetadata,
    retention_policy: row.retentionPolicy,
    status: row.status,
    fact_id: row.factId,
  };
}

function safeDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
