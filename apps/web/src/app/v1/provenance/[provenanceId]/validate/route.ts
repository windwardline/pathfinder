import { and, eq } from 'drizzle-orm';
import { db, provenance } from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { provenanceIntegrityHash } from '@/lib/provenance';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(
  request: Request,
  context: { params: Promise<{ provenanceId: string }> }
) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const { provenanceId } = await context.params;
  if (!(await checkRateLimit(`provenance-validation:${session.user.id}`, 60, 60_000))) {
    return apiError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many validation requests. Please wait a moment.',
      retryable: true,
      correlationId: correlation,
    });
  }
  const [record] = await db
    .select()
    .from(provenance)
    .where(and(eq(provenance.id, provenanceId), eq(provenance.userId, session.user.id)))
    .limit(1);
  if (!record) {
    return apiError({ status: 404, code: 'PROVENANCE_NOT_FOUND', message: 'Provenance not found', correlationId: correlation });
  }
  const valid = provenanceIntegrityHash(record) === record.integrityHash;
  return apiSuccess(
    {
      valid,
      validation_errors: valid ? [] : ['INTEGRITY_HASH_MISMATCH'],
      integrity_status: valid ? 'VALID' : 'INVALID',
      reference_status: record.factId ? 'LINKED' : 'UNLINKED',
    },
    request,
    200,
    correlation
  );
}
