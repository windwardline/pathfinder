import { NextResponse } from 'next/server';
import { FactLifecycle, Provenance } from '@pathfinder/core';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, factId, payload, provenance } = body;

    if (action === 'propose') {
      const fact = FactLifecycle.propose(factId || `fact_${Date.now()}`, payload, provenance);
      // In a real implementation, persist to Supabase here
      return NextResponse.json({ success: true, fact });
    }

    if (action === 'confirm') {
      // Re-hydrate the fact from DB (mocked for phase 7 API)
      const proposedFact = FactLifecycle.propose(factId, payload); 
      const confirmedFact = FactLifecycle.confirm(proposedFact, provenance);
      // Persist to Supabase here
      return NextResponse.json({ success: true, fact: confirmedFact });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
