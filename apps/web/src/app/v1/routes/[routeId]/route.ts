import { and, eq } from 'drizzle-orm';
import { db, graphVersions, routingSnapshots } from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { routeFromSnapshotData } from '@/lib/route-service';
import { serializeRoute } from '../current/route';

export async function GET(request: Request, context: { params: Promise<{ routeId: string }> }) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const { routeId } = await context.params;
  const [snapshot] = await db
    .select()
    .from(routingSnapshots)
    .where(and(eq(routingSnapshots.id, routeId), eq(routingSnapshots.userId, session.user.id)))
    .limit(1);
  if (!snapshot) {
    return apiError({ status: 404, code: 'ROUTE_NOT_FOUND', message: 'Route Version not found', correlationId: correlation });
  }
  const [graph] = await db
    .select()
    .from(graphVersions)
    .where(and(eq(graphVersions.id, snapshot.graphVersionId), eq(graphVersions.userId, session.user.id)))
    .limit(1);
  const route = graph ? routeFromSnapshotData(graph.snapshotData, snapshot.id) : null;
  if (!route) {
    return apiError({ status: 422, code: 'ROUTE_REPLAY_FAILED', message: 'This Route Version could not be replayed.', correlationId: correlation });
  }
  return apiSuccess(
    {
      route: {
        ...serializeRoute(route, {
          engineVersion: snapshot.engineVersion,
          ruleSetVersion: snapshot.ruleSetVersion,
          graphVersionId: snapshot.graphVersionId,
        }),
        engine_version: snapshot.engineVersion,
        rule_set_version: snapshot.ruleSetVersion,
        input_snapshot_hash: graph.inputSnapshotHash,
      },
    },
    request,
    200,
    correlation
  );
}
