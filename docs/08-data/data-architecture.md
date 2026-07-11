
# Pathfinder Data Architecture

**Version:** 1.0  
**Status:** Canonical Data Specification

## Purpose

This document defines the persistence architecture for Pathfinder Release 1. It translates the canonical domain model into durable data structures while preserving determinism, user isolation, Provenance, Route reproducibility, and historical traceability.

## Data Principles

- The Route is the product.
- The Dependency Graph is infrastructure.
- Only Confirmed Facts may influence routing.
- Published Route Versions and GraphVersions are immutable.
- Every route-affecting fact has Provenance.
- Historical state is preserved through versioning and supersession.
- User ownership is enforced at every persistence boundary.
- Data design must support deterministic replay.

## Storage Model

Release 1 should use a relational database as the system of record.

The graph may be represented relationally or projected into an in-memory graph for routing, provided all domain invariants remain intact.

A dedicated graph database is not required for Release 1.

## Core Tables

### users

Stores the primary user record.

Required fields:

- `user_id`
- `status`
- `locale`
- `time_zone`
- `created_at`
- `updated_at`

### provenance_records

Stores immutable source lineage.

Required fields:

- `provenance_id`
- `user_id`
- `source_type`
- `source_reference`
- `integrity_hash`
- `created_by`
- `created_at`

### facts

Stores the current and historical Fact lifecycle.

Required fields:

- `fact_id`
- `user_id`
- `fact_type`
- `value_json`
- `status`
- `provenance_id`
- `version`
- `created_at`
- `updated_at`

Optional fields:

- `confirmed_at`
- `confirmed_by`
- `supersedes_fact_id`
- `superseded_by_fact_id`
- `expires_at`

### confirmation_events

Stores auditable confirmation, rejection, supersession, and expiration events.

Required fields:

- `event_id`
- `fact_id`
- `user_id`
- `event_type`
- `actor_id`
- `created_at`

### plans

Stores versioned user Plan snapshots.

Required fields:

- `plan_id`
- `user_id`
- `version`
- `status`
- `snapshot_hash`
- `created_at`

### goals

Stores Goals associated with a Plan version.

### actions

Stores Actions associated with a Plan version.

### requirements

Stores Requirements and satisfaction state.

### obligations

Stores mandatory commitments.

### constraints

Stores active and historical Constraints.

### deadlines

Stores route-relevant Deadlines.

### blockers

Stores active and historical Blockers.

### dependencies

Stores typed domain relationships.

Required fields:

- `dependency_id`
- `plan_id`
- `source_entity_id`
- `target_entity_id`
- `relationship_type`
- `hardness`
- `active`
- `created_at`

### graph_versions

Stores immutable graph snapshots.

Required fields:

- `graph_version_id`
- `user_id`
- `plan_version`
- `input_snapshot_hash`
- `schema_version`
- `rule_set_version`
- `status`
- `created_at`

### graph_nodes

Stores graph nodes for a GraphVersion.

### graph_edges

Stores graph edges for a GraphVersion.

### routes

Stores the logical Route identity.

### route_versions

Stores immutable Route snapshots.

Required fields:

- `route_version_id`
- `route_id`
- `user_id`
- `plan_version`
- `graph_version_id`
- `engine_version`
- `rule_set_version`
- `input_snapshot_hash`
- `status`
- `created_at`

### route_steps

Stores ordered Route Steps.

Required fields:

- `route_step_id`
- `route_version_id`
- `action_id`
- `position`
- `state`
- `explanation_id`

### explanations

Stores structured explanation data.

Required fields:

- `explanation_id`
- `route_step_id`
- `reason_codes`
- `provenance_references`
- `plain_language_text`
- `template_version`

### reroute_events

Stores immutable Route differences.

Required fields:

- `reroute_event_id`
- `user_id`
- `previous_route_version_id`
- `new_route_version_id`
- `trigger_type`
- `trigger_reference`
- `difference_json`
- `created_at`

## Ownership Model

Every user-scoped table must include `user_id` directly or inherit ownership through an immutable parent relationship.

