import { z } from 'zod';
import { apiError, correlationId } from '@/lib/api-response';
import { forwardFactTransition, requestBody } from '../transition';

const schema = z.object({
  confirmation_method: z.literal('USER_REVIEW').default('USER_REVIEW'),
  confirmation_note: z.string().trim().max(500).optional(),
  idempotency_key: z.string().trim().min(1).max(200),
});

export async function POST(request: Request, context: { params: Promise<{ factId: string }> }) {
  const parsed = schema.safeParse(await requestBody(request));
  if (!parsed.success) {
    return apiError({ status: 400, code: 'INVALID_REQUEST', message: 'Invalid confirmation request', details: parsed.error.flatten().fieldErrors, correlationId: correlationId(request) });
  }
  return forwardFactTransition(request, (await context.params).factId, {
    action: 'confirm',
    confirmationMethod: parsed.data.confirmation_method,
    confirmationNote: parsed.data.confirmation_note,
    idempotencyKey: parsed.data.idempotency_key,
  });
}
