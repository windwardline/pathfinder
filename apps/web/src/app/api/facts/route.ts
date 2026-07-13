import { NextResponse } from 'next/server';
import { FactStatus, RerouteReason, GraphVersionError, db, facts as factsTable, provenance as provenanceTable } from '@pathfinder/core';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { factsRequestSchema } from '@/lib/validation';
import {
  loadConfirmedFacts,
  buildRoute,
  recordReroute,
  recordProvenance,
  toDomainFact,
} from '@/lib/route-service';

/**
 * Facts API. Proposed Facts never affect the Route; confirming a fact is an
 * explicit user action that may trigger a Reroute, which is computed here and
 * returned so the Route View can explain what changed.
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

  const parsed = factsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const req = parsed.data;

    if (req.action === 'propose') {
      const factId = crypto.randomUUID();
      const [created] = await db
        .insert(factsTable)
        .values({
          id: factId,
          userId,
          factText: JSON.stringify(req.payload),
          status: FactStatus.Proposed,
        })
        .returning();

      await recordProvenance(factId, req.provenance.source, req.provenance.confidence);

      return NextResponse.json({ success: true, fact: serializeFact(created) });
    }

    // confirm / reject operate on an existing Proposed fact owned by the user.
    const [existing] = await db
      .select()
      .from(factsTable)
      .where(and(eq(factsTable.id, req.factId), eq(factsTable.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Fact not found' }, { status: 404 });
    }
    if (existing.status !== FactStatus.Proposed) {
      return NextResponse.json(
        { error: `Only Proposed Facts can be ${req.action}ed.` },
        { status: 409 }
      );
    }

    if (req.action === 'reject') {
      const [updated] = await db
        .update(factsTable)
        .set({ status: FactStatus.Rejected, updatedAt: new Date() })
        .where(and(eq(factsTable.id, req.factId), eq(factsTable.userId, userId)))
        .returning();
      return NextResponse.json({ success: true, fact: serializeFact(updated) });
    }

    // action === 'confirm': capture the Route before, apply, recompute after.
    const factsBefore = await loadConfirmedFacts(userId);
    const routeBefore = buildRoute(factsBefore);

    const [updated] = await db
      .update(factsTable)
      .set({ status: FactStatus.Confirmed, updatedAt: new Date() })
      .where(and(eq(factsTable.id, req.factId), eq(factsTable.userId, userId)))
      .returning();

    await recordProvenance(req.factId, 'user_confirmation');

    const factsAfter = await loadConfirmedFacts(userId);
    let reroute = null;
    try {
      const routeAfter = buildRoute(factsAfter);
      reroute = await recordReroute(
        userId,
        RerouteReason.FACT_CONFIRMED,
        routeBefore,
        routeAfter,
        factsBefore,
        factsAfter
      );
    } catch (e) {
      if (e instanceof GraphVersionError) {
        // The newly confirmed fact makes the graph unbuildable (e.g. a cycle).
        // Revert the confirmation so the last valid Route is preserved.
        await db
          .update(factsTable)
          .set({ status: FactStatus.Proposed, updatedAt: new Date() })
          .where(and(eq(factsTable.id, req.factId), eq(factsTable.userId, userId)));
        console.error('Confirmation reverted, graph rejected:', e.message);
        return NextResponse.json(
          {
            error:
              'Confirming this fact would create conflicting dependencies, so it was left as Proposed. Your Route is unchanged.',
          },
          { status: 422 }
        );
      }
      throw e;
    }

    return NextResponse.json({
      success: true,
      fact: serializeFact(updated),
      reroute,
    });
  } catch (error) {
    console.error('POST /api/facts failed:', error);
    return NextResponse.json(
      { error: 'The request could not be completed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await db
      .select()
      .from(factsTable)
      .where(eq(factsTable.userId, session.user.id))
      .orderBy(desc(factsTable.createdAt));

    const provenanceRows = rows.length
      ? await db
          .select()
          .from(provenanceTable)
          .where(inArray(provenanceTable.factId, rows.map(r => r.id)))
      : [];

    const provenanceByFact = new Map<string, typeof provenanceRows>();
    for (const p of provenanceRows) {
      provenanceByFact.set(p.factId, [...(provenanceByFact.get(p.factId) || []), p]);
    }

    return NextResponse.json({
      success: true,
      facts: rows.map(row => ({
        ...serializeFact(row),
        provenance: (provenanceByFact.get(row.id) || []).map(p => ({
          source: p.source,
          confidence: p.confidence,
          createdAt: p.createdAt,
        })),
      })),
    });
  } catch (error) {
    console.error('GET /api/facts failed:', error);
    return NextResponse.json(
      { error: 'Facts could not be loaded. Please try again.' },
      { status: 500 }
    );
  }
}

function serializeFact(row: typeof factsTable.$inferSelect) {
  const domain = toDomainFact(row);
  return {
    id: row.id,
    status: row.status,
    payload: domain?.payload ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
