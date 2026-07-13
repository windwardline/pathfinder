import { NextResponse } from 'next/server';
import { FactStatus, RerouteReason, db, facts as factsTable } from '@pathfinder/core';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { completeActionSchema } from '@/lib/validation';
import {
  loadConfirmedFacts,
  buildRoute,
  recordReroute,
  recordProvenance,
} from '@/lib/route-service';

/**
 * Marks a confirmed ACTION fact as completed and records the resulting
 * Reroute so the Route View can explain what advanced and what unlocked.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = completeActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { actionId } = parsed.data;

  try {
    const [existing] = await db
      .select()
      .from(factsTable)
      .where(and(eq(factsTable.id, actionId), eq(factsTable.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    if (existing.status !== FactStatus.Confirmed) {
      return NextResponse.json(
        { error: 'Only Actions from Confirmed Facts can be completed.' },
        { status: 409 }
      );
    }

    let payload: { key?: string; value?: { status?: string } };
    try {
      payload = JSON.parse(existing.factText);
    } catch {
      return NextResponse.json({ error: 'This fact cannot be completed.' }, { status: 422 });
    }
    if (payload?.key !== 'ACTION' || typeof payload.value !== 'object' || payload.value === null) {
      return NextResponse.json({ error: 'This fact is not an Action.' }, { status: 422 });
    }
    if (payload.value.status === 'COMPLETED') {
      return NextResponse.json({ error: 'This Action is already completed.' }, { status: 409 });
    }

    const factsBefore = await loadConfirmedFacts(userId);
    const routeBefore = buildRoute(factsBefore);

    payload.value.status = 'COMPLETED';
    const [updated] = await db
      .update(factsTable)
      .set({ factText: JSON.stringify(payload), updatedAt: new Date() })
      .where(and(eq(factsTable.id, actionId), eq(factsTable.userId, userId)))
      .returning();

    await recordProvenance(actionId, 'user_completion', 100);

    const factsAfter = await loadConfirmedFacts(userId);
    const routeAfter = buildRoute(factsAfter);
    const reroute = await recordReroute(
      userId,
      RerouteReason.ACTION_COMPLETED,
      routeBefore,
      routeAfter,
      factsAfter
    );

    return NextResponse.json({
      success: true,
      factId: updated.id,
      reroute,
    });
  } catch (error) {
    console.error('POST /api/actions/complete failed:', error);
    return NextResponse.json(
      { error: 'The Action could not be completed. Please try again.' },
      { status: 500 }
    );
  }
}
