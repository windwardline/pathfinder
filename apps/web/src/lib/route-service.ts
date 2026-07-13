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
import { and, desc, eq, sql } from 'drizzle-orm';

export type FactRow = typeof factsTable.$inferSelect;

/** Parse a DB fact row into a domain Fact. Returns null for corrupt payloads. */
export function toDomainFact(row: FactRow): Fact | null {
  try {
    const payload = JSON.parse(row.factText);
    if (!payload || typeof payload !== 'object' || typeof payload.key !== 'string') {
      return null;
    }
    return {
      id: row.id,
      payload,
      status: row.status as FactStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch {
    console.error(`Skipping fact ${row.id}: payload is not valid JSON`);
    return null;
  }
}

export async function loadFactRows(userId: string): Promise<FactRow[]> {
  return db.select().from(factsTable).where(eq(factsTable.userId, userId));
}

export async function loadConfirmedFacts(userId: string): Promise<Fact[]> {
  const rows = await db
    .select()
    .from(factsTable)
    .where(and(eq(factsTable.userId, userId), eq(factsTable.status, FactStatus.Confirmed)));
  return rows.map(toDomainFact).filter((f): f is Fact => f !== null);
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

  const graphVersionId = crypto.randomUUID();
  const snapshotId = crypto.randomUUID();
  const eventId = crypto.randomUUID();

  await db.transaction(async tx => {
    const [{ maxSeq }] = await tx
      .select({ maxSeq: sql<number>`coalesce(max("sequenceNumber"), 0)` })
      .from(graphVersions)
      .where(eq(graphVersions.userId, userId));
    let nextSeq = Number(maxSeq);

    let [latestSnapshot] = await tx
      .select({ id: routingSnapshots.id })
      .from(routingSnapshots)
      .where(eq(routingSnapshots.userId, userId))
      .orderBy(desc(routingSnapshots.createdAt))
      .limit(1);

    // First recorded change: persist the before-state as a baseline so every
    // Reroute Event links two Route Versions and history can always explain it.
    if (!latestSnapshot) {
      const baselineGraphId = crypto.randomUUID();
      const baselineSnapshotId = crypto.randomUUID();
      await tx.insert(graphVersions).values({
        id: baselineGraphId,
        userId,
        sequenceNumber: ++nextSeq,
        snapshotData: factsBefore.map(f => ({ id: f.id, payload: f.payload })),
      });
      await tx.insert(routingSnapshots).values({
        id: baselineSnapshotId,
        userId,
        graphVersionId: baselineGraphId,
        focusActionId: previousRoute.focusActionId ?? null,
      });
      latestSnapshot = { id: baselineSnapshotId };
    }

    await tx.insert(graphVersions).values({
      id: graphVersionId,
      userId,
      sequenceNumber: ++nextSeq,
      snapshotData: factsAfter.map(f => ({ id: f.id, payload: f.payload })),
    });

    await tx.insert(routingSnapshots).values({
      id: snapshotId,
      userId,
      graphVersionId,
      focusActionId: newRoute.focusActionId ?? null,
    });

    await tx.insert(rerouteEvents).values({
      id: eventId,
      userId,
      previousRouteId: latestSnapshot.id,
      newRouteId: snapshotId,
      triggerReason: reason,
    });
  });

  return { eventId, reason, difference };
}

/** Record a provenance row for a fact. */
export async function recordProvenance(
  factId: string,
  source: string,
  confidence?: number,
  derivedFromFactId?: string
): Promise<void> {
  await db.insert(provenanceTable).values({
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
        (f): f is { id: string; payload: Fact['payload'] } =>
          !!f && typeof f === 'object' && 'id' in f && 'payload' in f
      )
      .map(f => ({
        id: f.id,
        payload: f.payload,
        status: FactStatus.Confirmed,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      }));
    return buildRoute(facts, snapshotId);
  } catch (e) {
    console.error(`Could not rebuild route for snapshot ${snapshotId}:`, e);
    return null;
  }
}
