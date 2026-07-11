
# ADR-004 — Confirmed Fact Trust Model

**ADR:** 004  
**Status:** Accepted  
**Date:** 2026-07-10

## Context

Pathfinder's Route, Dependency Graph, and Route Engine depend on trustworthy state. During the Version 2 Design Freeze, the project adopted a strict distinction between **Proposed Facts** and **Confirmed Facts** to prevent extracted, inferred, or hallucinated information from influencing routing.

Without this boundary, deterministic routing, explainability, and user trust cannot be guaranteed.

## Decision

Only **Confirmed Facts** may influence:

- Route generation
- Route Version publication
- Dependency Graph derivation
- Action eligibility
- Blocker evaluation
- Constraint evaluation
- Deadline evaluation
- Focus Action selection
- Meaningful Reroute

Proposed Facts remain isolated until they are confirmed through an approved confirmation workflow.

## Decision Drivers

- User trust
- Explainability
- Provenance
- Deterministic behavior
- Auditability
- Safe AI integration

## Alternatives Considered

### Route from extracted AI facts

Rejected because extraction confidence is not equivalent to truth.

### Confidence-threshold activation

Rejected because probability is not a substitute for confirmation.

### Implicit confirmation

Rejected because users must retain control over route-affecting state.

## Consequences

### Positive

- Stable trust boundary
- Reproducible Routes
- Explainable routing decisions
- Safe document extraction workflow
- Clear provenance chain

### Trade-offs

- Additional confirmation steps
- More lifecycle management for facts
- Slightly slower onboarding in exchange for correctness

## Architectural Requirements

Implementation shall ensure:

- Every route-affecting fact has provenance.
- Proposed Facts cannot appear in published GraphVersions.
- Confirmation creates an immutable audit trail.
- Superseded Facts remain historically traceable.
- Missing provenance prevents activation where required.

## Validation

The implementation shall demonstrate:

1. Proposed Facts never affect routing.
2. Every route-affecting Confirmed Fact has provenance.
3. Superseded Facts preserve historical traceability.
4. Identical Confirmed Facts produce identical Routes.
5. AI cannot bypass confirmation.

## Cross References

- domain-model.md
- provenance.md
- dependency-graph.md
- route-engine.md
- ai-boundaries.md
- system-overview.md

## Decision Outcome

**Accepted**

Changes to the Confirmed Fact trust model require a superseding ADR. Any user-visible change to fact confirmation additionally requires an approved Product Decision.
