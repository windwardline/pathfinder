import { FactStatus, db, factEvents, facts as factsTable } from '@pathfinder/core';
import { auth } from '@/auth';
import { AIGateway, ExtractionUnavailableError } from '@/services/ai/Gateway';
import { extractRequestSchema } from '@/lib/validation';
import { recordProvenance } from '@/lib/route-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { recordAuditEvent } from '@/lib/audit';
import { IdempotencyConflictError, withIdempotency } from '@/lib/idempotency';

/** Extracts only Proposed Facts; AI never confirms, prioritizes, or sequences. */
export async function POST(request: Request) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
      correlationId: correlation,
    });
  }
  const userId = session.user.id;

  if (!(await checkRateLimit(`extract:${userId}`, 10, 60_000))) {
    return apiError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many extraction requests. Please wait a moment.',
      retryable: true,
      correlationId: correlation,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({
      status: 400,
      code: 'INVALID_JSON',
      message: 'Invalid JSON body',
      correlationId: correlation,
    });
  }
  const parsed = extractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError({
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Please provide between 1 and 5,000 characters of text.',
      correlationId: correlation,
    });
  }

  try {
    const result = await db.transaction(async tx =>
      withIdempotency(
        tx,
        {
          userId,
          operationType: 'AI_EXTRACT_CANDIDATE_FACTS',
          idempotencyKey: parsed.data.idempotencyKey,
          request: parsed.data,
        },
        async () => {
          const candidates = await AIGateway.extractCandidateActions(parsed.data.text);
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
                factType: 'ACTION',
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
            await tx.insert(factEvents).values({
              factId,
              userId,
              eventType: 'PROPOSE',
              actorId: 'pathfinder-ai',
            });
            rows.push({
              id: row.id,
              status: row.status,
              payload,
              confidence: candidate.confidence,
            });
          }
          await recordAuditEvent(
            {
              userId,
              actorId: userId,
              eventType: 'AI_EXTRACTION_COMPLETED',
              resourceType: 'FACT',
              resourceId: 'candidate-batch',
              correlationId: correlation,
              metadata: { candidateCount: rows.length },
            },
            tx
          );
          return { facts: rows };
        }
      )
    );

    return apiSuccess(
      { ...result.value, idempotent_replay: result.replayed },
      request,
      200,
      correlation
    );
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return apiError({
        status: 409,
        code: 'IDEMPOTENCY_CONFLICT',
        message: error.message,
        correlationId: correlation,
      });
    }
    if (error instanceof ExtractionUnavailableError) {
      console.error('Extraction unavailable:', error.message);
      return apiError({
        status: 502,
        code: 'EXTRACTION_UNAVAILABLE',
        message:
          'The extraction service is unavailable right now. You can add Actions manually while we recover.',
        retryable: true,
        correlationId: correlation,
      });
    }
    console.error('POST /api/ai/extract failed:', error);
    return apiError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Extraction failed. Please try again.',
      retryable: true,
      correlationId: correlation,
    });
  }
}
