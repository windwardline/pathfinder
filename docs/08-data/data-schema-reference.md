
# Pathfinder Data Schema Reference

**Version:** 1.0  
**Status:** Canonical Data Specification

## Purpose

This document defines the logical schema contracts for Pathfinder Release 1. It complements `data-architecture.md` by specifying entity fields, keys, relationships, lifecycle constraints, and persistence invariants.

The table names below are logical contracts. Per ADR-006, the deployed Release
1 physical schema uses compact Fact and immutable snapshot tables. The mapping
is authoritative:

| Logical contract | Release 1 physical representation |
|---|---|
| User | `user` plus Auth.js tables |
| Provenance Record | `provenance` |
| Fact and Fact Event | `fact`, `fact_event` |
| Plan and domain entities | schema-validated `fact.factText` payloads |
| Dependency Graph, nodes, and edges | immutable `graph_version.snapshotData` |
| Route and Route Version | `routing_snapshot` linked to `graph_version` |
| Route Step and explanation | deterministically reconstructed from the immutable snapshot |
| Reroute Event | `reroute_event` with structured `differenceData` |
| Deletion propagation | `account_deletion_receipt` pseudonymous ledger |

The normalized contracts remain the migration target only if a future ADR
establishes that the compact projection no longer satisfies product needs.

## Conventions

- Primary keys use UUIDs.
- Timestamps use ISO-8601 UTC.
- Enumerations use uppercase snake case.
- JSON fields are schema validated.
- Published versions are immutable.
- Every user-scoped record must preserve ownership.

## Users

### Table: `users`

| Field | Type | Required | Notes |
|---|---|---:|---|
| user_id | UUID | Yes | Primary key |
| status | TEXT | Yes | ACTIVE, SUSPENDED, DELETED |
| locale | TEXT | Yes | Default `en-US` |
| time_zone | TEXT | Yes | IANA identifier |
| created_at | TIMESTAMP | Yes | UTC |
| updated_at | TIMESTAMP | Yes | UTC |

## Provenance Records

### Table: `provenance_records`

| Field | Type | Required | Notes |
|---|---|---:|---|
| provenance_id | UUID | Yes | Primary key |
| user_id | UUID | Yes | FK to users |
| source_type | TEXT | Yes | Canonical source enum |
| source_reference | TEXT | Yes | Human-auditable source |
| integrity_hash | TEXT | Yes | Canonical hash |
| created_by | UUID/TEXT | Yes | Actor or system |
| created_at | TIMESTAMP | Yes | UTC |
| document_id | UUID | No | Optional document linkage |
| page_reference | TEXT | No | Optional |
| section_reference | TEXT | No | Optional |
| rule_id | UUID | No | Optional |
| extraction_metadata | JSON | No | Validated schema |
| retention_policy | TEXT | No | Policy identifier |

### Constraints

- `user_id` must match all linked Facts.
- Published records are immutable.
- Unsupported `source_type` values are rejected.

## Facts

### Table: `facts`

| Field | Type | Required | Notes |
|---|---|---:|---|
| fact_id | UUID | Yes | Primary key |
| user_id | UUID | Yes | FK to users |
| fact_type | TEXT | Yes | Canonical fact type |
| value_json | JSON | Yes | Validated by fact schema |
| status | TEXT | Yes | PROPOSED, CONFIRMED, REJECTED, SUPERSEDED, EXPIRED |
| provenance_id | UUID | Yes | FK to provenance_records |
| version | INTEGER | Yes | Starts at 1 |
| created_at | TIMESTAMP | Yes | UTC |
| updated_at | TIMESTAMP | Yes | UTC |
| confirmed_at | TIMESTAMP | No | Required when CONFIRMED |
| confirmed_by | UUID/TEXT | No | Required when CONFIRMED |
| supersedes_fact_id | UUID | No | Self-reference |
| superseded_by_fact_id | UUID | No | Self-reference |
| expires_at | TIMESTAMP | No | Optional |

### Constraints

- Only valid state transitions are permitted.
- A CONFIRMED fact requires `confirmed_at` and `confirmed_by`.
- `provenance_id` must belong to the same user.
- Proposed Facts cannot be referenced by published GraphVersions.

## Fact Events

### Table: `fact_events`

| Field | Type | Required | Notes |
|---|---|---:|---|
| event_id | UUID | Yes | Primary key |
| fact_id | UUID | Yes | FK to facts |
| user_id | UUID | Yes | FK to users |
| event_type | TEXT | Yes | CONFIRM, REJECT, SUPERSEDE, EXPIRE |
| actor_id | UUID/TEXT | Yes | Actor |
| reason_code | TEXT | No | Required for selected transitions |
| metadata | JSON | No | Validated |
| created_at | TIMESTAMP | Yes | UTC |

