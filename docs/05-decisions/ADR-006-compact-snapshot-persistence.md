# ADR-006: Compact Snapshot Persistence for Release 1

**Status:** Accepted  
**Date:** 2026-07-15

## Context

The logical data model names Plans, Goals, Actions, domain Facts, graph nodes,
graph edges, Routes, Route Versions, and Route Steps separately. The deployed
Release 1 implementation persists canonical Fact payloads, immutable serialized
GraphVersions, RoutingSnapshots, and structured Reroute differences in
Postgres. The prior documentation did not clearly distinguish the logical model
from the physical Release 1 projection.

## Decision

Release 1 will retain the compact relational snapshot projection:

- `fact` stores schema-validated canonical Fact payloads and lifecycle state.
- `provenance` and `fact_event` preserve evidence and transitions.
- `graph_version.snapshotData` is an immutable serialized projection of the
  exact Confirmed Facts used for routing.
- `routing_snapshot` records publication identity, Focus Action, status, engine
  version, and rule-set version.
- `reroute_event.differenceData` stores the server-computed structured Route
  Difference.

Logical domain entities remain explicit in TypeScript and canonical Fact
schemas. The Route Engine consumes an in-memory Dependency Graph; no graph
database is introduced.

## Consequences

Benefits:

- deterministic replay remains simple;
- immutable before/after evidence is preserved;
- the migration surface is appropriate for a pilot;
- user isolation is enforced on each persisted aggregate.

Tradeoffs:

- SQL analytics over individual graph nodes and Route Steps is less direct;
- physical table names do not mirror every logical entity;
- any future organization workflow or cross-plan analytics may justify a
  normalized projection.

## Guardrails

- Snapshot payloads must be schema validated before publication.
- Published snapshots are append-only.
- Engine, rule-set, schema, and input hashes remain available for replay.
- A normalized migration requires a new ADR, forward-only migration plan,
  replay equivalence tests, and zero change to Route output for identical input.

