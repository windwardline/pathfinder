import { apiSuccess } from '@/lib/api-response';
import { POST as mutateFact } from '@/app/api/facts/route';

export async function forwardFactTransition(
  request: Request,
  factId: string,
  body: Record<string, unknown>
) {
  const forwarded = new Request('http://pathfinder.local/api/facts', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(request.headers.get('x-correlation-id')
        ? { 'x-correlation-id': request.headers.get('x-correlation-id')! }
        : {}),
    },
    body: JSON.stringify({ factId, ...body }),
  });
  const response = await mutateFact(forwarded);
  const data = await response.json();
  if (!response.ok) {
    return Response.json(data, { status: response.status, headers: response.headers });
  }
  const fact = data.fact as Record<string, unknown>;
  return apiSuccess(
    {
      fact: {
        fact_id: fact.id,
        fact_type: fact.factType,
        value:
          fact.payload && typeof fact.payload === 'object' && 'value' in fact.payload
            ? fact.payload.value
            : null,
        status: fact.status,
        provenance_id: fact.provenanceId ?? null,
        confirmed_at: fact.confirmedAt ?? null,
        confirmed_by: fact.confirmedBy ?? null,
        supersedes_fact_id: fact.supersedesFactId ?? null,
        superseded_by_fact_id: fact.supersededByFactId ?? null,
        expires_at: fact.expiresAt ?? null,
        version: fact.version,
        created_at: fact.createdAt,
        updated_at: fact.updatedAt,
      },
      reroute: data.reroute ?? null,
      route_recalculation_pending: false,
      idempotent_replay: data.idempotent_replay ?? false,
    },
    request,
    200,
    data.correlation_id as string | undefined
  );
}

export async function requestBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