## Plans

### Table: `plans`

| Field | Type | Required | Notes |
|---|---|---:|---|
| plan_id | UUID | Yes | Primary key |
| user_id | UUID | Yes | FK to users |
| version | INTEGER | Yes | Monotonic per user |
| status | TEXT | Yes | ACTIVE, SUPERSEDED |
| snapshot_hash | TEXT | Yes | Deterministic hash |
| created_at | TIMESTAMP | Yes | UTC |

### Constraints

- `(user_id, version)` is unique.
- Published Plan versions are immutable.

## Goals

### Table: `goals`

| Field | Type | Required | Notes |
|---|---|---:|---|
| goal_id | UUID | Yes | Primary key |
| plan_id | UUID | Yes | FK to plans |
| user_id | UUID | Yes | Ownership |
| title | TEXT | Yes | Canonical wording |
| status | TEXT | Yes | ACTIVE, ACHIEVED, PAUSED, ABANDONED |
| priority | INTEGER | Yes | User-controlled |
| created_at | TIMESTAMP | Yes | UTC |

## Actions

### Table: `actions`

| Field | Type | Required | Notes |
|---|---|---:|---|
| action_id | UUID | Yes | Primary key |
| plan_id | UUID | Yes | FK to plans |
| user_id | UUID | Yes | Ownership |
| title | TEXT | Yes | Concrete Action |
| action_type | TEXT | Yes | Canonical enum |
| status | TEXT | Yes | AVAILABLE, BLOCKED, IN_PROGRESS, COMPLETED, CANCELLED |
| effort_estimate | INTEGER | Yes | Deterministic scale |
| due_at | TIMESTAMP | No | Optional |
| metadata | JSON | No | Validated |
| created_at | TIMESTAMP | Yes | UTC |

## Requirements

### Table: `requirements`

| Field | Type | Required | Notes |
|---|---|---:|---|
| requirement_id | UUID | Yes | Primary key |
| plan_id | UUID | Yes | FK to plans |
| user_id | UUID | Yes | Ownership |
| description | TEXT | Yes | Canonical wording |
| requirement_type | TEXT | Yes | Canonical enum |
| status | TEXT | Yes | UNSATISFIED, SATISFIED, WAIVED, UNKNOWN |
| hardness | TEXT | Yes | HARD, SOFT |

## Obligations

### Table: `obligations`

| Field | Type | Required | Notes |
|---|---|---:|---|
| obligation_id | UUID | Yes | Primary key |
| plan_id | UUID | Yes | FK to plans |
| user_id | UUID | Yes | Ownership |
| title | TEXT | Yes | Mandatory commitment |
| status | TEXT | Yes | ACTIVE, COMPLETED, CANCELLED |
| start_at | TIMESTAMP | Yes | UTC |
| end_at | TIMESTAMP | No | UTC |
| source_fact_id | UUID | Yes | FK to confirmed fact |

## Constraints

### Table: `constraints`

| Field | Type | Required | Notes |
|---|---|---:|---|
| constraint_id | UUID | Yes | Primary key |
| plan_id | UUID | Yes | FK to plans |
| user_id | UUID | Yes | Ownership |
| constraint_type | TEXT | Yes | TIME, TRANSPORTATION, FINANCIAL, LOCATION, AVAILABILITY, ACCESSIBILITY, POLICY |
| value_json | JSON | Yes | Validated |
| status | TEXT | Yes | ACTIVE, INACTIVE, SUPERSEDED |
| source_fact_id | UUID | Yes | FK to confirmed fact |

## Deadlines

### Table: `deadlines`

| Field | Type | Required | Notes |
|---|---|---:|---|
| deadline_id | UUID | Yes | Primary key |
| plan_id | UUID | Yes | FK to plans |
| user_id | UUID | Yes | Ownership |
| title | TEXT | Yes | Human-readable |
| due_at | TIMESTAMP | Yes | UTC |
| severity | TEXT | Yes | LOW, MODERATE, HIGH, CRITICAL |
| source_fact_id | UUID | Yes | FK to confirmed fact |

## Blockers

### Table: `blockers`

| Field | Type | Required | Notes |
|---|---|---:|---|
| blocker_id | UUID | Yes | Primary key |
| plan_id | UUID | Yes | FK to plans |
| user_id | UUID | Yes | Ownership |
| target_entity_id | UUID | Yes | Blocked target |
| reason_code | TEXT | Yes | Canonical code |
| description | TEXT | Yes | Explainable wording |
| active | BOOLEAN | Yes | Current state |
| source_reference | UUID/TEXT | Yes | Fact or Rule |

