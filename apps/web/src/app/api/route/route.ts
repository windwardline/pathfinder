import { NextResponse } from 'next/server';
import { RouteEngine, RoutingSnapshot, GraphVersion, Fact } from '@pathfinder/core';
import { db, facts, graphVersions, routingSnapshots } from '@pathfinder/core';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 1. Fetch user's confirmed facts
    const userFacts = await db.select().from(facts).where(and(eq(facts.userId, userId), eq(facts.status, 'Confirmed')));

    // Transform DB facts back to domain Fact objects
    const domainFacts: Fact[] = userFacts.map(f => ({
      id: f.id,
      payload: JSON.parse(f.factText),
      status: f.status as 'Confirmed' | 'Proposed' | 'Superseded',
      version: f.version
    }));

    // 2. Build immutable Graph Version
    const graphId = crypto.randomUUID();
    const graph = new GraphVersion(graphId, domainFacts);
    
    await db.insert(graphVersions).values({
      id: graphId,
      userId: userId,
      sequenceNumber: 1, // simplified sequence increment
      snapshotData: domainFacts as any, // Drizzle JSON fields map to arrays/objects directly sometimes, or stringify
    });

    // 3. Build Snapshot
    const snapshotId = crypto.randomUUID();
    const snapshot = new RoutingSnapshot(snapshotId, graph, domainFacts);

    // 4. Engine Sequencing
    const route = RouteEngine.generateRoute(snapshot);

    await db.insert(routingSnapshots).values({
      id: snapshotId,
      userId: userId,
      graphVersionId: graphId,
      focusActionId: route[0]?.actionId || null,
    });

    return NextResponse.json({ success: true, route });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
