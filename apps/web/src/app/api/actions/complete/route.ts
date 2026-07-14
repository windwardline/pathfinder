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
import { checkRateLimit } from '@/lib/rate-limit';

class ActionMutationError extends Error {
  constructor(
    public readonly status: number,
    public readonly publicMessage: string
  ) {
    super(publicMessage);
  }
}

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

  if (!(await checkRateLimit(`complete:${userId}`, 30, 60_000))) {
    return NextResponse.json(
      { error: 'Too many Action updates. Please wait a moment.' },
      { status: 429 }
    );
  }

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
    const result = await db.transaction(async tx => {
      const [existing] = await tx
        .select()
        .from(factsTable)
        .where(and(eq(factsTable.id, actionId), eq(factsTable.userId, userId)))
        .limit(1);
      if (!existing) throw new ActionMutationError(404, 'Action not found');
      if (existing.status !== FactStatus.Confirmed) {
        throw new ActionMutationError(
          409,
          'Only Actions from Confirmed Facts can be completed.'
        );
      }

      let payload: { key?: string; value?: { status?: string } };
      try {
        payload = JSON.parse(existing.factText);
      } catch {
        throw new ActionMutationError(422, 'This Fact cannot be completed.');
      }
      if (payload?.key !== 'ACTION' || typeof payload.value !== 'object' || !payload.value) {
        throw new ActionMutationError(422, 'This Fact is not an Action.');
      }
      if (payload.value.status === 'COMPLETED') {
        throw new ActionMutationError(409, 'This Action is already completed.');
      }

      const factsBefore = await loadConfirmedFacts(userId, tx);
      const routeBefore = buildRoute(factsBefore);
      payload.value.status = 'COMPLETED';
      const [updated] = await tx
        .update(factsTable)
        .set({
          factText: JSON.stringify(payload),
          version: existing.version + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(factsTable.id, actionId),
            eq(factsTable.userId, userId),
            eq(factsTable.status, FactStatus.Confirmed),
            eq(factsTable.version, existing.version)
          )
        )
        .returning();
      if (!updated) {
        throw new ActionMutationError(409, 'This Action changed before completion finished.');
      }

      await recordProvenance(actionId, 'user_completion', 100, undefined, tx);
      const factsAfter = await loadConfirmedFacts(userId, tx);
      const routeAfter = buildRoute(factsAfter);
      const reroute = await recordReroute(
        tx,
        userId,
        RerouteReason.ACTION_COMPLETED,
        routeBefore,
        routeAfter,
        factsBefore,
        factsAfter
      );
      return { updated, reroute };
    });

    return NextResponse.json({
      success: true,
      factId: result.updated.id,
      reroute: result.reroute,
    });
  } catch (error) {
    if (error instanceof ActionMutationError) {
      return NextResponse.json({ error: error.publicMessage }, { status: error.status });
    }
    console.error('POST /api/actions/complete failed:', error);
    return NextResponse.json(
      { error: 'The Action could not be completed. Please try again.' },
      { status: 500 }
    );
  }
}
