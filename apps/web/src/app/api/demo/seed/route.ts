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

interface SeedAction {
  ref: string;
  title: string;
  description: string;
  status: 'OPEN' | 'COMPLETED';
  sourceText?: string;
}

// SD-001 "First-Time User" seeded demonstration scenario. Fictional data per
// the testing-strategy rules; the identification card is the canonical Focus
// Action, unlocking employment onboarding, housing, and banking (GF-002).
const SEED_ACTIONS: SeedAction[] = [
  {
    ref: 'birth-certificate',
    title: 'Request your birth certificate',
    description: 'Order a certified copy from the county records office. Required for the state ID application.',
    status: 'COMPLETED',
    sourceText: 'Bring a certified birth certificate to your ID appointment. — Identification guidance packet',
  },
  {
    ref: 'state-id',
    title: 'Obtain a state identification card',
    description: 'Visit the DMV with your birth certificate and proof of address. Fee waivers are available on request.',
    status: 'OPEN',
    sourceText: 'A current state ID is required before onboarding paperwork can be processed. — Harbor Light Logistics offer letter',
  },
  {
    ref: 'employment-onboarding',
    title: 'Complete employment onboarding at Harbor Light Logistics',
    description: 'Submit your I-9 and direct-deposit forms to HR. Your offer letter lists what to bring.',
    status: 'OPEN',
    sourceText: 'Please complete onboarding within two weeks of your start date. — Harbor Light Logistics offer letter',
  },
  {
    ref: 'housing-application',
    title: 'Submit the housing application at Riverside Commons',
    description: 'File the supportive-housing application with a copy of your state ID attached.',
    status: 'OPEN',
    sourceText: 'Applications require a government-issued photo ID. — Riverside Commons application checklist',
  },
  {
    ref: 'checking-account',
    title: 'Open a checking account',
    description: 'A basic account lets your paychecks arrive by direct deposit. Bring your state ID.',
    status: 'OPEN',
    sourceText: 'Direct deposit requires an active checking account. — Harbor Light Logistics onboarding guide',
  },
  {
    ref: 'supervision-checkin',
    title: 'Schedule your weekly supervision check-in',
    description: 'Set a recurring time with your supervision officer that will not conflict with your work shifts.',
    status: 'OPEN',
    sourceText: 'Check-ins are required weekly; reschedule at least 48 hours ahead. — Supervision schedule',
  },
];

// BLOCKS edges: [prerequisite, dependent]
const SEED_DEPENDENCIES: Array<[string, string]> = [
  ['birth-certificate', 'state-id'],
  ['state-id', 'employment-onboarding'],
  ['state-id', 'housing-application'],
  ['state-id', 'checking-account'],
];

/**
 * Resets the signed-in user's data to the seeded demonstration scenario
 * (SD-001). Only affects the requesting user's own rows.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  if (!(await checkRateLimit(`demo-seed:${userId}`, 5, 60 * 60_000))) {
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
      for (const action of SEED_ACTIONS) {
        const factId = crypto.randomUUID();
        idByRef.set(action.ref, factId);
        await tx.insert(factsTable).values({
          id: factId,
          userId,
          factType: 'ACTION',
          factText: JSON.stringify({
            key: 'ACTION',
            value: { title: action.title, description: action.description, status: action.status },
            sourceText: action.sourceText,
          }),
          status: FactStatus.Confirmed,
          confirmedAt: seededAt,
          confirmedBy: 'seed-demonstration',
        });
        await recordProvenance(factId, 'seed_demonstration', 100, undefined, tx);
      }

      for (const [fromRef, toRef] of SEED_DEPENDENCIES) {
        const factId = crypto.randomUUID();
        await tx.insert(factsTable).values({
          id: factId,
          userId,
          factType: 'DEPENDENCY',
          factText: JSON.stringify({
            key: 'DEPENDENCY',
            value: {
              sourceId: idByRef.get(fromRef),
              targetId: idByRef.get(toRef),
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

    return NextResponse.json({ success: true, seeded: SEED_ACTIONS.length + SEED_DEPENDENCIES.length });
  } catch (error) {
    console.error('POST /api/demo/seed failed:', error);
    return NextResponse.json(
      { error: 'The demonstration scenario could not be loaded. Please try again.' },
      { status: 500 }
    );
  }
}
