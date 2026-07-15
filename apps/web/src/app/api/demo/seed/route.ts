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

  const [existingFact] = await db
    .select({ id: factsTable.id })
    .from(factsTable)
    .where(eq(factsTable.userId, userId))
    .limit(1);
  if (request && existingFact && body.confirmReplaceExisting !== true) {
    return NextResponse.json(
      {
        error:
          'Loading a demonstration replaces your current Route data. Confirm the replacement to continue.',
        error_code: 'RESET_CONFIRMATION_REQUIRED',
      },
      { status: 409 }
    );
  }

  if (!(await checkRateLimit(`demo-seed:${userId}`, 60, 60 * 60_000))) {
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
      for (const goal of scenario.goals ?? []) idByRef.set(goal.ref, crypto.randomUUID());
      for (const action of scenario.actions) idByRef.set(action.ref, crypto.randomUUID());

      const resolveRef = (ref: string) => {
        const id = idByRef.get(ref);
        if (!id) throw new Error(`Demonstration fixture references unknown item: ${ref}`);
        return id;
      };
      const atOffset = (hours: number) =>
        new Date(seededAt.getTime() + hours * 60 * 60_000).toISOString();
      const insertFact = async (
        factType: 'ACTION' | 'DEPENDENCY' | 'GOAL' | 'REQUIREMENT' | 'OBLIGATION' | 'CONSTRAINT' | 'DEADLINE' | 'BLOCKER',
        payload: Record<string, unknown>,
        status: FactStatus = FactStatus.Confirmed,
        id = crypto.randomUUID()
      ) => {
        await tx.insert(factsTable).values({
          id,
          userId,
          factType,
          factText: JSON.stringify(payload),
          status,
          confirmedAt: status === FactStatus.Confirmed ? seededAt : null,
          confirmedBy: status === FactStatus.Confirmed ? 'seed-demonstration' : null,
        });
        await recordProvenance(id, 'seed_demonstration', 100, undefined, tx);
      };

      for (const goal of scenario.goals ?? []) {
        await insertFact(
          'GOAL',
          {
            key: 'GOAL',
            value: { title: goal.title, status: goal.status, priority: goal.priority },
          },
          FactStatus.Confirmed,
          resolveRef(goal.ref)
        );
      }

      for (const action of scenario.actions) {
        const factStatus = action.factStatus ?? 'CONFIRMED';
        await insertFact(
          'ACTION',
          {
            key: 'ACTION',
            value: {
              title: action.title,
              description: action.description,
              status: action.actionStatus,
              ...(action.goalRef ? { goalId: resolveRef(action.goalRef) } : {}),
              ...(action.routing ? { routing: action.routing } : {}),
            },
            sourceText: action.sourceText,
          },
          factStatus as FactStatus,
          resolveRef(action.ref)
        );
      }

      for (const dependency of scenario.dependencies) {
        await insertFact('DEPENDENCY', {
            key: 'DEPENDENCY',
            value: {
              sourceId: resolveRef(dependency.prerequisiteRef),
              targetId: resolveRef(dependency.dependentRef),
              type: 'BLOCKS',
            },
          });
      }

      for (const requirement of scenario.requirements ?? []) {
        await insertFact('REQUIREMENT', {
          key: 'REQUIREMENT',
          value: {
            description: requirement.description,
            status: requirement.status,
            hardness: requirement.hardness,
            targetActionId: resolveRef(requirement.targetRef),
            ...(requirement.resolutionRef
              ? { resolutionActionId: resolveRef(requirement.resolutionRef) }
              : {}),
          },
        });
      }

      for (const constraint of scenario.constraints ?? []) {
        await insertFact('CONSTRAINT', {
          key: 'CONSTRAINT',
          value: {
            constraintType: constraint.constraintType,
            description: constraint.description,
            status: constraint.status,
            targetActionIds: constraint.targetRefs.map(resolveRef),
            ...(constraint.resolutionRef
              ? { resolutionActionId: resolveRef(constraint.resolutionRef) }
              : {}),
          },
        }, constraint.factStatus === 'PROPOSED' ? FactStatus.Proposed : FactStatus.Confirmed);
      }

      for (const obligation of scenario.obligations ?? []) {
        await insertFact('OBLIGATION', {
          key: 'OBLIGATION',
          value: {
            title: obligation.title,
            status: obligation.status,
            startAt: atOffset(obligation.startsInHours),
            ...(obligation.durationHours
              ? { endAt: atOffset(obligation.startsInHours + obligation.durationHours) }
              : {}),
            ...(obligation.conflictRefs
              ? { conflictActionIds: obligation.conflictRefs.map(resolveRef) }
              : {}),
            ...(obligation.resolutionRef
              ? { resolutionActionId: resolveRef(obligation.resolutionRef) }
              : {}),
          },
        }, obligation.factStatus === 'PROPOSED' ? FactStatus.Proposed : FactStatus.Confirmed);
      }

      for (const deadline of scenario.deadlines ?? []) {
        await insertFact('DEADLINE', {
          key: 'DEADLINE',
          value: {
            title: deadline.title,
            dueAt: atOffset(deadline.dueInHours),
            severity: deadline.severity,
            targetActionId: resolveRef(deadline.targetRef),
          },
        }, deadline.factStatus === 'PROPOSED' ? FactStatus.Proposed : FactStatus.Confirmed);
      }

      for (const blocker of scenario.blockers ?? []) {
        await insertFact('BLOCKER', {
          key: 'BLOCKER',
          value: {
            targetActionId: resolveRef(blocker.targetRef),
            reasonCode: blocker.reasonCode,
            description: blocker.description,
            active: blocker.active,
            ...(blocker.resolutionRef
              ? { resolutionActionId: resolveRef(blocker.resolutionRef) }
              : {}),
          },
        }, blocker.factStatus === 'PROPOSED' ? FactStatus.Proposed : FactStatus.Confirmed);
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
      seeded:
        scenario.actions.length +
        scenario.dependencies.length +
        (scenario.goals?.length ?? 0) +
        (scenario.requirements?.length ?? 0) +
        (scenario.constraints?.length ?? 0) +
        (scenario.obligations?.length ?? 0) +
        (scenario.deadlines?.length ?? 0) +
        (scenario.blockers?.length ?? 0),
    });
  } catch (error) {
    console.error('POST /api/demo/seed failed:', error);
    return NextResponse.json(
      { error: 'The demonstration scenario could not be loaded. Please try again.' },
      { status: 500 }
    );
  }
}
