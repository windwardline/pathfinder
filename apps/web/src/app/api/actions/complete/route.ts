import {
  FactStatus,
  RerouteReason,
  db,
  factEvents,
  facts as factsTable,
} from '@pathfinder/core';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { completeActionSchema } from '@/lib/validation';
import {
  loadConfirmedFacts,
  buildRoute,
  recordReroute,
  recordProvenance,
} from '@/lib/route-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { recordAuditEvent } from '@/lib/audit';
import { IdempotencyConflictError, withIdempotency } from '@/lib/idempotency';

class ActionMutationError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly publicMessage: string
  ) {
    super(publicMessage);
  }
}

/** Completes an Action and atomically publishes its structured Reroute. */
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

  if (!(await checkRateLimit(`complete:${userId}`, 30, 60_000))) {
    return apiError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many Action updates. Please wait a moment.',
      retryable: true,
      correlationId: correlation,
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
      correlationId: correlation,
    });
  }
  const parsed = completeActionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Invalid request',
      correlationId: correlation,
    });
  }
  const { actionId, idempotencyKey } = parsed.data;

  try {
    const result = await db.transaction(async tx =>
      withIdempotency(
        tx,
        {
          userId,
          operationType: 'ACTION_COMPLETE',
          idempotencyKey,
          request: parsed.data,
        },
        async () => {
          const [existing] = await tx
            .select()
            .from(factsTable)
            .where(and(eq(factsTable.id, actionId), eq(factsTable.userId, userId)))
            .limit(1);
          if (!existing) {
            throw new ActionMutationError(404, 'ACTION_NOT_FOUND', 'Action not found');
          }
          if (existing.status !== FactStatus.Confirmed) {
            throw new ActionMutationError(
              409,
              'INVALID_FACT_STATE',
              'Only Actions from Confirmed Facts can be completed.'
            );
          }

          let payload: { key?: string; value?: { status?: string } };
          try {
            payload = JSON.parse(existing.factText);
          } catch {
            throw new ActionMutationError(422, 'INVALID_FACT_VALUE', 'This Fact cannot be completed.');
          }
          if (payload?.key !== 'ACTION' || typeof payload.value !== 'object' || !payload.value) {
            throw new ActionMutationError(422, 'INVALID_FACT_VALUE', 'This Fact is not an Action.');
          }
          if (payload.value.status === 'COMPLETED') {
            throw new ActionMutationError(409, 'INVALID_FACT_STATE', 'This Action is already completed.');
          }

          const factsBefore = await loadConfirmedFacts(userId, tx);
          const routeBefore = buildRoute(factsBefore);
          payload.value.status = 'COMPLETED';
          const [updated] = await tx
            .update(factsTable)
            .set({
              factText: JSON.stringify(payload),
              version: existing.version + 1,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(factsTable.id, actionId),
                eq(factsTable.userId, userId),
                eq(factsTable.status, FactStatus.Confirmed),
                eq(factsTable.version, existing.version)
              )
            )
            .returning();
          if (!updated) {
            throw new ActionMutationError(
              409,
              'CONCURRENT_MUTATION',
              'This Action changed before completion finished.'
            );
          }

          await recordProvenance(actionId, 'user_completion', 100, undefined, tx);
          await tx.insert(factEvents).values({
            factId: actionId,
            userId,
            eventType: 'ACTION_COMPLETE',
            actorId: userId,
          });
          const factsAfter = await loadConfirmedFacts(userId, tx);
          const reroute = await recordReroute(
            tx,
            userId,
            RerouteReason.ACTION_COMPLETED,
            routeBefore,
            buildRoute(factsAfter),
            factsBefore,
            factsAfter,
            actionId
          );
          await recordAuditEvent(
            {
              userId,
              actorId: userId,
              eventType: 'ACTION_COMPLETED',
              resourceType: 'ACTION',
              resourceId: actionId,
              correlationId: correlation,
            },
            tx
          );
          return { factId: updated.id, reroute };
        }
      )
    );

    return apiSuccess(
      { ...result.value, idempotent_replay: result.replayed },
      request,
      200,
      correlation
    );
  } catch (error) {
    if (error instanceof ActionMutationError) {
      return apiError({
        status: error.status,
        code: error.code,
        message: error.publicMessage,
        correlationId: correlation,
      });
    }
    if (error instanceof IdempotencyConflictError) {
      return apiError({
        status: 409,
        code: 'IDEMPOTENCY_CONFLICT',
        message: error.message,
        correlationId: correlation,
      });
    }
    console.error('POST /api/actions/complete failed:', error);
    return apiError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'The Action could not be completed. Please try again.',
      retryable: true,
      correlationId: correlation,
    });
  }
}
