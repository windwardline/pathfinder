import { z } from 'zod';
import { apiError, correlationId } from '@/lib/api-response';
import { forwardFactTransition, requestBody } from '../transition';

const schema = z.object({
  reason_code: z.string().trim().min(1).max(80),
  timestamp: z.string().datetime().optional(),
  idempotency_key: z.string().trim().min(1).max(200),
});

export async function POST(request: Request, context: { params: Promise<{ factId: string }> }) {
  const parsed = schema.safeParse(await requestBody(request));
  if (!parsed.success) {
    return apiError({ status: 400, code: 'INVALID_REQUEST', message: 'Invalid expiration request', details: parsed.error.flatten().fieldErrors, correlationId: correlationId(request) });
  }
  return forwardFactTransition(request, (await context.params).factId, {
    action: 'expire',
    reasonCode: parsed.data.reason_code,
    idempotencyKey: parsed.data.idempotency_key,
  });
}
