import { NextResponse } from 'next/server';
import { FactStatus, db, facts as factsTable } from '@pathfinder/core';
import { auth } from '@/auth';
import { AIGateway, ExtractionUnavailableError } from '@/services/ai/Gateway';
import { extractRequestSchema } from '@/lib/validation';
import { recordProvenance } from '@/lib/route-service';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Extracts candidate actions from pasted text and stores them as Proposed
 * Facts for explicit review. Proposed Facts never affect the Route until the
 * user confirms them (ADR-004).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  if (!(await checkRateLimit(`extract:${userId}`, 10, 60_000))) {
    return NextResponse.json(
      { error: 'Too many extraction requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = extractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please provide between 1 and 5,000 characters of text.' },
      { status: 400 }
    );
  }

  try {
    const candidates = await AIGateway.extractCandidateActions(parsed.data.text);

    const created = await db.transaction(async tx => {
      const rows = [];
      for (const candidate of candidates) {
        const factId = crypto.randomUUID();
        const payload = {
          key: 'ACTION' as const,
          value: {
            title: candidate.title,
            description: candidate.description,
            status: 'OPEN' as const,
          },
          sourceText: candidate.sourceText,
        };
        const [row] = await tx
          .insert(factsTable)
          .values({
            id: factId,
            userId,
            factText: JSON.stringify(payload),
            status: FactStatus.Proposed,
          })
          .returning();
        await recordProvenance(
          factId,
          'ai_extraction',
          candidate.confidence,
          undefined,
          tx
        );
        rows.push({
          id: row.id,
          status: row.status,
          payload,
          confidence: candidate.confidence,
        });
      }
      return rows;
    });

    return NextResponse.json({ success: true, facts: created });
  } catch (error) {
    if (error instanceof ExtractionUnavailableError) {
      console.error('Extraction unavailable:', error.message);
      return NextResponse.json(
        {
          error:
            'The extraction service is unavailable right now. You can add actions manually while we recover.',
        },
        { status: 502 }
      );
    }
    console.error('POST /api/ai/extract failed:', error);
    return NextResponse.json(
      { error: 'Extraction failed. Please try again.' },
      { status: 500 }
    );
  }
}
