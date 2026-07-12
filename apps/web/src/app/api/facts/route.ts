import { NextResponse } from 'next/server';
import { FactLifecycle } from '@pathfinder/core';
import { db, facts, provenance } from '@pathfinder/core';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { action, factId, payload, provenance: provPayload } = body;

    if (action === 'propose') {
      const fact = FactLifecycle.propose(factId || crypto.randomUUID(), payload, provPayload);
      
      const newFact = await db.insert(facts).values({
        id: fact.id,
        userId: userId,
        factText: JSON.stringify(fact.payload),
        status: fact.status,
        version: fact.version,
      }).returning();

      if (provPayload) {
        await db.insert(provenance).values({
          factId: fact.id,
          source: provPayload.source,
          confidence: provPayload.confidence,
        });
      }

      return NextResponse.json({ success: true, fact: newFact[0] });
    }

    if (action === 'confirm') {
      // Find the fact
      const existing = await db.select().from(facts).where(and(eq(facts.id, factId), eq(facts.userId, userId))).limit(1);
      if (!existing || existing.length === 0) {
        return NextResponse.json({ error: 'Fact not found' }, { status: 404 });
      }

      const proposedFact = FactLifecycle.propose(existing[0].id, JSON.parse(existing[0].factText)); 
      const confirmedFact = FactLifecycle.confirm(proposedFact, provPayload);
      
      const updatedFact = await db.update(facts)
        .set({ status: confirmedFact.status, updatedAt: new Date() })
        .where(eq(facts.id, factId))
        .returning();

      await db.insert(provenance).values({
        factId: factId,
        source: provPayload.source,
        confidence: provPayload.confidence,
      });

      return NextResponse.json({ success: true, fact: updatedFact[0] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const allFacts = await db.select().from(facts).where(eq(facts.userId, userId));
    return NextResponse.json({ facts: allFacts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
