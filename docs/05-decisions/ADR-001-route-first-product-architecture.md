
# ADR-001 — Route-First Product Architecture

**ADR:** 001  
**Status:** Accepted  
**Date:** 2026-07-10

## Context

During Version 2 Design Freeze, Pathfinder's defining question became:

> What is the product?

Alternative framings considered included:

- AI reentry assistant
- Checklist application
- Case management platform
- Resource directory
- Personalized planning tool

Each overlapped with existing products and weakened differentiation.

## Decision

Pathfinder is a **Route-first** product.

The primary product artifact is the **Route**.

The Route is continuously generated from:

- Confirmed Facts
- Verified Rules
- Dependency Graph
- Deterministic Route Engine

The Route is presented through the Adaptive Route View and updated through meaningful Reroute behavior.

## Consequences

### Positive

- Preserves a clear product identity.
- Aligns engineering around a single core artifact.
- Separates infrastructure from user experience.
- Improves explainability and traceability.
- Reduces feature drift toward generic planning tools.

### Trade-offs

- Requires more sophisticated routing logic.
- Increases emphasis on trust, provenance, and deterministic behavior.
- Delays non-essential features that do not strengthen the Route.

## Alternatives Rejected

### Checklist-first

Rejected because sequencing and dependency relationships become implicit rather than explicit.

### Chatbot-first

Rejected because conversational interfaces do not inherently preserve deterministic routing or explainability.

### Resource-directory-first

Rejected because finding resources is only one part of executing a Route.

### Case-management-first

Rejected because Release 1 is user-controlled rather than organization-controlled.

## Architectural Implications

This decision requires:

- The Route Engine to remain the sole sequencing authority.
- The Dependency Graph to remain infrastructure.
- AI to remain outside deterministic sequencing.
- Only Confirmed Facts to influence routing.
- Every route-affecting fact to preserve provenance.

## Cross References

- vision-lock.md
- product-philosophy.md
- product-principles.md
- release-1.md
- prd.md
- system-overview.md
- domain-model.md
- route-engine.md
- dependency-graph.md

## Decision Outcome

**Accepted**

This decision is considered foundational. Changes require both:

- an approved Product Decision, and
- a superseding Architecture Decision Record.
