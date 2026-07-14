import { NextResponse } from 'next/server';
import { db, facts, provenance, users } from '@pathfinder/core';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { accountExportSchema } from '@/lib/validation';
import { apiError, correlationId } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { loadCurrentRoute, loadRouteHistory } from '@/lib/route-service';
import { recordAuditEvent } from '@/lib/audit';

/** Creates an explicit, authenticated, auditable machine-readable export. */
export async function POST(request: Request) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
      correlationId: correlation,
    });
  }
  const userId = session.user.id;

  if (!(await checkRateLimit(`export:${userId}`, 5, 60 * 60_000))) {
    return apiError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Your data was exported recently. Please wait before creating another export.',
      retryable: true,
      correlationId: correlation,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  if (!accountExportSchema.safeParse(body).success) {
    return apiError({
      status: 400,
      code: 'CONFIRMATION_REQUIRED',
      message: 'Please confirm that you want to create this export.',
      correlationId: correlation,
    });
  }

  try {
    const [account] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!account) {
      return apiError({
        status: 404,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found',
        correlationId: correlation,
      });
    }
    const factRows = await db
      .select()
      .from(facts)
      .where(eq(facts.userId, userId))
      .orderBy(asc(facts.createdAt));
    const provenanceRows = factRows.length
      ? await db
          .select()
          .from(provenance)
          .where(
            and(
              eq(provenance.userId, userId),
              inArray(provenance.factId, factRows.map(fact => fact.id))
            )
          )
          .orderBy(asc(provenance.createdAt))
      : [];
    const route = await loadCurrentRoute(userId);
    const history = await loadRouteHistory(userId, 1_000);

    await recordAuditEvent({
      userId,
      actorId: userId,
      eventType: 'ACCOUNT_EXPORT_COMPLETED',
      resourceType: 'ACCOUNT',
      resourceId: userId,
      correlationId: correlation,
      metadata: { factCount: factRows.length, historyCount: history.length },
    });

    const response = NextResponse.json({
      export_version: 'release-1.0',
      exported_at: new Date().toISOString(),
      correlation_id: correlation,
      account: {
        user_id: account.id,
        email: account.email,
        status: account.status,
        locale: account.locale,
        time_zone: account.timeZone,
        created_at: account.createdAt,
      },
      facts: factRows.map(fact => ({
        fact_id: fact.id,
        fact_type: fact.factType,
        value: JSON.parse(fact.factText),
        status: fact.status,
        version: fact.version,
        confirmed_at: fact.confirmedAt,
        confirmed_by: fact.confirmedBy,
        supersedes_fact_id: fact.supersedesFactId,
        superseded_by_fact_id: fact.supersededByFactId,
        expires_at: fact.expiresAt,
        created_at: fact.createdAt,
        updated_at: fact.updatedAt,
      })),
      provenance: provenanceRows.map(item => ({
        provenance_id: item.id,
        fact_id: item.factId,
        source_type: item.sourceType,
        source_reference: item.sourceReference,
        integrity_hash: item.integrityHash,
        confidence: item.confidence,
        derived_from_fact_id: item.derivedFromFactId,
        created_at: item.createdAt,
      })),
      current_route: {
        route_version_id: route.id,
        status: route.status,
        focus_action_id: route.focusActionId ?? null,
        steps: route.steps,
      },
      route_history: history,
    });
    response.headers.set('content-disposition', 'attachment; filename="pathfinder-export.json"');
    response.headers.set('cache-control', 'private, no-store');
    response.headers.set('x-correlation-id', correlation);
    return response;
  } catch (error) {
    console.error('POST /api/account/export failed:', error);
    return apiError({
      status: 500,
      code: 'EXPORT_FAILED',
      message: 'The export could not be created. Please try again.',
      retryable: true,
      correlationId: correlation,
    });
  }
}
