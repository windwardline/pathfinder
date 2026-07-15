import {
  FactStatus,
  RerouteReason,
  GraphVersionError,
  db,
  factEvents,
  facts as factsTable,
  provenance as provenanceTable,
} from '@pathfinder/core';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { auth } from '@/auth';
import { factsRequestSchema } from '@/lib/validation';
import {
  loadConfirmedFacts,
  buildRoute,
  recordReroute,
  recordProvenance,
  toDomainFact,
  type DatabaseExecutor,
} from '@/lib/route-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { recordAuditEvent } from '@/lib/audit';
import { IdempotencyConflictError, withIdempotency } from '@/lib/idempotency';
import { provenanceIntegrityHash } from '@/lib/provenance';
import { emitOperationalEvent } from '@/lib/telemetry';

class FactMutationError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly publicMessage: string
  ) {
    super(publicMessage);
  }
}

/**
 * Facts API. Proposed Facts never affect the Route. Every mutation is
 * ownership-scoped, auditable, concurrency-safe, and idempotent.
 */
export async function POST(request: Request) {
  const id = correlationId(request);
  const startedAt = performance.now();
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
      correlationId: id,
    });
  }
  const userId = session.user.id;

  if (!(await checkRateLimit(`facts:${userId}`, 60, 60_000))) {
    return apiError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many Fact updates. Please wait a moment.',
      retryable: true,
      correlationId: id,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({
      status: 400,
      code: 'INVALID_JSON',
      message: 'Invalid JSON body',
      correlationId: id,
    });
  }

  const parsed = factsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Invalid request',
      details: parsed.error.flatten().fieldErrors,
      correlationId: id,
    });
  }

  try {
    const req = parsed.data;
    const result = await db.transaction(async tx =>
      withIdempotency(
        tx,
        {
          userId,
          operationType: `FACT_${req.action.toUpperCase()}`,
          idempotencyKey: req.idempotencyKey,
          request: req,
        },
        async () => {
          if (req.action === 'propose') {
            const factId = crypto.randomUUID();
            const [row] = await tx
              .insert(factsTable)
              .values({
                id: factId,
                userId,
                factType: req.payload.key,
                factText: JSON.stringify(req.payload),
                status: FactStatus.Proposed,
              })
              .returning();
            const provenanceId = await recordProvenance(
              factId,
              req.provenance.source,
              req.provenance.confidence,
              undefined,
              tx
            );
            await recordFactEvent(tx, factId, userId, 'PROPOSE', userId);
            await recordAuditEvent(
              {
                userId,
                actorId: userId,
                eventType: 'FACT_PROPOSED',
                resourceType: 'FACT',
                resourceId: factId,
                correlationId: id,
                metadata: { factType: req.payload.key },
              },
              tx
            );
            return {
              fact: { ...serializeFact(row), provenanceId },
              reroute: null,
            };
          }

          const [existing] = await tx
            .select()
            .from(factsTable)
            .where(and(eq(factsTable.id, req.factId), eq(factsTable.userId, userId)))
            .limit(1);
          if (!existing) {
            throw new FactMutationError(404, 'FACT_NOT_FOUND', 'Fact not found');
          }

          if (req.action === 'supersede') {
            if (existing.status !== FactStatus.Confirmed) {
              throw invalidState('Only a Confirmed Fact can be corrected.');
            }
            if (existing.factType !== req.replacementPayload.key) {
              throw new FactMutationError(
                400,
                'INVALID_FACT_VALUE',
                'A correction must preserve the original Fact type.'
              );
            }
            const replacementId = crypto.randomUUID();
            const requestedProvenance = req.provenanceId
              ? (
                  await tx
                    .select()
                    .from(provenanceTable)
                    .where(
                      and(
                        eq(provenanceTable.id, req.provenanceId),
                        eq(provenanceTable.userId, userId),
                        eq(provenanceTable.status, 'DRAFT'),
                        isNull(provenanceTable.factId)
                      )
                    )
                    .limit(1)
                )[0]
              : null;
            if (req.provenanceId && !requestedProvenance) {
              throw new FactMutationError(
                404,
                'PROVENANCE_NOT_FOUND',
                'The draft Provenance record was not found.'
              );
            }
            const [replacement] = await tx
              .insert(factsTable)
              .values({
                id: replacementId,
                userId,
                factType: req.replacementPayload.key,
                factText: JSON.stringify(req.replacementPayload),
                status: FactStatus.Proposed,
                supersedesFactId: existing.id,
                provenanceId: requestedProvenance?.id,
              })
              .returning();
            let provenanceId: string;
            if (requestedProvenance) {
              const [claimed] = await tx
                .update(provenanceTable)
                .set({
                  factId: replacementId,
                  status: 'PUBLISHED',
                  derivedFromFactId: existing.id,
                  integrityHash: provenanceIntegrityHash({
                    ...requestedProvenance,
                    factId: replacementId,
                    derivedFromFactId: existing.id,
                  }),
                })
                .where(
                  and(
                    eq(provenanceTable.id, requestedProvenance.id),
                    eq(provenanceTable.userId, userId),
                    eq(provenanceTable.status, 'DRAFT'),
                    isNull(provenanceTable.factId)
                  )
                )
                .returning({ id: provenanceTable.id });
              if (!claimed) {
                throw new FactMutationError(
                  409,
                  'PROVENANCE_ALREADY_CLAIMED',
                  'That Provenance record was already used. Refresh and try again.'
                );
              }
              provenanceId = claimed.id;
            } else {
              provenanceId = await recordProvenance(
                replacementId,
                req.provenance.source,
                req.provenance.confidence,
                existing.id,
                tx
              );
            }
            await recordFactEvent(
              tx,
              existing.id,
              userId,
              'SUPERSEDE_REQUESTED',
              userId,
              req.reasonCode,
              { replacementFactId: replacementId }
            );
            await recordAuditEvent(
              {
                userId,
                actorId: userId,
                eventType: 'FACT_SUPERSESSION_REQUESTED',
                resourceType: 'FACT',
                resourceId: existing.id,
                correlationId: id,
                metadata: { replacementFactId: replacementId },
              },
              tx
            );
            return {
              fact: { ...serializeFact(replacement), provenanceId },
              reroute: null,
            };
          }

          if (req.action === 'expire') {
            if (existing.status !== FactStatus.Confirmed) {
              throw invalidState('Only a Confirmed Fact can expire.');
            }
            const factsBefore = await loadConfirmedFacts(userId, tx);
            const routeBefore = buildRoute(factsBefore);
            const expiredAt = new Date();
            const [updated] = await tx
              .update(factsTable)
              .set({
                status: FactStatus.Expired,
                expiresAt: expiredAt,
                version: existing.version + 1,
                updatedAt: expiredAt,
              })
              .where(currentFactPredicate(existing, userId, FactStatus.Confirmed))
              .returning();
            if (!updated) throw concurrentMutation('expiration');
            await recordFactEvent(
              tx,
              existing.id,
              userId,
              'EXPIRE',
              userId,
              req.reasonCode
            );
            const factsAfter = await loadConfirmedFacts(userId, tx);
            const reroute = await recordReroute(
              tx,
              userId,
              RerouteReason.FACT_EXPIRED,
              routeBefore,
              buildRoute(factsAfter),
              factsBefore,
              factsAfter,
              existing.id
            );
            await recordAuditEvent(
              {
                userId,
                actorId: userId,
                eventType: 'FACT_EXPIRED',
                resourceType: 'FACT',
                resourceId: existing.id,
                correlationId: id,
                metadata: { reasonCode: req.reasonCode },
              },
              tx
            );
            return { fact: serializeFact(updated), reroute };
          }

          if (existing.status !== FactStatus.Proposed) {
            throw invalidState(`Only Proposed Facts can be ${req.action}ed.`);
          }

          if (req.action === 'reject') {
            const [updated] = await tx
              .update(factsTable)
              .set({
                status: FactStatus.Rejected,
                version: existing.version + 1,
                updatedAt: new Date(),
              })
              .where(currentFactPredicate(existing, userId, FactStatus.Proposed))
              .returning();
            if (!updated) throw concurrentMutation('rejection');
            await recordFactEvent(
              tx,
              existing.id,
              userId,
              'REJECT',
              userId,
              req.reasonCode
            );
            await recordAuditEvent(
              {
                userId,
                actorId: userId,
                eventType: 'FACT_REJECTED',
                resourceType: 'FACT',
                resourceId: existing.id,
                correlationId: id,
              },
              tx
            );
            return { fact: serializeFact(updated), reroute: null };
          }

          const factsBefore = await loadConfirmedFacts(userId, tx);
          const routeBefore = buildRoute(factsBefore);
          const confirmedAt = new Date();
          const [updated] = await tx
            .update(factsTable)
            .set({
              status: FactStatus.Confirmed,
              confirmedAt,
              confirmedBy: userId,
              version: existing.version + 1,
              updatedAt: confirmedAt,
            })
            .where(currentFactPredicate(existing, userId, FactStatus.Proposed))
            .returning();
          if (!updated) throw concurrentMutation('confirmation');

          let reason = RerouteReason.FACT_CONFIRMED;
          if (existing.supersedesFactId) {
            const [superseded] = await tx
              .update(factsTable)
              .set({
                status: FactStatus.Superseded,
                supersededByFactId: existing.id,
                version: existing.version + 1,
                updatedAt: confirmedAt,
              })
              .where(
                and(
                  eq(factsTable.id, existing.supersedesFactId),
                  eq(factsTable.userId, userId),
                  eq(factsTable.status, FactStatus.Confirmed)
                )
              )
              .returning();
            if (!superseded) {
              throw invalidState('The Fact being corrected is no longer current.');
            }
            reason = RerouteReason.FACT_SUPERSEDED;
            await recordFactEvent(
              tx,
              superseded.id,
              userId,
              'SUPERSEDE',
              userId,
              undefined,
              { replacementFactId: existing.id }
            );
          }

          await recordProvenance(existing.id, 'user_confirmation', undefined, undefined, tx);
          await recordFactEvent(
            tx,
            existing.id,
            userId,
            'CONFIRM',
            userId,
            undefined,
            { confirmationMethod: req.confirmationMethod }
          );
          const factsAfter = await loadConfirmedFacts(userId, tx);
          const reroute = await recordReroute(
            tx,
            userId,
            reason,
            routeBefore,
            buildRoute(factsAfter),
            factsBefore,
            factsAfter,
            existing.id
          );
          await recordAuditEvent(
            {
              userId,
              actorId: userId,
              eventType: reason === RerouteReason.FACT_SUPERSEDED
                ? 'FACT_SUPERSEDED'
                : 'FACT_CONFIRMED',
              resourceType: 'FACT',
              resourceId: existing.id,
              correlationId: id,
              metadata: { confirmationMethod: req.confirmationMethod },
            },
            tx
          );
          return { fact: serializeFact(updated), reroute };
        }
      )
    );

    emitOperationalEvent({
      correlationId: id,
      service: 'facts',
      operation: 'fact_mutation',
      outcome: 'success',
      durationMs: performance.now() - startedAt,
      httpStatus: 200,
      mutation: req.action,
      factType: req.action === 'propose' ? req.payload.key : undefined,
      rerouteCreated: 'reroute' in result.value && result.value.reroute != null,
    });
    return apiSuccess(
      { ...result.value, idempotent_replay: result.replayed },
      request,
      200,
      id
    );
  } catch (error) {
    emitOperationalEvent({
      correlationId: id,
      service: 'facts',
      operation: 'fact_mutation',
      outcome:
        error instanceof FactMutationError ||
        error instanceof IdempotencyConflictError ||
        error instanceof GraphVersionError
          ? 'rejected'
          : 'failure',
      durationMs: performance.now() - startedAt,
      httpStatus:
        error instanceof FactMutationError
          ? error.status
          : error instanceof IdempotencyConflictError
            ? 409
            : error instanceof GraphVersionError
              ? 422
              : 500,
      mutation: parsed.data.action,
      factType: parsed.data.action === 'propose' ? parsed.data.payload.key : undefined,
    });
    if (error instanceof FactMutationError) {
      return apiError({
        status: error.status,
        code: error.code,
        message: error.publicMessage,
        correlationId: id,
      });
    }
    if (error instanceof IdempotencyConflictError) {
      return apiError({
        status: 409,
        code: 'IDEMPOTENCY_CONFLICT',
        message: error.message,
        correlationId: id,
      });
    }
    if (error instanceof GraphVersionError) {
      console.error('Fact transition rejected by Route validation:', error.message);
      return apiError({
        status: 422,
        code: 'INVALID_ROUTE_INPUT',
        message:
          'This change would create invalid or conflicting Route data, so your current Route is unchanged.',
        correlationId: id,
      });
    }
    console.error('POST /api/facts failed:', error);
    return apiError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'The request could not be completed. Please try again.',
      retryable: true,
      correlationId: id,
    });
  }
}

