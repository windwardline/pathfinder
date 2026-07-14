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
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { sha256 } from './integrity';
import { provenanceIntegrityHash } from './provenance';

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
    if (!item.factId) continue;
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
  const id =
    snapshotId ??
    `snapshot_${sha256(confirmedFacts.map(serializeSnapshotFact)).slice(0, 32)}`;
  const graph = new GraphVersion(id, confirmedFacts);
  const snapshot = new RoutingSnapshot(id, graph, confirmedFacts);
  return RouteEngine.generateRoute(snapshot);
}

/** Returns the latest published immutable Route, with a stable empty fallback. */
export async function loadCurrentRoute(userId: string): Promise<RouteVersion> {
  const [latestGraph] = await db
    .select()
    .from(graphVersions)
    .where(eq(graphVersions.userId, userId))
    .orderBy(desc(graphVersions.sequenceNumber))
    .limit(1);

  if (latestGraph) {
    const [snapshot] = await db
      .select()
      .from(routingSnapshots)
      .where(
        and(
          eq(routingSnapshots.userId, userId),
          eq(routingSnapshots.graphVersionId, latestGraph.id)
        )
      )
      .limit(1);
    if (snapshot) {
      const published = routeFromSnapshotData(latestGraph.snapshotData, snapshot.id);
      if (published) return published;
    }
  }

  return buildRoute(await loadConfirmedFacts(userId));
}

export interface RerouteRecord {
  eventId: string;
  reason: RerouteReason;
  difference: RouteDifference;
}

