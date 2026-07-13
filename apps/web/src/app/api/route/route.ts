import { NextResponse } from 'next/server';
import { FactStatus, GraphVersionError } from '@pathfinder/core';
import { auth } from '@/auth';
import { loadFactRows, toDomainFact, buildRoute } from '@/lib/route-service';

/**
 * Returns the current Route computed from the user's Confirmed Facts.
 * Route generation is pure: reads never write. Snapshots and Reroute
 * Events are persisted by the mutations that change Confirmed Facts.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await loadFactRows(session.user.id);
    const confirmed = rows
      .filter(r => r.status === FactStatus.Confirmed)
      .map(toDomainFact)
      .filter(f => f !== null);
    const proposedCount = rows.filter(r => r.status === FactStatus.Proposed).length;

    const route = buildRoute(confirmed);

    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        status: route.status,
        focusActionId: route.focusActionId ?? null,
        steps: route.steps,
        createdAt: route.createdAt,
      },
      proposedCount,
      confirmedCount: confirmed.length,
    });
  } catch (error) {
    if (error instanceof GraphVersionError) {
      console.error('Route engine rejected the confirmed fact set:', error.message);
      return NextResponse.json(
        {
          success: false,
          error:
            'Your Route could not be recalculated because the confirmed facts conflict. Your last valid Route is unchanged.',
        },
        { status: 422 }
      );
    }
    console.error('GET /api/route failed:', error);
    return NextResponse.json(
      { success: false, error: 'The Route could not be loaded. Please try again.' },
      { status: 500 }
    );
  }
}
