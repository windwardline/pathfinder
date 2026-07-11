
# API Design Principles

**Version:** 1.0  
**Status:** Canonical API Standard

## Purpose

This document defines the API philosophy for Pathfinder Release 1. It ensures every API preserves the Route-first architecture, deterministic behavior, and Confirmed Fact trust model.

## Architectural Principles

- APIs expose product capabilities, not internal implementation.
- The Route is the primary externally consumable artifact.
- The Dependency Graph is never exposed as a required client model.
- APIs are deterministic for identical inputs.
- Only Confirmed Facts affect Route generation.

## Resource Model

Primary resources:

- Route
- Route Version
- Reroute
- Fact
- Proposed Fact
- Confirmed Fact
- Provenance
- Goal
- Action

Graph nodes and edges remain internal infrastructure.

## Design Rules

- Resource-oriented endpoints.
- Stable identifiers.
- Versioned contracts.
- Idempotent operations where applicable.
- Explicit validation errors.
- Consistent pagination for collections.
- ISO-8601 timestamps.
- Canonical terminology only.

## Trust Boundaries

APIs must never allow clients to:

- Publish Route Versions directly.
- Publish GraphVersions.
- Confirm Facts without the approved workflow.
- Override Route Engine sequencing.
- Modify Provenance history.

## Error Model

Responses should use consistent error objects containing:

- error_code
- message
- correlation_id
- retryable
- details (when safe)

Internal implementation details must never be exposed.

## Versioning

- Breaking changes require a new API version.
- User-visible behavioral changes require a Product Decision.
- Architectural contract changes require an ADR.

## Security

Every endpoint must enforce:

- authentication
- authorization
- user ownership
- input validation
- audit logging where appropriate

## Observability

APIs should emit structured telemetry for:

- request received
- validation failure
- authorization failure
- successful operation
- Route publication
- Reroute generation

## Release 1 Principles

Release 1 APIs prioritize:

1. Correctness
2. Determinism
3. Explainability
4. Backward compatibility
5. Performance

## Companion Specifications

- route-api.md
- facts-api.md
- provenance-api.md
- reroute-api.md

## Traceability

Supports:

- ADR-001 through ADR-005
- route-engine.md
- dependency-graph.md
- ai-boundaries.md
- provenance.md

## Definition of Done

API contracts are complete when they preserve Route-first behavior, protect trust boundaries, remain versioned, and are fully traceable to the canonical architecture.
