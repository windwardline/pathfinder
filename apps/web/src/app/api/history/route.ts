import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { loadRouteHistory } from '@/lib/route-service';

/** Route History with server-computed structured differences for every event. */
export async function GET(request?: Request) {
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

  try {
    return apiSuccess(
      { history: await loadRouteHistory(session.user.id, 100) },
      request,
      200,
      correlation
    );
  } catch (error) {
    console.error('GET /api/history failed:', error);
    return apiError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Route History could not be loaded. Please try again.',
      retryable: true,
      correlationId: correlation,
    });
  }
}
