
# Pathfinder Repository Structure

**Version:** 1.0  
**Status:** Canonical Development Standard

## Purpose

This document defines the canonical repository layout for Pathfinder. It establishes ownership boundaries, dependency rules, documentation conventions, and the organization of implementation assets. The repository is the single source of truth for engineering work following the Version 2 Design Freeze.

## Guiding Principles

- Documentation precedes implementation.
- The repository reflects the product architecture.
- Canonical terminology is used consistently.
- Each artifact has one authoritative location.
- Product behavior is governed by ADRs and Product Decisions.

## Top-Level Layout

```text
/
├── docs/
├── apps/
├── services/
├── packages/
├── tests/
├── scripts/
├── infrastructure/
├── tools/
└── .github/
```

## Directory Responsibilities

### docs/

Canonical documentation only.

```text
docs/
├── 00-governance/
├── 01-product/
├── 02-architecture/
├── 03-research/
├── 04-risk/
├── 05-decisions/
├── 06-development/
├── 07-api/
├── 08-data/
├── 09-testing/
├── 10-operations/
└── 11-implementation/
```

Documentation in `docs/` governs implementation.

### apps/

User-facing applications such as web or mobile clients.

Rules:

- No routing logic.
- Consume published APIs.
- Display Routes and Reroutes.
- Respect canonical terminology.

### services/

Backend services implementing business capabilities.

Expected examples:

- Route Engine
- Fact Service
- Provenance Service
- Document Processing
- Authentication

Business rules belong here rather than in clients.

### packages/

Reusable shared libraries.

Examples:

- domain models
- validation
- shared types
- logging
- testing utilities

Packages must not introduce circular dependencies.

### tests/

Automated testing.

```text
tests/
├── unit/
├── integration/
├── regression/
├── fixtures/
├── adversarial/
└── performance/
```

Golden Route fixtures belong in `fixtures/`.

### scripts/

Developer automation and repository tooling.

Scripts must not contain business logic.

### infrastructure/

Deployment, configuration, and environment automation.

### tools/

Internal engineering utilities only.

### .github/

Repository automation, templates, workflows, and contribution support.

## Dependency Rules

- Applications depend on services through published interfaces.
- Services may depend on shared packages.
- Packages do not depend on applications.
- Tests may depend on all implementation layers.
- Documentation does not depend on implementation.

## Documentation Conventions

- One concept, one canonical document.
- ADRs capture architectural decisions.
- Product Decisions capture user-visible changes.
- Cross-reference rather than duplicate content.

## Ownership

| Area | Primary Owner |
|---|---|
| Governance | Product |
| Product | Product |
| Architecture | Architecture |
| Research | Product |
| Risk | Product & Architecture |
| Development Standards | Engineering |
| APIs | Engineering |
| Data | Engineering |
| Testing | Engineering |
| Operations | Engineering |

## Change Governance

Changes affecting:

- product behavior require a Product Decision.
- architecture require a superseding ADR.
- repository organization require review for cross-document consistency.

## Acceptance Criteria

The repository structure is complete when:

1. Every artifact has a single authoritative location.
2. Implementation follows documented boundaries.
3. Canonical terminology is preserved.
4. Architectural dependencies remain acyclic.
5. Documentation remains the governing source for implementation.

## Traceability

Supports:

- ADR-001 through ADR-005
- coding-standards.md
- system-overview.md
- domain-model.md

## Definition of Done

This repository structure is complete when engineering teams can locate, implement, review, and maintain Pathfinder artifacts without ambiguity while preserving the Version 2 Design Freeze.