Cross-user joins are prohibited unless executed by explicitly authorized system processes.

All queries must apply ownership constraints.

## Immutability Rules

Immutable after publication:

- Provenance Records referenced by published Routes
- Plan snapshots used for routing
- GraphVersions
- Route Versions
- Reroute Events
- Explanation reason-code payloads

Corrections create new records or versions rather than modifying historical state.

## Versioning

Versioned entities include:

- Fact
- Plan
- GraphVersion
- RouteVersion
- Rule set
- API schema
- Explanation template

Every Route Version must record enough version metadata to reproduce the result.

## Deterministic Replay

A Route must be reproducible using:

- Confirmed Facts
- Plan version
- GraphVersion
- engine version
- rule-set version
- input snapshot hash

Replay must not depend on mutable external state.

## Data Integrity

Required constraints include:

- foreign keys
- unique Route Step positions per Route Version
- valid fact state transitions
- unique idempotency keys per operation scope
- no cross-user references
- valid edge compatibility
- immutable published versions

## Transaction Boundaries

The following operations must be atomic:

- Fact confirmation
- GraphVersion publication
- RouteVersion publication
- Reroute Event creation
- Provenance creation with Fact linkage

Partial Route or Graph publication is prohibited.

## Retention

Release 1 retention principles:

- Retain only data needed for Route generation, auditability, and approved historical traceability.
- Minimize document content retention.
- Preserve Provenance metadata required by historical Route Versions.
- Support approved export and deletion workflows.
- Define environment-specific retention policies before production deployment.

## Deletion

User deletion must:

1. Verify authorization.
2. Identify dependent records.
3. Apply approved retention exceptions.
4. Remove or anonymize unnecessary personal data.
5. Preserve only the minimum audit evidence required.
6. record the deletion event.

## Indexing

Recommended indexes:

- user ownership fields
- current fact status
- plan version
- graph version
- route version
- route step position
- trigger reference
- Provenance source type
- created timestamps

## Migration Strategy

Every schema change requires:

- forward migration
- rollback or recovery plan
- compatibility review
- fixture updates
- test coverage
- documentation updates

Breaking data-model changes require an ADR.

## Backup and Recovery

Release 1 should support:

- scheduled backups
- restore verification
- point-in-time recovery where available
- documented recovery procedures
- protection of encryption keys and secrets

## Security

- Encrypt data in transit and at rest.
- Enforce least privilege.
- Separate application and administrative credentials.
- Audit administrative access.
- Never store secrets in source control.
- Redact sensitive values from logs.

## Observability

Track:

- failed transactions
- constraint violations
- cross-user access attempts
- migration failures
- Route publication latency
- backup success
- restore-test success

## Acceptance Criteria

The data architecture is complete when:

1. Every canonical entity has a durable representation.
2. Published GraphVersions and Route Versions are immutable.
3. Cross-user references are impossible through enforced constraints.
4. Route replay is reproducible.
5. Provenance remains traceable.
6. Fact supersession preserves history.
7. Atomic publication is enforced.
8. Retention and deletion workflows are documented.
9. Migration and recovery procedures exist.
10. Data-layer integration and adversarial tests pass.

## Required Tests

- Fact lifecycle persistence
- Provenance linkage
- Fact supersession
- Cross-user constraint rejection
- GraphVersion immutability
- RouteVersion immutability
- Atomic Route publication
- Reroute transaction rollback
- Deterministic replay
- Migration forward and rollback
- Deletion workflow
- Backup restore verification

## Traceability

Supports:

- domain-model.md
- route-engine.md
- dependency-graph.md
- provenance.md
- facts-api.md
- route-api.md
- reroute-api.md
- privacy-security-specification.md
- ADR-002
- ADR-004
- ADR-005

## Definition of Done

The data architecture is complete when Pathfinder can persist, reproduce, audit, secure, migrate, and recover Release 1 state without violating the Route-first architecture, the Confirmed Fact trust model, user ownership, or historical traceability.
