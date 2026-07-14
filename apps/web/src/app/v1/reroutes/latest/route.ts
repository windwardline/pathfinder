import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { loadRouteHistory } from '@/lib/route-service';
import { serializeReroute } from '../route';

export async function GET(request: Request) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const [latest] = await loadRouteHistory(session.user.id, 1);
  if (!latest) {
    return apiError({ status: 404, code: 'REROUTE_NOT_FOUND', message: 'No Reroute Event exists yet.', correlationId: correlation });
  }
  return apiSuccess({ reroute: serializeReroute(latest) }, request, 200, correlation);
}
