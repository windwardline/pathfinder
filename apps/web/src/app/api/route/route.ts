import { NextResponse } from 'next/server';
import { RouteEngine, RoutingSnapshot, GraphVersion, Fact, FactStatus } from '@pathfinder/core';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { facts } = body as { facts: Fact[] };

    // 1. Build immutable Graph Version
    const graph = new GraphVersion(`gv_${Date.now()}`, facts);

    // 2. Build Snapshot
    const snapshot = new RoutingSnapshot(`snap_${Date.now()}`, graph, facts);

    // 3. Engine Sequencing
    const route = RouteEngine.generateRoute(snapshot);

    return NextResponse.json({ success: true, route });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
