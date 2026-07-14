import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, facts, provenance } from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, correlationId } from '@/lib/api-response';
import { factPayloadSchema } from '@/lib/validation';
import { forwardFactTransition, requestBody } from '../transition';

const schema = z.object({
  replacement_value: z.unknown(),
  provenance_id: z.string().uuid(),
  reason_code: z.string().trim().min(1).max(80),
  idempotency_key: z.string().trim().min(1).max(200),
});

export async function POST(request: Request, context: { params: Promise<{ factId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlationId(request) });
  }
  const parsed = schema.safeParse(await requestBody(request));
  const { factId } = await context.params;
  const [current] = await db
    .select()
    .from(facts)
    .where(and(eq(facts.id, factId), eq(facts.userId, session.user.id)))
    .limit(1);
  if (!parsed.success || !current) {
    return apiError({ status: 400, code: 'INVALID_REQUEST', message: 'Invalid supersession request', correlationId: correlationId(request) });
  }
  const payload = factPayloadSchema.safeParse({ key: current.factType, value: parsed.data.replacement_value });
  if (!payload.success) {
    return apiError({ status: 400, code: 'INVALID_FACT_VALUE', message: 'The replacement value is invalid.', details: payload.error.flatten().fieldErrors, correlationId: correlationId(request) });
  }
  const [source] = await db
    .select()
    .from(provenance)
    .where(
      and(
        eq(provenance.id, parsed.data.provenance_id),
        eq(provenance.userId, current.userId),
        eq(provenance.status, 'DRAFT')
      )
    )
    .limit(1);
  if (!source) {
    return apiError({
      status: 404,
      code: 'PROVENANCE_NOT_FOUND',
      message: 'The draft provenance record was not found.',
      correlationId: correlationId(request),
    });
  }
  const response = await forwardFactTransition(request, factId, {
    action: 'supersede',
    replacementPayload: payload.data,
    provenance: { source: 'user_correction' },
    provenanceId: parsed.data.provenance_id,
    reasonCode: parsed.data.reason_code,
    idempotencyKey: parsed.data.idempotency_key,
  });
  return response;
}
