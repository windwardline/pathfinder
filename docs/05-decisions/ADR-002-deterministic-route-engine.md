
# ADR-002 — Deterministic Route Engine

**ADR:** 002  
**Status:** Accepted  
**Date:** 2026-07-10

## Context

A central architectural question during Version 2 Design Freeze was whether Route sequencing should be performed by probabilistic AI or deterministic rules.

Because Pathfinder's core value depends on trust, reproducibility, explainability, and auditability, relying on a language model to determine Route order would produce behavior that is difficult to verify and potentially inconsistent across identical inputs.

## Decision

Pathfinder shall implement a **deterministic Route Engine** as the exclusive authority for sequencing.

The Route Engine:

- Consumes only validated Routing Snapshots.
- Operates only on Confirmed Facts, verified Rules, and the Dependency Graph.
- Produces identical Route Versions from identical inputs, engine versions, and rule-set versions.
- Generates structured reason codes for every Route Step.
- Publishes immutable Route Versions.

AI may assist with interpretation and explanation but shall not determine eligibility, priority, ordering, or Focus Action selection.

## Decision Drivers

- User trust
- Explainability
- Reproducibility
- Testability
- Auditability
- Stable Reroute behavior
- Separation of deterministic logic from probabilistic AI

## Alternatives Considered

### AI-first sequencing

Rejected because identical inputs may not produce identical outputs and routing rationale cannot be guaranteed.

### Weighted machine-learning ranking

Rejected for Release 1 because opaque scoring weakens explainability and complicates testing.

### Manual user ordering

Rejected because it fails to model cross-domain dependencies consistently and weakens the Route-first product identity.

## Consequences

### Positive

- Deterministic routing behavior
- Reproducible Route Versions
- Reliable regression testing
- Explainable sequencing
- Strong separation between AI assistance and routing logic

### Trade-offs

- Additional engineering complexity
- Explicit rule maintenance
- Less flexibility than unconstrained AI generation

## Architectural Requirements

This decision requires:

- Lexicographic ranking for Release 1.
- Stable deterministic tie-breaking.
- Immutable Route Versions.
- Structured explanation reason codes.
- Golden fixture, regression, metamorphic, and adversarial tests.
- Rule-set and engine version recording.
- Atomic Route publication.

## Validation

The implementation shall demonstrate that:

1. Identical Routing Snapshots produce identical Routes.
2. Proposed Facts never affect sequencing.
3. AI cannot alter Route order.
4. Focus Action selection is deterministic.
5. Reroute comparisons are generated from structured Route differences.

## Cross References

- route-engine.md
- domain-model.md
- dependency-graph.md
- ai-boundaries.md
- provenance.md
- release-1.md
- prd.md

## Decision Outcome

**Accepted**

Future changes to routing behavior require:

- an approved Product Decision when user-visible behavior changes;
- a superseding ADR when architectural behavior changes.
