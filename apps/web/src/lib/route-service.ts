import {
  db,
  facts as factsTable,
  graphVersions,
  routingSnapshots,
  rerouteEvents,
  provenance as provenanceTable,
  Fact,
  FactStatus,
  GraphVersion,
  RoutingSnapshot,
  RouteEngine,
  RouteVersion,
  RouteDifference,
  computeRouteDifference,
  RerouteReason,
} from '@pathfinder/core';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';

export type FactRow = typeof factsTable.$inferSelect;
export type ProvenanceRow = typeof provenanceTable.$inferSelect;
export type DatabaseExecutor = Pick<
  typeof db,
  'select' | 'insert' | 'update' | 'delete' | 'execute'
>;

/** Parse a DB fact row into a domain Fact. Returns null for corrupt payloads. */
export function toDomainFact(row: FactRow, provenanceRows: ProvenanceRow[] = []): Fact | null {
  try {
    const payload = JSON.parse(row.factText);
    if (!payload || typeof payload !== 'object' || typeof payload.key !== 'string') {
      return null;
    }
    const provenanceHistory = provenanceRows.map(item => ({
      source: item.source,
      confidence: item.confidence ?? undefined,
      sourceText:
        typeof payload.sourceText === 'string' ? payload.sourceText : undefined,
      derivedFromFactId: item.derivedFromFactId ?? undefined,
    }));
    return {
      id: row.id,
      payload,
      status: row.status as FactStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      provenance: provenanceHistory[0],
      provenanceHistory,
    };
  } catch {
    console.error(`Skipping fact ${row.id}: payload is not valid JSON`);
    return null;
  }
}

export async function loadFactRows(
  userId: string,
  executor: DatabaseExecutor = db
): Promise<FactRow[]> {
  return executor.select().from(factsTable).where(eq(factsTable.userId, userId));
}

export async function loadConfirmedFacts(
  userId: string,
  executor: DatabaseExecutor = db
): Promise<Fact[]> {
  const rows = await executor
    .select()
    .from(factsTable)
    .where(and(eq(factsTable.userId, userId), eq(factsTable.status, FactStatus.Confirmed)));
  const provenanceRows = rows.length
    ? await executor
        .select()
        .from(provenanceTable)
        .where(inArray(provenanceTable.factId, rows.map(row => row.id)))
        .orderBy(asc(provenanceTable.createdAt), asc(provenanceTable.id))
    : [];
  const provenanceByFact = new Map<string, ProvenanceRow[]>();
  for (const item of provenanceRows) {
    provenanceByFact.set(item.factId, [
      ...(provenanceByFact.get(item.factId) ?? []),
      item,
    ]);
  }
  return rows
    .map(row => toDomainFact(row, provenanceByFact.get(row.id)))
    .filter((fact): fact is Fact => fact !== null);
}

/** Build the deterministic Route for a set of Confirmed Facts. */
export function buildRoute(confirmedFacts: Fact[], snapshotId?: string): RouteVersion {
  const id = snapshotId ?? crypto.randomUUID();
  const graph = new GraphVersion(id, confirmedFacts);
  const snapshot = new RoutingSnapshot(id, graph, confirmedFacts);
  return RouteEngine.generateRoute(snapshot);
}

export interface RerouteRecord {
  eventId: string;
  reason: RerouteReason;
  difference: RouteDifference;
}

/**
 * Persist an immutable graph version + routing snapshot and record the
 * Reroute Event for a confirmed change. Only meaningful differences are
 * recorded; reads never write (route generation itself is pure).
 */
export async function recordReroute(
  executor: DatabaseExecutor,
  userId: string,
  reason: RerouteReason,
  previousRoute: RouteVersion,
  newRoute: RouteVersion,
  factsBefore: Fact[],
  factsAfter: Fact[]
): Promise<RerouteRecord | null> {
  const difference = computeRouteDifference(previousRoute, newRoute);
  if (!difference.isMeaningful) {
    return null;
  }

  const previousGraphVersionId = crypto.randomUUID();
  const previousSnapshotId = crypto.randomUUID();
  const newGraphVersionId = crypto.randomUUID();
  const newSnapshotId = crypto.randomUUID();
  const eventId = crypto.randomUUID();

  // Serialize sequence allocation per user. Persist the exact before-state for
  // every event; timestamp ties can never select an unrelated baseline.
  await executor.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
  const [{ maxSeq }] = await executor
    .select({ maxSeq: sql<number>`coalesce(max("sequenceNumber"), 0)` })
    .from(graphVersions)
    .where(eq(graphVersions.userId, userId));
  const nextSeq = Number(maxSeq);

  await executor.insert(graphVersions).values([
    {
      id: previousGraphVersionId,
      userId,
      sequenceNumber: nextSeq + 1,
      snapshotData: factsBefore.map(serializeSnapshotFact),
    },
    {
      id: newGraphVersionId,
      userId,
      sequenceNumber: nextSeq + 2,
      snapshotData: factsAfter.map(serializeSnapshotFact),
    },
  ]);

  await executor.insert(routingSnapshots).values([
    {
      id: previousSnapshotId,
      userId,
      graphVersionId: previousGraphVersionId,
      focusActionId: previousRoute.focusActionId ?? null,
    },
    {
      id: newSnapshotId,
      userId,
      graphVersionId: newGraphVersionId,
      focusActionId: newRoute.focusActionId ?? null,
    },
  ]);

  await executor.insert(rerouteEvents).values({
    id: eventId,
    userId,
    previousRouteId: previousSnapshotId,
    newRouteId: newSnapshotId,
    triggerReason: reason,
  });

  return { eventId, reason, difference };
}

/** Record a provenance row for a fact. */
export async function recordProvenance(
  factId: string,
  source: string,
  confidence?: number,
  derivedFromFactId?: string,
  executor: DatabaseExecutor = db
): Promise<void> {
  await executor.insert(provenanceTable).values({
    factId,
    source,
    confidence: confidence ?? null,
    derivedFromFactId: derivedFromFactId ?? null,
  });
}

/** Rebuild the Route for a stored graph version's snapshot data. */
export function routeFromSnapshotData(snapshotData: unknown, snapshotId: string): RouteVersion | null {
  if (!Array.isArray(snapshotData)) return null;
  try {
    const facts: Fact[] = snapshotData
      .filter(
        (f): f is {
          id: string;
          payload: Fact['payload'];
          provenance?: Fact['provenanceHistory'];
        } =>
          !!f && typeof f === 'object' && 'id' in f && 'payload' in f
      )
      .map(f => ({
        id: f.id,
        payload: f.payload,
        status: FactStatus.Confirmed,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        provenance: f.provenance?.[0],
        provenanceHistory: f.provenance,
      }));
    return buildRoute(facts, snapshotId);
  } catch (e) {
    console.error('Could not rebuild route for snapshot %s:', snapshotId, e);
    return null;
  }
}

function serializeSnapshotFact(fact: Fact) {
  return {
    id: fact.id,
    payload: fact.payload,
    provenance:
      fact.provenanceHistory ?? (fact.provenance ? [fact.provenance] : []),
  };
}