## Dependencies

### Table: `dependencies`

| Field | Type | Required | Notes |
|---|---|---:|---|
| dependency_id | UUID | Yes | Primary key |
| plan_id | UUID | Yes | FK to plans |
| user_id | UUID | Yes | Ownership |
| source_entity_id | UUID | Yes | Polymorphic reference |
| target_entity_id | UUID | Yes | Polymorphic reference |
| relationship_type | TEXT | Yes | REQUIRES, BLOCKS, UNLOCKS, SUPPORTS, CONFLICTS_WITH, SATISFIES |
| hardness | TEXT | Yes | HARD, SOFT |
| active | BOOLEAN | Yes | Current state |
| derivation_type | TEXT | Yes | DOMAIN_STATE, VERIFIED_RULE, USER_CONFIRMED_RELATIONSHIP, SYSTEM_DERIVATION |
| derivation_reference | TEXT | Yes | Traceability |
| created_at | TIMESTAMP | Yes | UTC |

### Constraints

- Source and target must belong to the same user and Plan version.
- Edge compatibility must be validated before persistence.
- Proposed Facts cannot participate in published route-affecting dependencies.

## Graph Versions

### Table: `graph_versions`

| Field | Type | Required | Notes |
|---|---|---:|---|
| graph_version_id | UUID | Yes | Primary key |
| user_id | UUID | Yes | Ownership |
| plan_version | INTEGER | Yes | Source Plan |
| input_snapshot_hash | TEXT | Yes | Deterministic hash |
| schema_version | TEXT | Yes | Graph schema |
| rule_set_version | TEXT | Yes | Rules |
| status | TEXT | Yes | BUILDING, VALID, INVALID, SUPERSEDED |
| created_at | TIMESTAMP | Yes | UTC |

### Constraints

- Only VALID versions may be consumed by the Route Engine.
- Published VALID versions are immutable.
- `(user_id, input_snapshot_hash, schema_version, rule_set_version)` should be unique where practical.

## Graph Nodes

### Table: `graph_nodes`

| Field | Type | Required | Notes |
|---|---|---:|---|
| graph_node_id | UUID | Yes | Primary key |
| graph_version_id | UUID | Yes | FK to graph_versions |
| user_id | UUID | Yes | Ownership |
| node_type | TEXT | Yes | Canonical node enum |
| domain_entity_id | UUID | Yes | Source entity |
| attributes_json | JSON | Yes | Validated |
| provenance_references | JSON | Yes | Array of IDs |
| active | BOOLEAN | Yes | Current graph state |

## Graph Edges

### Table: `graph_edges`

| Field | Type | Required | Notes |
|---|---|---:|---|
| graph_edge_id | UUID | Yes | Primary key |
| graph_version_id | UUID | Yes | FK to graph_versions |
| user_id | UUID | Yes | Ownership |
| source_node_id | UUID | Yes | FK to graph_nodes |
| target_node_id | UUID | Yes | FK to graph_nodes |
| edge_type | TEXT | Yes | Canonical edge enum |
| hardness | TEXT | Yes | HARD, SOFT |
| derivation_reference | TEXT | Yes | Traceability |
| provenance_references | JSON | Yes | Array of IDs |
| active | BOOLEAN | Yes | Current graph state |

## Routes

### Table: `routes`

| Field | Type | Required | Notes |
|---|---|---:|---|
| route_id | UUID | Yes | Primary key |
| user_id | UUID | Yes | Ownership |
| status | TEXT | Yes | ACTIVE, COMPLETED, ARCHIVED |
| created_at | TIMESTAMP | Yes | UTC |

## Route Versions

### Table: `route_versions`

| Field | Type | Required | Notes |
|---|---|---:|---|
| route_version_id | UUID | Yes | Primary key |
| route_id | UUID | Yes | FK to routes |
| user_id | UUID | Yes | Ownership |
| plan_version | INTEGER | Yes | Source |
| graph_version_id | UUID | Yes | FK to graph_versions |
| engine_version | TEXT | Yes | Deterministic engine |
| rule_set_version | TEXT | Yes | Deterministic rules |
| input_snapshot_hash | TEXT | Yes | Replay identity |
| status | TEXT | Yes | ACTIVE, BLOCKED, COMPLETED |
| created_at | TIMESTAMP | Yes | UTC |

### Constraints

- Published Route Versions are immutable.
- Identical replay inputs must preserve deterministic output.
- Only one current active Route Version per Route should be designated by application logic.

## Route Steps

### Table: `route_steps`

