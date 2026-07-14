import { NextResponse } from 'next/server';
import {
  db,
  graphVersions,
  routingSnapshots,
  rerouteEvents,
  computeRouteDifference,
} from '@pathfinder/core';
import { desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { routeFromSnapshotData } from '@/lib/route-service';

/**
 * Route History: Reroute Events with their structured Route Differences.
 * Differences are recomputed from stored immutable graph versions — the
 * engine is deterministic, so stored snapshots fully reproduce any Route.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const events = await db
      .select()
      .from(rerouteEvents)
      .where(eq(rerouteEvents.userId, userId))
      .orderBy(desc(rerouteEvents.createdAt))
      .limit(20);

    const snapshotIds = [
      ...new Set(
        events.flatMap(e => [e.previousRouteId, e.newRouteId]).filter((id): id is string => !!id)
      ),
    ];
    const snapshots = snapshotIds.length
      ? await db
          .select()
          .from(routingSnapshots)
          .where(inArray(routingSnapshots.id, snapshotIds))
      : [];
    const snapshotById = new Map(snapshots.map(s => [s.id, s]));

    const graphIds = [...new Set(snapshots.map(s => s.graphVersionId))];
    const graphs = graphIds.length
      ? await db.select().from(graphVersions).where(inArray(graphVersions.id, graphIds))
      : [];
    const graphById = new Map(graphs.map(g => [g.id, g]));

    const routeForSnapshot = (snapshotId: string | null) => {
      if (!snapshotId) return null;
      const snapshot = snapshotById.get(snapshotId);
      if (!snapshot) return null;
      const graph = graphById.get(snapshot.graphVersionId);
      if (!graph) return null;
      return routeFromSnapshotData(graph.snapshotData, snapshot.id);
    };

    const history = events.map(event => {
      const previousRoute = routeForSnapshot(event.previousRouteId);
      const newRoute = routeForSnapshot(event.newRouteId);
      const difference =
        previousRoute && newRoute ? computeRouteDifference(previousRoute, newRoute) : null;
      return {
        id: event.id,
        triggerReason: event.triggerReason,
        createdAt: event.createdAt,
        difference,
        newFocus: newRoute?.focusActionId
          ? newRoute.steps.find(s => s.actionId === newRoute.focusActionId)?.title ?? null
          : null,
      };
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('GET /api/history failed:', error);
    return NextResponse.json(
      { error: 'Route History could not be loaded. Please try again.' },
      { status: 500 }
    );
  }
}
