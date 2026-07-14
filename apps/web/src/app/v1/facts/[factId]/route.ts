import { and, eq } from 'drizzle-orm';
import { db, factEvents, facts } from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { serializeV1Fact } from '../route';

export async function GET(
  request: Request,
  context: { params: Promise<{ factId: string }> }
) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const { factId } = await context.params;
  const [fact] = await db
    .select()
    .from(facts)
    .where(and(eq(facts.id, factId), eq(facts.userId, session.user.id)))
    .limit(1);
  if (!fact) {
    return apiError({ status: 404, code: 'FACT_NOT_FOUND', message: 'Fact not found', correlationId: correlation });
  }
  const history = await db
    .select()
    .from(factEvents)
    .where(and(eq(factEvents.factId, factId), eq(factEvents.userId, session.user.id)));
  return apiSuccess(
    {
      fact: serializeV1Fact(fact),
      state_history: history.map(event => ({
        fact_event_id: event.id,
        event_type: event.eventType,
        reason_code: event.reasonCode,
        metadata: event.metadata,
        created_at: event.createdAt,
      })),
    },
    request,
    200,
    correlation
  );
}