| Field | Type | Required | Notes |
|---|---|---:|---|
| route_step_id | UUID | Yes | Primary key |
| route_version_id | UUID | Yes | FK to route_versions |
| action_id | UUID | Yes | FK to actions |
| position | INTEGER | Yes | Unique per Route Version |
| state | TEXT | Yes | FOCUS, UPCOMING, BLOCKED, COMPLETED |
| explanation_id | UUID | Yes | FK to explanations |

### Constraints

- `(route_version_id, position)` is unique.
- Exactly one FOCUS step exists when the Route is actionable.

## Explanations

### Table: `explanations`

| Field | Type | Required | Notes |
|---|---|---:|---|
| explanation_id | UUID | Yes | Primary key |
| route_step_id | UUID | Yes | FK to route_steps |
| reason_codes | JSON | Yes | Structured canonical codes |
| provenance_references | JSON | Yes | Array of IDs |
| plain_language_text | TEXT | Yes | User-facing |
| template_version | TEXT | Yes | Fallback traceability |

## Reroute Events

### Table: `reroute_events`

| Field | Type | Required | Notes |
|---|---|---:|---|
| reroute_event_id | UUID | Yes | Primary key |
| user_id | UUID | Yes | Ownership |
| previous_route_version_id | UUID | Yes | FK |
| new_route_version_id | UUID | Yes | FK |
| trigger_type | TEXT | Yes | Canonical trigger enum |
| trigger_reference | TEXT | Yes | Fact, Action, Rule, etc. |
| difference_json | JSON | Yes | Structured Route Difference |
| created_at | TIMESTAMP | Yes | UTC |

### Constraints

- Previous and new Route Versions must belong to the same user.
- Reroute Events are immutable.
- Difference JSON must validate against the Reroute schema.

## Idempotency Records

### Table: `idempotency_records`

| Field | Type | Required | Notes |
|---|---|---:|---|
| idempotency_key | TEXT | Yes | Primary key within scope |
| user_id | UUID | Yes | Ownership |
| operation_type | TEXT | Yes | Fact confirm, Reroute, etc. |
| request_hash | TEXT | Yes | Semantic request hash |
| response_reference | UUID/TEXT | Yes | Created result |
| created_at | TIMESTAMP | Yes | UTC |
| expires_at | TIMESTAMP | No | Optional |

## Audit Events

### Table: `audit_events`

| Field | Type | Required | Notes |
|---|---|---:|---|
| audit_event_id | UUID | Yes | Primary key |
| user_id | UUID | No | Optional system event |
| actor_id | UUID/TEXT | Yes | Actor |
| event_type | TEXT | Yes | Canonical event |
| resource_type | TEXT | Yes | Fact, Route, Provenance, etc. |
| resource_id | UUID/TEXT | Yes | Target |
| metadata | JSON | No | Redacted |
| created_at | TIMESTAMP | Yes | UTC |

## Relationship Summary

```text
User
 ├── Provenance Records
 ├── Facts
 │    └── Fact Events
 ├── Plans
 │    ├── Goals
 │    ├── Actions
 │    ├── Requirements
 │    ├── Obligations
 │    ├── Constraints
 │    ├── Deadlines
 │    ├── Blockers
 │    └── Dependencies
 ├── Graph Versions
 │    ├── Graph Nodes
 │    └── Graph Edges
 ├── Routes
 │    └── Route Versions
 │         └── Route Steps
 │              └── Explanations
 └── Reroute Events
```

## Migration Rules

- Schema changes must be forward-compatible where practical.
- Published immutable records must not be rewritten in place.
- Breaking changes require data backfill and compatibility plans.
- Every migration must include tests and rollback or recovery instructions.
- Changes to canonical domain meaning require an ADR.

## Acceptance Criteria

The schema reference is complete when:

1. All canonical domain entities have defined persistence contracts.
2. Required keys and ownership fields are explicit.
3. Immutability rules are enforceable.
4. State transitions are consistent with the Domain Model.
5. Route replay metadata is preserved.
6. Cross-user relationships are prohibited.
7. Reroute and Provenance history remain traceable.
8. Migration requirements are explicit.
9. API payloads can map cleanly to persistence contracts.
10. Schema validation tests exist.

## Traceability

Supports:

- data-architecture.md
- domain-model.md
- route-engine.md
- dependency-graph.md
- provenance.md
- route-api.md
- facts-api.md
- provenance-api.md
- reroute-api.md

## Definition of Done

The data schema is complete when every Release 1 entity, key, constraint, relationship, lifecycle rule, and versioning requirement is implementable without ambiguity and remains consistent with the Version 2 Design Freeze.
