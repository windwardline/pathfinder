
# Pathfinder Data Dictionary

**Version:** 1.0
**Status:** Canonical Data Specification

## Purpose

This document provides the canonical definitions for persistent data elements used throughout Pathfinder Release 1. It complements the Data Architecture, Data Schema Reference, Domain Model, and API specifications by ensuring that fields have one authoritative meaning.

## Principles

- One field, one meaning.
- Canonical terminology only.
- Definitions are implementation-independent.
- Changes to semantic meaning require governance.

## Global Fields

| Field | Definition |
|---|---|
| user_id | Unique identifier for the owner of all user-scoped records. |
| created_at | UTC timestamp when the record was created. |
| updated_at | UTC timestamp of the latest mutable update. |
| version | Monotonically increasing version for versioned entities. |
| status | Canonical lifecycle state for an entity. |
| metadata | Schema-validated supplemental information that does not alter business meaning. |

## Route Fields

| Field | Definition |
|---|---|
| route_id | Logical identity of a Route across versions. |
| route_version_id | Immutable published Route snapshot identifier. |
| engine_version | Version of the deterministic Route Engine used to generate the Route. |
| rule_set_version | Version of the verified Rules used during evaluation. |
| graph_version_id | Immutable graph snapshot used by the Route Engine. |
| input_snapshot_hash | Deterministic fingerprint of routing inputs used for replay. |

## Fact Fields

| Field | Definition |
|---|---|
| fact_id | Unique Fact identifier. |
| fact_type | Canonical classification of a Fact. |
| value_json | Validated structured value for the Fact. |
| provenance_id | Reference to supporting Provenance. |
| confirmed_at | Timestamp when the Fact became Confirmed. |
| confirmed_by | Actor responsible for confirmation. |

## Provenance Fields

| Field | Definition |
|---|---|
| source_type | Canonical evidence category. |
| source_reference | Human-auditable reference to the originating evidence. |
| integrity_hash | Hash used to detect unauthorized modification. |

## Routing Fields

| Field | Definition |
|---|---|
| position | Deterministic order of a Route Step within a Route Version. |
| reason_codes | Structured routing rationale consumed by explanation services. |
| focus_action | The single highest-priority eligible Action in the current Route. |

## Governance

Semantic changes to existing fields require:
1. Documentation updates.
2. API compatibility review.
3. Product Decision if user-visible.
4. ADR if architectural.

## Traceability

Supports:
- data-architecture.md
- data-schema-reference.md
- domain-model.md
- route-api.md
- facts-api.md
- provenance-api.md
- reroute-api.md

## Definition of Done

The data dictionary is complete when every shared field used across APIs, persistence, and architecture has one authoritative definition and no conflicting terminology exists.
