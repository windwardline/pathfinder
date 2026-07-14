import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { loadRouteHistory } from '@/lib/route-service';
import { serializeReroute } from '../route';

export async function GET(request: Request, context: { params: Promise<{ rerouteId: string }> }) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const { rerouteId } = await context.params;
  const event = (await loadRouteHistory(session.user.id, 1_000)).find(item => item.id === rerouteId);
  if (!event) {
    return apiError({ status: 404, code: 'REROUTE_NOT_FOUND', message: 'Reroute Event not found', correlationId: correlation });
  }
  return apiSuccess({ reroute: serializeReroute(event) }, request, 200, correlation);
}
