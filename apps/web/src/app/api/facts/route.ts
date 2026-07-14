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
import { checkRateLimit } from '@/lib/rate-limit';

class FactMutationError extends Error {
  constructor(
    public readonly status: number,
    public readonly publicMessage: string
  ) {
    super(publicMessage);
  }
}

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

  if (!(await checkRateLimit(`facts:${userId}`, 60, 60_000))) {
    return NextResponse.json(
      { error: 'Too many Fact updates. Please wait a moment.' },
      { status: 429 }
    );
  }

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
      const created = await db.transaction(async tx => {
        const [row] = await tx
          .insert(factsTable)
          .values({
            id: factId,
            userId,
            factText: JSON.stringify(req.payload),
            status: FactStatus.Proposed,
          })
          .returning();
        await recordProvenance(
          factId,
          req.provenance.source,
          req.provenance.confidence,
          undefined,
          tx
        );
        return row;
      });

      return NextResponse.json({ success: true, fact: serializeFact(created) });
    }

    const result = await db.transaction(async tx => {
      // The version and lifecycle predicates make this transition compare-and-
      // swap: concurrent confirm/reject requests cannot both succeed.
      const [existing] = await tx
        .select()
        .from(factsTable)
        .where(and(eq(factsTable.id, req.factId), eq(factsTable.userId, userId)))
        .limit(1);
      if (!existing) throw new FactMutationError(404, 'Fact not found');
      if (existing.status !== FactStatus.Proposed) {
        throw new FactMutationError(
          409,
          `Only Proposed Facts can be ${req.action}ed.`
        );
      }

      if (req.action === 'reject') {
        const [updated] = await tx
          .update(factsTable)
          .set({
            status: FactStatus.Rejected,
            version: existing.version + 1,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(factsTable.id, req.factId),
              eq(factsTable.userId, userId),
              eq(factsTable.status, FactStatus.Proposed),
              eq(factsTable.version, existing.version)
            )
          )
          .returning();
        if (!updated) {
          throw new FactMutationError(409, 'This Fact changed before rejection completed.');
        }
        return { updated, reroute: null };
      }

      const factsBefore = await loadConfirmedFacts(userId, tx);
      const routeBefore = buildRoute(factsBefore);
      const [updated] = await tx
        .update(factsTable)
        .set({
          status: FactStatus.Confirmed,
          version: existing.version + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(factsTable.id, req.factId),
            eq(factsTable.userId, userId),
            eq(factsTable.status, FactStatus.Proposed),
            eq(factsTable.version, existing.version)
          )
        )
        .returning();
      if (!updated) {
        throw new FactMutationError(409, 'This Fact changed before confirmation completed.');
      }

      await recordProvenance(req.factId, 'user_confirmation', undefined, undefined, tx);
      const factsAfter = await loadConfirmedFacts(userId, tx);
      const routeAfter = buildRoute(factsAfter);
      const reroute = await recordReroute(
        tx,
        userId,
        RerouteReason.FACT_CONFIRMED,
        routeBefore,
        routeAfter,
        factsBefore,
        factsAfter
      );
      return { updated, reroute };
    });

    return NextResponse.json({
      success: true,
      fact: serializeFact(result.updated),
      reroute: result.reroute,
    });
  } catch (error) {
    if (error instanceof FactMutationError) {
      return NextResponse.json({ error: error.publicMessage }, { status: error.status });
    }
    if (error instanceof GraphVersionError) {
      console.error('Confirmation rejected by Route validation:', error.message);
      return NextResponse.json(
        {
          error:
            'Confirming this Fact would create invalid or conflicting Route data, so it remains Proposed. Your Route is unchanged.',
        },
        { status: 422 }
      );
    }
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
