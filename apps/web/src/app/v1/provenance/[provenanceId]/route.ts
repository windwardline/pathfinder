import { and, eq } from 'drizzle-orm';
import { db, provenance } from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { serializeProvenance } from '../route';

export async function GET(
  request: Request,
  context: { params: Promise<{ provenanceId: string }> }
) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const { provenanceId } = await context.params;
  const [record] = await db
    .select()
    .from(provenance)
    .where(and(eq(provenance.id, provenanceId), eq(provenance.userId, session.user.id)))
    .limit(1);
  if (!record) {
    return apiError({ status: 404, code: 'PROVENANCE_NOT_FOUND', message: 'Provenance not found', correlationId: correlation });
  }
  return apiSuccess({ provenance: serializeProvenance(record) }, request, 200, correlation);
}
