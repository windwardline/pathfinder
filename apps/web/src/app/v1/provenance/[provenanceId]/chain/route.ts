import { and, eq, inArray } from 'drizzle-orm';
import {
  db,
  factEvents,
  facts,
  graphVersions,
  provenance,
  routingSnapshots,
} from '@pathfinder/core';
import { auth } from '@/auth';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';

/** Structured lineage references only; graph nodes/edges and generated prose stay internal. */
export async function GET(
  request: Request,
  context: { params: Promise<{ provenanceId: string }> }
) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', correlationId: correlation });
  }
  const userId = session.user.id;
  const { provenanceId } = await context.params;
  const [record] = await db
    .select()
    .from(provenance)
    .where(and(eq(provenance.id, provenanceId), eq(provenance.userId, userId)))
    .limit(1);
  if (!record) {
    return apiError({ status: 404, code: 'PROVENANCE_NOT_FOUND', message: 'Provenance not found', correlationId: correlation });
  }

  const [fact] = record.factId
    ? await db
        .select()
        .from(facts)
        .where(and(eq(facts.id, record.factId), eq(facts.userId, userId)))
        .limit(1)
    : [];
  const events = fact
    ? await db
        .select()
        .from(factEvents)
        .where(and(eq(factEvents.factId, fact.id), eq(factEvents.userId, userId)))
    : [];
  const graphs = fact
    ? (await db.select().from(graphVersions).where(eq(graphVersions.userId, userId))).filter(
        graph =>
          Array.isArray(graph.snapshotData) &&
          graph.snapshotData.some(
            item =>
              Boolean(item) &&
              typeof item === 'object' &&
              'id' in item &&
              item.id === fact.id
          )
      )
    : [];
  const routes = graphs.length
    ? await db
        .select()
        .from(routingSnapshots)
        .where(
          and(
            eq(routingSnapshots.userId, userId),
            inArray(routingSnapshots.graphVersionId, graphs.map(graph => graph.id))
          )
        )
    : [];

  return apiSuccess(
    {
      chain: {
        source: {
          source_type: record.sourceType,
          source_reference: record.sourceReference,
        },
        provenance: { provenance_id: record.id, integrity_hash: record.integrityHash },
        proposed_fact: fact ? { fact_id: fact.id, created_at: fact.createdAt } : null,
        confirmation_event: (() => {
          const confirmation = events.find(event => event.eventType === 'CONFIRM');
          return confirmation
            ? {
                fact_event_id: confirmation.id,
                event_type: confirmation.eventType,
                created_at: confirmation.createdAt,
              }
            : null;
        })(),
        confirmed_fact:
          fact?.confirmedAt
            ? { fact_id: fact.id, confirmed_at: fact.confirmedAt, status: fact.status }
            : null,
        graph_versions: graphs.map(graph => ({
          graph_version_id: graph.id,
          input_snapshot_hash: graph.inputSnapshotHash,
        })),
        route_versions: routes.map(route => ({
          route_version_id: route.id,
          graph_version_id: route.graphVersionId,
          engine_version: route.engineVersion,
          rule_set_version: route.ruleSetVersion,
        })),
        explanation_reference: fact ? { action_id: fact.id } : null,
      },
    },
    request,
    200,
    correlation
  );
}