export async function GET(request: Request) {
  const id = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
      correlationId: id,
    });
  }

  try {
    const rows = await db
      .select()
      .from(factsTable)
      .where(eq(factsTable.userId, session.user.id))
      .orderBy(desc(factsTable.createdAt));

    const provenanceRows = rows.length
      ? await db
          .select()
          .from(provenanceTable)
          .where(
            and(
              eq(provenanceTable.userId, session.user.id),
              inArray(provenanceTable.factId, rows.map(row => row.id))
            )
          )
      : [];

    const provenanceByFact = new Map<string, typeof provenanceRows>();
    for (const item of provenanceRows) {
      if (!item.factId) continue;
      provenanceByFact.set(item.factId, [
        ...(provenanceByFact.get(item.factId) || []),
        item,
      ]);
    }

    return apiSuccess(
      {
        facts: rows.map(row => ({
          ...serializeFact(row),
          provenance: (provenanceByFact.get(row.id) || []).map(item => ({
            id: item.id,
            source: item.source,
            sourceType: item.sourceType,
            sourceReference: item.sourceReference,
            confidence: item.confidence,
            integrityHash: item.integrityHash,
            createdAt: item.createdAt,
          })),
        })),
      },
      request,
      200,
      id
    );
  } catch (error) {
    console.error('GET /api/facts failed:', error);
    return apiError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Facts could not be loaded. Please try again.',
      retryable: true,
      correlationId: id,
    });
  }
}

