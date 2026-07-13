import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AIGateway } from '@/services/ai/Gateway';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const facts = await AIGateway.extractCandidateFacts(text);
    return NextResponse.json({ success: true, facts });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
