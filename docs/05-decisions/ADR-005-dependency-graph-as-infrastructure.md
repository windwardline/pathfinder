
# ADR-005 — Dependency Graph as Infrastructure

**ADR:** 005  
**Status:** Accepted  
**Date:** 2026-07-10

## Context

During the Version 2 Design Freeze, Pathfinder adopted a graph-based internal representation of relationships among Confirmed Facts, Actions, Goals, Requirements, Constraints, Deadlines, Blockers, and Verified Rules.

A key architectural question was whether this graph should become the primary product artifact or remain an internal implementation detail.

Making the graph user-facing would blur product identity, expose unnecessary complexity, and create competing mental models alongside the Route.

## Decision

The **Dependency Graph is infrastructure**.

Its responsibilities are limited to:

- Representing route-relevant relationships.
- Supporting deterministic Route generation.
- Supporting meaningful Reroute.
- Supporting explanation through structured data.
- Supporting validation and traversal.

The Dependency Graph is **not**:

- the product,
- the user interface,
- a planning surface,
- or an independent sequencing engine.

The Route remains the primary user-facing artifact.

## Decision Drivers

- Preserve Route-first identity.
- Minimize cognitive load.
- Separate implementation from experience.
- Improve maintainability.
- Enable deterministic routing.

## Alternatives Considered

### Graph-first product

Rejected because exposing graph complexity weakens usability and competes with the Route.

### Workflow engine without graph

Rejected because explicit dependency modeling improves traceability, validation, and deterministic routing.

### Ad hoc relationships

Rejected because implicit relationships are difficult to validate, test, and explain.

## Consequences

### Positive

- Stable architectural boundary.
- Clear separation of concerns.
- Better explainability through structured relationships.
- Freedom to evolve graph implementation without changing product behavior.

### Trade-offs

- Additional engineering complexity.
- Internal graph concepts require disciplined documentation.
- Graph optimizations must preserve deterministic behavior.

## Architectural Requirements

Implementation shall ensure:

- The graph is derived only from Confirmed Facts, verified Rules, and canonical domain state.
- The Route Engine is the sole sequencing authority.
- Published GraphVersions are immutable.
- Graph changes produce new GraphVersions rather than in-place mutation.
- The user interface consumes Route data rather than graph topology.
- AI cannot publish nodes or edges.

## Validation

The implementation shall demonstrate:

1. Graph derivation is deterministic.
2. Proposed Facts never enter published GraphVersions.
3. Hard dependency cycles prevent graph publication.
4. GraphVersion changes support meaningful Reroute.
5. The UI remains functional without exposing graph structure.

## Cross References

- dependency-graph.md
- route-engine.md
- domain-model.md
- ai-boundaries.md
- provenance.md
- system-overview.md

## Decision Outcome

**Accepted**

Changes to the role of the Dependency Graph require a superseding ADR. Any proposal to expose the graph as a primary user-facing artifact also requires an approved Product Decision.
