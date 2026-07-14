import { and, eq } from 'drizzle-orm';
import { db, routingSnapshots } from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import {
  ENGINE_VERSION,
  RULE_SET_VERSION,
  loadCurrentRoute,
} from '@/lib/route-service';

export async function GET(request: Request) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const route = await loadCurrentRoute(session.user.id);
  const [snapshot] = await db
    .select()
    .from(routingSnapshots)
    .where(
      and(
        eq(routingSnapshots.id, route.snapshotId),
        eq(routingSnapshots.userId, session.user.id)
      )
    )
    .limit(1);
  return apiSuccess(
    {
      route: serializeRoute(route, {
        engineVersion: snapshot?.engineVersion,
        ruleSetVersion: snapshot?.ruleSetVersion,
        graphVersionId: snapshot?.graphVersionId,
      }),
    },
    request,
    200,
    correlation
  );
}

export function serializeRoute(
  route: Awaited<ReturnType<typeof loadCurrentRoute>>,
  metadata: {
    engineVersion?: string;
    ruleSetVersion?: string;
    graphVersionId?: string;
  } = {}
) {
  const steps = route.steps.map(step => ({
    sequence: step.rank,
    action_id: step.actionId,
    title: step.title,
    description: step.description,
    position: step.rank,
    status: step.status,
    state: step.status,
    reason_codes: step.reasonCodes,
    explanation: step.explanation,
    unlock_summary: step.unlocks,
    unlocks: step.unlocks,
    blockers: step.blockedBy,
    blocked_by: step.blockedBy,
    provenance: step.provenance,
    deadline: step.deadline ?? null,
    mandatory_obligation: step.mandatoryObligation ?? false,
  }));
  const focusAction = steps.find(step => step.action_id === route.focusActionId) ?? null;
  return {
    route_id: route.id,
    route_version_id: route.id,
    engine_version: metadata.engineVersion ?? ENGINE_VERSION,
    rule_set_version: metadata.ruleSetVersion ?? RULE_SET_VERSION,
    graph_version: metadata.graphVersionId ?? null,
    routing_snapshot_id: route.snapshotId,
    generated_at: route.createdAt,
    focus_action: focusAction,
    status: route.status,
    route_status: route.status,
    focus_action_id: route.focusActionId ?? null,
    ordered_steps: steps,
    steps,
    explanation_summary: focusAction?.explanation ?? null,
  };
}