function currentFactPredicate(
  existing: typeof factsTable.$inferSelect,
  userId: string,
  status: FactStatus
) {
  return and(
    eq(factsTable.id, existing.id),
    eq(factsTable.userId, userId),
    eq(factsTable.status, status),
    eq(factsTable.version, existing.version)
  );
}

function invalidState(message: string) {
  return new FactMutationError(409, 'INVALID_FACT_STATE', message);
}

function concurrentMutation(operation: string) {
  return new FactMutationError(
    409,
    'CONCURRENT_MUTATION',
    `This Fact changed before ${operation} completed.`
  );
}

async function recordFactEvent(
  executor: DatabaseExecutor,
  factId: string,
  userId: string,
  eventType: string,
  actorId: string,
  reasonCode?: string,
  metadata?: Record<string, string>
) {
  await executor.insert(factEvents).values({
    factId,
    userId,
    eventType,
    actorId,
    reasonCode: reasonCode ?? null,
    metadata: metadata ?? null,
  });
}

export function serializeFact(row: typeof factsTable.$inferSelect) {
  const domain = toDomainFact(row);
  return {
    id: row.id,
    factType: row.factType,
    status: row.status,
    payload: domain?.payload ?? null,
    version: row.version,
    provenanceId: row.provenanceId,
    confirmedAt: row.confirmedAt,
    confirmedBy: row.confirmedBy,
    supersedesFactId: row.supersedesFactId,
    supersededByFactId: row.supersededByFactId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
