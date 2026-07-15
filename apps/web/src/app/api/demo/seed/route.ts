import { NextResponse } from 'next/server';
import {
  FactStatus,
  RerouteReason,
  db,
  facts as factsTable,
  graphVersions,
  routingSnapshots,
  rerouteEvents,
} from '@pathfinder/core';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import {
  buildRoute,
  loadConfirmedFacts,
  recordProvenance,
  recordReroute,
} from '@/lib/route-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { findDemonstrationScenario } from '@/lib/demo-scenarios';

/**
 * Resets the signed-in user's data to one canonical seeded demonstration
 * scenario. Only affects the requesting user's own rows.
 */
export async function POST(request?: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const body = request ? await request.json().catch(() => ({})) : {};
  const scenarioId =
    body && typeof body === 'object' && 'scenarioId' in body && typeof body.scenarioId === 'string'
      ? body.scenarioId
      : 'SD-001';
  const scenario = findDemonstrationScenario(scenarioId);
  if (!scenario) {
    return NextResponse.json(
      { error: 'Unknown demonstration scenario.' },
      { status: 400 }
    );
  }

  if (!(await checkRateLimit(`demo-seed:${userId}`, 20, 60 * 60_000))) {
    return NextResponse.json(
      { error: 'The demonstration scenario was reset too often. Please wait before trying again.' },
      { status: 429 }
    );
  }

  try {
    await db.transaction(async tx => {
      await tx.delete(rerouteEvents).where(eq(rerouteEvents.userId, userId));
      await tx.delete(routingSnapshots).where(eq(routingSnapshots.userId, userId));
      await tx.delete(graphVersions).where(eq(graphVersions.userId, userId));
      await tx.delete(factsTable).where(eq(factsTable.userId, userId));

      const seededAt = new Date();

      const idByRef = new Map<string, string>();
      for (const action of scenario.actions) {
        const factId = crypto.randomUUID();
        idByRef.set(action.ref, factId);
        const factStatus = action.factStatus ?? 'CONFIRMED';
        await tx.insert(factsTable).values({
          id: factId,
          userId,
          factType: 'ACTION',
          factText: JSON.stringify({
            key: 'ACTION',
            value: {
              title: action.title,
              description: action.description,
              status: action.actionStatus,
              ...(action.routing ? { routing: action.routing } : {}),
            },
            sourceText: action.sourceText,
          }),
          status: factStatus,
          confirmedAt: factStatus === FactStatus.Confirmed ? seededAt : null,
          confirmedBy: factStatus === FactStatus.Confirmed ? 'seed-demonstration' : null,
        });
        await recordProvenance(factId, 'seed_demonstration', 100, undefined, tx);
      }

      for (const dependency of scenario.dependencies) {
        const factId = crypto.randomUUID();
        await tx.insert(factsTable).values({
          id: factId,
          userId,
          factType: 'DEPENDENCY',
          factText: JSON.stringify({
            key: 'DEPENDENCY',
            value: {
              sourceId: idByRef.get(dependency.prerequisiteRef),
              targetId: idByRef.get(dependency.dependentRef),
              type: 'BLOCKS',
            },
          }),
          status: FactStatus.Confirmed,
          confirmedAt: seededAt,
          confirmedBy: 'seed-demonstration',
        });
        await recordProvenance(factId, 'seed_demonstration', 100, undefined, tx);
      }

      const seededFacts = await loadConfirmedFacts(userId, tx);
      await recordReroute(
        tx,
        userId,
        RerouteReason.FACT_CONFIRMED,
        buildRoute([]),
        buildRoute(seededFacts),
        [],
        seededFacts,
        'seed-demonstration'
      );
    });

    return NextResponse.json({
      success: true,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      seeded: scenario.actions.length + scenario.dependencies.length,
    });
  } catch (error) {
    console.error('POST /api/demo/seed failed:', error);
    return NextResponse.json(
      { error: 'The demonstration scenario could not be loaded. Please try again.' },
      { status: 500 }
    );
  }
}