export const ENGINE_VERSION = 'release-1.0';
export const RULE_SET_VERSION = 'release-1.0';

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
  factsAfter: Fact[],
  triggerReference?: string
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
  const beforeData = factsBefore.map(serializeSnapshotFact);
  const afterData = factsAfter.map(serializeSnapshotFact);

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
      inputSnapshotHash: sha256(beforeData),
      snapshotData: beforeData,
    },
    {
      id: newGraphVersionId,
      userId,
      sequenceNumber: nextSeq + 2,
      inputSnapshotHash: sha256(afterData),
      snapshotData: afterData,
    },
  ]);

  await executor.insert(routingSnapshots).values([
    {
      id: previousSnapshotId,
      userId,
      graphVersionId: previousGraphVersionId,
      focusActionId: previousRoute.focusActionId ?? null,
      engineVersion: ENGINE_VERSION,
      ruleSetVersion: RULE_SET_VERSION,
      routeStatus: previousRoute.status,
    },
    {
      id: newSnapshotId,
      userId,
      graphVersionId: newGraphVersionId,
      focusActionId: newRoute.focusActionId ?? null,
      engineVersion: ENGINE_VERSION,
      ruleSetVersion: RULE_SET_VERSION,
      routeStatus: newRoute.status,
    },
  ]);

  await executor.insert(rerouteEvents).values({
    id: eventId,
    userId,
    previousRouteId: previousSnapshotId,
    newRouteId: newSnapshotId,
    triggerReason: reason,
    triggerReference: triggerReference ?? null,
    differenceData: difference,
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
): Promise<string> {
  const [fact] = await executor
    .select({
      userId: factsTable.userId,
      factText: factsTable.factText,
      provenanceId: factsTable.provenanceId,
    })
    .from(factsTable)
    .where(eq(factsTable.id, factId))
    .limit(1);
  if (!fact) throw new Error('Cannot record Provenance for an unknown Fact.');
  const sourceType = provenanceSourceType(source);
  const sourceReference = source;
  const [record] = await executor.insert(provenanceTable).values({
    userId: fact.userId,
    factId,
    source,
    sourceType,
    sourceReference,
    integrityHash: provenanceIntegrityHash({
      userId: fact.userId,
      factId,
      sourceType,
      sourceReference,
      documentId: null,
      pageReference: null,
      sectionReference: null,
      ruleId: null,
      extractionMetadata: null,
      retentionPolicy: null,
      derivedFromFactId: derivedFromFactId ?? null,
    }),
    createdBy: source.startsWith('user_') ? fact.userId : 'pathfinder',
    confidence: confidence ?? null,
    derivedFromFactId: derivedFromFactId ?? null,
  }).returning({ id: provenanceTable.id });
  if (!record) throw new Error('Provenance could not be recorded.');
  if (!fact.provenanceId) {
    await executor
      .update(factsTable)
      .set({ provenanceId: record.id })
      .where(and(eq(factsTable.id, factId), eq(factsTable.userId, fact.userId)));
  }
  return record.id;
}

function provenanceSourceType(source: string): string {
  if (source === 'ai_extraction') return 'DOCUMENT_EXTRACTION';
  if (source === 'user_correction') return 'USER_CORRECTION';
  if (source.startsWith('user_')) return 'USER_ENTRY';
  return 'SYSTEM_DERIVATION';
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
          createdAt?: string;
          updatedAt?: string;
        } =>
          !!f && typeof f === 'object' && 'id' in f && 'payload' in f
      )
      .map(f => ({
        id: f.id,
        payload: f.payload,
        status: FactStatus.Confirmed,
        createdAt: safeSnapshotDate(f.createdAt),
        updatedAt: safeSnapshotDate(f.updatedAt),
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
    createdAt: fact.createdAt.toISOString(),
    updatedAt: fact.updatedAt.toISOString(),
    provenance:
      fact.provenanceHistory ?? (fact.provenance ? [fact.provenance] : []),
  };
}

function safeSnapshotDate(value: string | undefined) {
  if (!value) return new Date(0);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

/** Loads append-only Route History and reconstructs differences from snapshots. */
export async function loadRouteHistory(userId: string, limit = 100) {
  const events = await db
    .select()
    .from(rerouteEvents)
    .where(eq(rerouteEvents.userId, userId))
    .orderBy(desc(rerouteEvents.createdAt))
    .limit(limit);

  const snapshotIds = [
    ...new Set(
      events
        .flatMap(event => [event.previousRouteId, event.newRouteId])
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const snapshots = snapshotIds.length
    ? await db
        .select()
        .from(routingSnapshots)
        .where(
          and(
            eq(routingSnapshots.userId, userId),
            inArray(routingSnapshots.id, snapshotIds)
          )
        )
    : [];
  const snapshotById = new Map(snapshots.map(snapshot => [snapshot.id, snapshot]));

  const graphIds = [...new Set(snapshots.map(snapshot => snapshot.graphVersionId))];
  const graphs = graphIds.length
    ? await db
        .select()
        .from(graphVersions)
        .where(
          and(
            eq(graphVersions.userId, userId),
            inArray(graphVersions.id, graphIds)
          )
        )
    : [];
  const graphById = new Map(graphs.map(graph => [graph.id, graph]));

  const routeForSnapshot = (snapshotId: string | null) => {
    if (!snapshotId) return null;
    const snapshot = snapshotById.get(snapshotId);
    if (!snapshot) return null;
    const graph = graphById.get(snapshot.graphVersionId);
    if (!graph) return null;
    return routeFromSnapshotData(graph.snapshotData, snapshot.id);
  };

  return events.map(event => {
    const previousRoute = routeForSnapshot(event.previousRouteId);
    const newRoute = routeForSnapshot(event.newRouteId);
    return {
      id: event.id,
      previousRouteId: event.previousRouteId,
      newRouteId: event.newRouteId,
      triggerReason: event.triggerReason,
      triggerReference: event.triggerReference,
      createdAt: event.createdAt,
      difference:
        previousRoute && newRoute
          ? computeRouteDifference(previousRoute, newRoute)
          : isRouteDifference(event.differenceData)
            ? event.differenceData
            : null,
      newFocus: newRoute?.focusActionId
        ? newRoute.steps.find(step => step.actionId === newRoute.focusActionId)?.title ?? null
        : null,
    };
  });
}

function isRouteDifference(value: unknown): value is RouteDifference {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<RouteDifference>;
  return (
    typeof candidate.focusActionChanged === 'boolean' &&
    Array.isArray(candidate.added) &&
    Array.isArray(candidate.removed) &&
    Array.isArray(candidate.newlyAvailable) &&
    Array.isArray(candidate.newlyBlocked) &&
    Array.isArray(candidate.completed) &&
    Array.isArray(candidate.moved) &&
    Array.isArray(candidate.deadlineChanges) &&
    typeof candidate.isMeaningful === 'boolean'
  );
}
