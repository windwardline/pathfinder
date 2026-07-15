import { FactStatus, GraphVersionError } from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { ENGINE_VERSION, RULE_SET_VERSION, loadCurrentRoute, loadFactRows } from '@/lib/route-service';
import { emitOperationalEvent } from '@/lib/telemetry';
import { APP_VERSION, SCHEMA_VERSION } from '@/lib/release';

/** Returns the current published Route Version. Reads never publish or mutate. */
export async function GET(request?: Request) {
  const correlation = correlationId(request);
  const startedAt = performance.now();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        correlationId: correlation,
      });
    }

    const rows = await loadFactRows(session.user.id);
    const route = await loadCurrentRoute(session.user.id);
    emitOperationalEvent({
      correlationId: correlation,
      service: 'route-engine',
      operation: 'route_generation',
      outcome: 'success',
      durationMs: performance.now() - startedAt,
      httpStatus: 200,
      routeStatus: route.status,
    });
    return apiSuccess(
      {
        route: {
          id: route.id,
          status: route.status,
          focusActionId: route.focusActionId ?? null,
          steps: route.steps,
          createdAt: route.createdAt,
        },
        proposedCount: rows.filter(row => row.status === FactStatus.Proposed).length,
        confirmedCount: rows.filter(row => row.status === FactStatus.Confirmed).length,
        versions: {
          application: APP_VERSION,
          schema: SCHEMA_VERSION,
          engine: ENGINE_VERSION,
          ruleSet: RULE_SET_VERSION,
        },
      },
      request,
      200,
      correlation
    );
  } catch (error) {
    emitOperationalEvent({
      correlationId: correlation,
      service: 'route-engine',
      operation: 'route_generation',
      outcome: 'failure',
      durationMs: performance.now() - startedAt,
      httpStatus: error instanceof GraphVersionError ? 422 : 500,
    });
    if (error instanceof GraphVersionError) {
      console.error('Route engine rejected the confirmed Fact set:', error.message);
      return apiError({
        status: 422,
        code: 'INVALID_ROUTE_INPUT',
        message:
          'Your Route could not be recalculated because the Confirmed Facts conflict. Your last valid Route is unchanged.',
        correlationId: correlation,
      });
    }
    console.error('GET /api/route failed:', error);
    return apiError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'The Route could not be loaded. Please try again.',
      retryable: true,
      correlationId: correlation,
    });
  }
}
