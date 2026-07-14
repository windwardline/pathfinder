import { and, desc, eq, inArray } from 'drizzle-orm';
import { db, graphVersions, routingSnapshots } from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { routeFromSnapshotData } from '@/lib/route-service';
import { serializeRoute } from './current/route';

export async function GET(request: Request) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const userId = session.user.id;
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100);
  const snapshots = await db
    .select()
    .from(routingSnapshots)
    .where(eq(routingSnapshots.userId, userId))
    .orderBy(desc(routingSnapshots.createdAt), desc(routingSnapshots.id))
    .limit(limit);
  const graphs = snapshots.length
    ? await db
        .select()
        .from(graphVersions)
        .where(
          and(
            eq(graphVersions.userId, userId),
            inArray(graphVersions.id, snapshots.map(snapshot => snapshot.graphVersionId))
          )
        )
    : [];
  const graphById = new Map(graphs.map(graph => [graph.id, graph]));
  const routes = snapshots.flatMap(snapshot => {
    const graph = graphById.get(snapshot.graphVersionId);
    const route = graph ? routeFromSnapshotData(graph.snapshotData, snapshot.id) : null;
    return route
      ? [{
          ...serializeRoute(route, {
            engineVersion: snapshot.engineVersion,
            ruleSetVersion: snapshot.ruleSetVersion,
            graphVersionId: snapshot.graphVersionId,
          }),
          engine_version: snapshot.engineVersion,
          rule_set_version: snapshot.ruleSetVersion,
          input_snapshot_hash: graph!.inputSnapshotHash,
        }]
      : [];
  });
  return apiSuccess({ routes, page: { limit, count: routes.length } }, request, 200, correlation);
}
