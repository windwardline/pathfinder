import { z } from 'zod';
import { db } from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { recordAuditEvent } from '@/lib/audit';
import { IdempotencyConflictError, withIdempotency } from '@/lib/idempotency';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  ENGINE_VERSION,
  RULE_SET_VERSION,
  loadCurrentRoute,
  loadRouteHistory,
} from '@/lib/route-service';

const requestSchema = z.object({
  trigger_type: z.enum([
    'FACT_CONFIRMED',
    'FACT_SUPERSEDED',
    'FACT_EXPIRED',
    'ACTION_COMPLETED',
    'ACTION_FAILED',
    'DEADLINE_CHANGED',
    'CONSTRAINT_CHANGED',
    'OBLIGATION_CHANGED',
    'BLOCKER_ADDED',
    'BLOCKER_REMOVED',
    'GOAL_PRIORITY_CHANGED',
    'VERIFIED_RULE_CHANGED',
  ]),
  trigger_reference: z.string().trim().min(1).max(200),
  expected_current_route_version_id: z.string().min(1),
  idempotency_key: z.string().trim().min(1).max(200),
});

export async function GET(request: Request) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const userId = session.user.id;
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100);
  const triggerType = url.searchParams.get('trigger_type');
  const createdAfter = safeDate(url.searchParams.get('created_after'));
  const createdBefore = safeDate(url.searchParams.get('created_before'));
  const previousRouteId = url.searchParams.get('previous_route_version_id');
  const newRouteId = url.searchParams.get('new_route_version_id');
  const reroutes = (await loadRouteHistory(userId, 1_000))
    .filter(event => !triggerType || event.triggerReason === triggerType)
    .filter(event => !createdAfter || event.createdAt >= createdAfter)
    .filter(event => !createdBefore || event.createdAt <= createdBefore)
    .filter(event => !previousRouteId || event.previousRouteId === previousRouteId)
    .filter(event => !newRouteId || event.newRouteId === newRouteId)
    .slice(0, limit)
    .map(serializeReroute);
  return apiSuccess(
    { reroutes, page: { limit, count: reroutes.length } },
    request,
    200,
    correlation
  );
}

/**
 * Explicit refresh contract. Confirmed mutations already publish atomically;
 * this rejects stale clients and returns the current completed result without
 * inventing a new Reroute when no structured difference exists.
 */
export async function POST(request: Request) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const userId = session.user.id;
  if (!(await checkRateLimit(`v1-reroutes:${userId}`, 30, 60_000))) {
    return apiError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many Reroute requests. Please wait a moment.',
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
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError({ status: 400, code: 'INVALID_REQUEST', message: 'Invalid Reroute request', details: parsed.error.flatten().fieldErrors, correlationId: correlation });
  }
  const current = await loadCurrentRoute(userId);
  if (current.id !== parsed.data.expected_current_route_version_id) {
    return apiError({
      status: 409,
      code: 'STALE_ROUTE_VERSION',
      message: 'Your Route changed before this request completed. Refresh and try again.',
      details: { current_route_version_id: current.id },
      correlationId: correlation,
    });
  }
  const matching = (await loadRouteHistory(userId, 1_000)).find(
    event =>
      event.triggerReason === parsed.data.trigger_type &&
      event.triggerReference === parsed.data.trigger_reference &&
      event.newRouteId === current.snapshotId
  );
  if (!matching) {
    return apiError({
      status: 422,
      code: 'TRIGGER_NOT_CONFIRMED',
      message: 'No confirmed routing change matches this request.',
      correlationId: correlation,
    });
  }

  try {
    const result = await db.transaction(async tx =>
      withIdempotency(
        tx,
        {
          userId,
          operationType: 'V1_REROUTE_REQUEST',
          idempotencyKey: parsed.data.idempotency_key,
          request: parsed.data,
        },
        async () => {
          await recordAuditEvent(
            {
              userId,
              actorId: userId,
              eventType: 'REROUTE_REQUESTED',
              resourceType: 'REROUTE',
              resourceId: matching.id,
              correlationId: correlation,
              metadata: { triggerType: parsed.data.trigger_type },
            },
            tx
          );
          return serializeReroute(matching);
        }
      )
    );
    return apiSuccess(
      {
        status: 'COMPLETED',
        reroute: result.value,
        idempotent_replay: result.replayed,
      },
      request,
      200,
      correlation
    );
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return apiError({
        status: 409,
        code: 'IDEMPOTENCY_CONFLICT',
        message: error.message,
        correlationId: correlation,
      });
    }
    console.error('POST /v1/reroutes failed:', error);
    return apiError({
      status: 500,
      code: 'ROUTE_RECALCULATION_FAILED',
      message: 'The Reroute request could not be completed.',
      retryable: true,
      correlationId: correlation,
    });
  }
}

type HistoryEvent = Awaited<ReturnType<typeof loadRouteHistory>>[number];

export function serializeReroute(event: HistoryEvent) {
  return {
    reroute_event_id: event.id,
    previous_route_version_id: event.previousRouteId,
    new_route_version_id: event.newRouteId,
    trigger_type: event.triggerReason,
    trigger_reference: event.triggerReference,
    created_at: event.createdAt,
    engine_version: ENGINE_VERSION,
    rule_set_version: RULE_SET_VERSION,
    difference_summary: serializeDifference(event.difference),
    explanation: deterministicExplanation(event),
  };
}

export function serializeDifference(difference: HistoryEvent['difference']) {
  if (!difference) return null;
  return {
    focus_action_changed: difference.focusActionChanged,
    previous_focus_action: difference.previousFocus ?? null,
    new_focus_action: difference.newFocus ?? null,
    added_actions: difference.added,
    removed_actions: difference.removed,
    newly_available_actions: difference.newlyAvailable,
    newly_blocked_actions: difference.newlyBlocked,
    completed_actions: difference.completed,
    moved_actions: difference.moved.map(item => ({
      action_id: item.actionId,
      title: item.title,
      previous_position: item.fromRank,
      new_position: item.toRank,
    })),
    deadline_changes: difference.deadlineChanges,
    obligation_changes: [],
    constraint_changes: [],
  };
}

function deterministicExplanation(event: HistoryEvent) {
  const difference = event.difference;
  if (!difference) return 'The structured Route Difference is unavailable.';
  const parts = [
    difference.completed.length
      ? `${difference.completed.length} Action${difference.completed.length === 1 ? '' : 's'} completed.`
      : '',
    difference.newlyAvailable.length
      ? `${difference.newlyAvailable.length} Action${difference.newlyAvailable.length === 1 ? '' : 's'} became available.`
      : '',
    difference.newlyBlocked.length
      ? `${difference.newlyBlocked.length} Action${difference.newlyBlocked.length === 1 ? '' : 's'} became blocked.`
      : '',
    difference.moved.length
      ? `${difference.moved.length} Action${difference.moved.length === 1 ? '' : 's'} moved.`
      : '',
  ].filter(Boolean);
  return parts.join(' ') || 'The confirmed change did not alter the published Action sequence.';
}

function safeDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
