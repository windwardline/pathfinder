
# Pathfinder Coding Standards

**Version:** 1.0  
**Status:** Canonical Development Standard

## Purpose

This document defines the engineering standards for implementing Pathfinder Release 1. Its purpose is to ensure consistency, maintainability, deterministic behavior, and traceability to the Version 2 Design Freeze.

## Guiding Principles

- Implement the architecture as documented.
- Optimize for readability before cleverness.
- Favor deterministic behavior over implicit behavior.
- Keep domain logic independent of frameworks.
- Preserve user trust through explicit code.

## Repository Structure

The repository is organized by responsibility:

- `/docs` — Canonical documentation
- `/apps` — User-facing applications
- `/services` — Backend services
- `/packages` — Shared libraries
- `/tests` — Automated test suites
- `/scripts` — Development tooling

Implementation must not redefine the canonical terminology established in the glossary.

## Naming Standards

Use canonical product language:

- Route
- Reroute
- Route Engine
- Confirmed Fact
- Proposed Fact
- Dependency Graph
- Focus Action
- Provenance

Avoid introducing synonyms that duplicate existing concepts.

## Architecture Rules

- Business rules belong in domain services.
- UI components must not contain routing logic.
- AI integrations must remain behind defined interfaces.
- Route sequencing belongs exclusively to the Route Engine.
- Only Confirmed Facts may influence routing.

## Code Quality

Every change should:

- compile successfully
- include automated tests where applicable
- avoid unnecessary dependencies
- document non-obvious decisions
- preserve backward compatibility within Release 1 unless governed by an approved ADR

## Testing Expectations

Minimum expectations:

- Unit tests for business logic
- Integration tests for service boundaries
- Regression tests for deterministic routing
- Adversarial tests for AI trust boundaries
- Golden fixture tests for Route generation

## Documentation Requirements

Changes that alter architecture or user-visible behavior require updates to the corresponding canonical documentation.

Architectural changes require a superseding ADR.

## Code Review Checklist

Reviewers should verify:

- Terminology consistency
- Deterministic behavior
- Route-first architecture
- Trust boundary preservation
- Test coverage
- Documentation updates

## Traceability

Supports:

- ADR-001
- ADR-002
- ADR-003
- ADR-004
- ADR-005
- route-engine.md
- dependency-graph.md
- ai-boundaries.md

## Definition of Done

A code change is complete when it satisfies coding standards, passes required automated tests, preserves architectural decisions, and maintains consistency with the Version 2 Design Freeze.
