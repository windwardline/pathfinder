import { NextResponse } from 'next/server';
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
    const { actionId } = body;

    if (!actionId) {
      return NextResponse.json({ error: 'Missing actionId' }, { status: 400 });
    }

    // Find the fact that represents this action
    const existing = await db
      .select()
      .from(facts)
      .where(and(eq(facts.id, actionId), eq(facts.userId, userId)))
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Action Fact not found' }, { status: 404 });
    }

    const payload = JSON.parse(existing[0].factText);
    
    // Ensure it's an action
    if (payload.key !== 'ACTION') {
      return NextResponse.json({ error: 'Fact is not an ACTION' }, { status: 400 });
    }

    // Update the status to COMPLETED
    payload.value.status = 'COMPLETED';

    const updatedFact = await db.update(facts)
      .set({ 
        factText: JSON.stringify(payload), 
        updatedAt: new Date() 
      })
      .where(eq(facts.id, actionId))
      .returning();

    // Log provenance for completion
    await db.insert(provenance).values({
      factId: actionId,
      source: 'user_completion',
      confidence: 100,
    });

    return NextResponse.json({ success: true, fact: updatedFact[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
