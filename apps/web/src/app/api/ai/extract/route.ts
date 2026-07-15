import { FactStatus, db, factEvents, facts as factsTable } from '@pathfinder/core';
import { auth } from '@/auth';
import { AIGateway, ExtractionUnavailableError } from '@/services/ai/Gateway';
import { extractRequestSchema } from '@/lib/validation';
import { recordProvenance } from '@/lib/route-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { recordAuditEvent } from '@/lib/audit';
import { IdempotencyConflictError, withIdempotency } from '@/lib/idempotency';
import { deriveDeadlineSeverity } from '@/lib/deadline-policy';

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
          const candidates = await AIGateway.extractCandidateFacts(parsed.data.text);
          const actionIds = new Map<string, string>();
          for (const candidate of candidates) {
            if (candidate.factType === 'ACTION') {
              const titleKey = normalizeTitle(candidate.title);
              if (!actionIds.has(titleKey)) actionIds.set(titleKey, crypto.randomUUID());
            }
          }
          const rows = [];
          let omittedCandidates = 0;
          const persistedActionTitles = new Set<string>();
          for (const candidate of candidates) {
            const actionTitleKey = candidate.factType === 'ACTION'
              ? normalizeTitle(candidate.title)
              : undefined;
            if (actionTitleKey && persistedActionTitles.has(actionTitleKey)) {
              omittedCandidates += 1;
              continue;
            }
            const factId = candidate.factType === 'ACTION'
              ? actionIds.get(actionTitleKey!)!
              : crypto.randomUUID();
            const targetActionId = 'targetActionTitle' in candidate
              ? actionIds.get(normalizeTitle(candidate.targetActionTitle))
              : undefined;
            // Never invent a relationship: unresolved domain candidates are
            // omitted instead of being attached to an arbitrary Action.
            if ('targetActionTitle' in candidate && !targetActionId) {
              omittedCandidates += 1;
              continue;
            }
            const payload = candidatePayload(candidate, targetActionId);
            const [row] = await tx
              .insert(factsTable)
              .values({
                id: factId,
                userId,
                factType: payload.key,
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
            if (actionTitleKey) persistedActionTitles.add(actionTitleKey);
          }
          await recordAuditEvent(
            {
              userId,
              actorId: userId,
              eventType: 'AI_EXTRACTION_COMPLETED',
              resourceType: 'FACT',
              resourceId: 'candidate-batch',
              correlationId: correlation,
              metadata: { candidateCount: rows.length, omittedCandidateCount: omittedCandidates },
            },
            tx
          );
          return { facts: rows, omittedCandidates };
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
          'The extraction service is unavailable right now. You can add Facts manually while we recover.',
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

function normalizeTitle(value: string) {
  return value.trim().toLocaleLowerCase('en-US');
}

function candidatePayload(
  candidate: Awaited<ReturnType<typeof AIGateway.extractCandidateFacts>>[number],
  targetActionId?: string
) {
  const sourceText = candidate.sourceText;
  if (candidate.factType === 'ACTION') {
    return {
      key: 'ACTION' as const,
      value: { title: candidate.title, description: candidate.description, status: 'OPEN' as const },
      sourceText,
    };
  }
  if (candidate.factType === 'GOAL') {
    return {
      key: 'GOAL' as const,
      value: { title: candidate.title, status: 'ACTIVE' as const, priority: 50 },
      sourceText,
    };
  }
  if (candidate.factType === 'OBLIGATION') {
    return {
      key: 'OBLIGATION' as const,
      value: {
        title: candidate.title,
        status: 'ACTIVE' as const,
        startAt: candidate.startAt,
        ...(candidate.endAt ? { endAt: candidate.endAt } : {}),
      },
      sourceText,
    };
  }
  if (candidate.factType === 'DEADLINE') {
    return {
      key: 'DEADLINE' as const,
      value: {
        title: candidate.title,
        dueAt: candidate.dueAt,
        severity: deriveDeadlineSeverity(candidate.dueAt),
        targetActionId: targetActionId!,
      },
      sourceText,
    };
  }
  if (candidate.factType === 'REQUIREMENT') {
    return {
      key: 'REQUIREMENT' as const,
      value: {
        description: candidate.description || candidate.title,
        status: 'UNSATISFIED' as const,
        hardness: candidate.hardness,
        targetActionId: targetActionId!,
      },
      sourceText,
    };
  }
  if (candidate.factType === 'CONSTRAINT') {
    return {
      key: 'CONSTRAINT' as const,
      value: {
        constraintType: candidate.constraintType,
        description: candidate.description || candidate.title,
        status: 'ACTIVE' as const,
        targetActionIds: [targetActionId!],
      },
      sourceText,
    };
  }
  return {
    key: 'BLOCKER' as const,
    value: {
      targetActionId: targetActionId!,
      reasonCode: 'DOCUMENT_SUPPORTED_BLOCKER',
      description: candidate.description || candidate.title,
      active: true,
    },
    sourceText,
  };
}
