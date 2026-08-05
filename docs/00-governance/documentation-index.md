
# Pathfinder Documentation Index

**Version:** 1.0  
**Status:** Canonical Governance Artifact

## Purpose

This document is the canonical index for the Pathfinder Product Operating System. It identifies the authoritative documentation layers, each artifact's purpose, governance role, ownership, and primary dependencies.

This index does not redefine product concepts. It helps contributors locate the single canonical source for each concept.

## Documentation Authority

The repository follows this authority order:

1. Approved Product Decisions
2. Approved Architecture Decision Records (ADRs)
3. Version 2 Design Freeze
4. Canonical repository documentation
5. Implementation

When documents conflict, the higher-authority source governs.

## 00 — Governance

| Document | Purpose | Primary Owner |
|---|---|---|
| documentation-constitution.md | Defines documentation rules and source-of-truth conventions | Product |
| repository-governance.md | Defines repository change governance | Product & Engineering |
| vision-lock.md | Preserves the frozen product identity | Product |
| glossary.md | Defines protected canonical terminology | Product |
| product-principles.md | Defines decision filters | Product |
| version-2-design-freeze.md | Freezes product identity and trust boundaries | Product |

## 01 — Product

| Document | Purpose | Primary Owner |
|---|---|---|
| vision.md | Explains why Pathfinder exists and where it is going | Product |
| product-philosophy.md | Explains the enduring Route-first philosophy | Product |
| prd.md | Defines executable product requirements | Product |
| release-1.md | Defines bounded Release 1 scope and proof | Product |

## 02 — Architecture

| Document | Purpose | Primary Owner |
|---|---|---|
| system-overview.md | Defines the high-level system architecture | Architecture |
| domain-model.md | Defines canonical entities, states, and invariants | Architecture |
| route-engine.md | Defines deterministic Route sequencing | Architecture |
| dependency-graph.md | Defines graph infrastructure contracts | Architecture |
| ai-boundaries.md | Defines AI permissions and prohibitions | Architecture |
| provenance.md | Defines evidence lineage and trust | Architecture |

## 03 — Research

| Document | Purpose | Primary Owner |
|---|---|---|
| problem-space.md | Defines the reentry sequencing problem | Product Research |
| literature-review.md | Synthesizes evidence supporting the problem space | Product Research |
| competitor-analysis.md | Tests differentiation against adjacent products | Product Research |
| validation.md | Defines product-hypothesis validation | Product Research |
| user-validation-plan.md | Defines the participant study protocol, phases, and stop conditions | Product Research |
| release-1-validation-study.md | Records the de-identified participant protocol and results | Product Research |

## 04 — Risk

| Document | Purpose | Primary Owner |
|---|---|---|
| risk-register.md | Tracks product and technical risks | Product & Architecture |
| privacy-security-specification.md | Defines privacy and security requirements | Architecture |
| safety.md | Defines safe product behavior | Product & Architecture |

## 05 — Decisions

| Document | Decision |
|---|---|
| ADR-001-route-first-product-architecture.md | The Route is the product |
| ADR-002-deterministic-route-engine.md | The Route Engine owns deterministic sequencing |
| ADR-003-ai-trust-boundary.md | AI is limited to interpretation and explanation |
| ADR-004-confirmed-fact-trust-model.md | Only Confirmed Facts affect routing |
| ADR-005-dependency-graph-as-infrastructure.md | The graph is infrastructure |
| ADR-006-compact-snapshot-persistence.md | Release 1 uses a compact immutable snapshot projection |
| PD-001-release-1-2-conformance.md | Release 1.2 closes conformance and pilot-readiness gaps |

## 06 — Development

| Document | Purpose | Primary Owner |
|---|---|---|
| coding-standards.md | Defines implementation standards | Engineering |
| repository-structure.md | Defines repository layout and ownership | Engineering |
| testing-strategy.md | Defines the full test strategy | Engineering |
| definition-of-done.md | Defines completion criteria | Product & Engineering |
| branching-strategy.md | Defines Git workflow | Engineering |
| contributing.md | Defines contribution governance | Engineering |

## 07 — API

| Document | Purpose | Primary Owner |
|---|---|---|
| api-design-principles.md | Defines API standards | Engineering |
| route-api.md | Defines Route retrieval contracts | Engineering |
| facts-api.md | Defines Proposed Fact and Confirmed Fact lifecycle | Engineering |
| provenance-api.md | Defines evidence and lineage contracts | Engineering |
| reroute-api.md | Defines deterministic Reroute contracts | Engineering |

## 08 — Data

| Document | Purpose | Primary Owner |
|---|---|---|
| data-architecture.md | Defines persistence architecture | Engineering |
| data-schema-reference.md | Defines canonical schema contracts | Engineering |
| data-lifecycle.md | Defines retention, export, deletion, and recovery | Engineering |
| data-dictionary.md | Defines shared data semantics | Engineering |

## 09 — Testing

| Document | Purpose | Primary Owner |
|---|---|---|
| golden-route-fixtures.md | Defines deterministic regression fixtures | Engineering |
| seeded-demonstration-scenarios.md | Defines repeatable demonstration flows | Product & Engineering |
| acceptance-test-specification.md | Defines Release 1 acceptance tests | Product & Engineering |
| regression-test-catalog.md | Defines protected behavior suites | Engineering |
| adversarial-test-catalog.md | Defines hostile-input and trust-boundary tests | Engineering & Security |
| tdd-case-study-deadline-urgency.md | Records the single Release 1.2 red-green-refactor case study | Engineering |

## 10 — Operations

| Document | Purpose | Primary Owner |
|---|---|---|
| deployment-strategy.md | Defines deployment and rollback | Engineering |
| release-management.md | Defines release governance | Product & Engineering |
| monitoring-observability.md | Defines operational telemetry | Engineering |
| incident-response.md | Defines production incident handling | Engineering |
| backup-recovery.md | Defines recovery and continuity | Engineering |
| operational-runbook.md | Defines routine operating procedures | Engineering |
| demo-day-runbook.md | Defines the governed live-demo and 90-second video procedure | Product & Engineering |
| release-1-2-record.md | Records the traceable Release 1.2 candidate and gates | Product & Engineering |

## 11 — Implementation

| Document | Purpose | Primary Owner |
|---|---|---|
| implementation-roadmap.md | Defines overall implementation sequence | Product & Engineering |
| repository-bootstrap.md | Defines repository initialization | Engineering |
| technology-stack.md | Governs technology selection | Architecture |
| backend-architecture.md | Defines backend boundaries | Architecture |
| frontend-architecture.md | Defines frontend boundaries | Architecture |
| ai-services-architecture.md | Defines AI service implementation | Architecture |
| infrastructure-architecture.md | Defines infrastructure topology | Architecture |
| ci-cd-architecture.md | Defines delivery automation | Engineering |
| implementation-phases.md | Defines detailed governed execution phases | Product & Engineering |
| requirements-traceability.md | Maps Release 1 requirements to implementation evidence | Product & Engineering |

## Canonical Concept Map

| Concept | Canonical Source |
|---|---|
| Product identity | vision-lock.md |
| Product philosophy | product-philosophy.md |
| Protected terminology | glossary.md |
| Release 1 scope | release-1.md |
| Functional requirements | prd.md |
| Route definition | glossary.md |
| Reroute definition | glossary.md |
| Route Engine behavior | route-engine.md |
| Dependency Graph behavior | dependency-graph.md |
| AI permissions | ai-boundaries.md |
| Provenance | provenance.md |
| Fact lifecycle | domain-model.md and facts-api.md |
| API behavior | 07-api documents |
| Persistence | data-architecture.md and data-schema-reference.md |
| Release testing | 09-testing documents |
| Operational readiness | 10-operations documents |
| Implementation sequence | implementation-phases.md |
| Implementation conformance | requirements-traceability.md |

## Change Impact Guide

When changing a concept, review all affected layers.

### Product behavior change

Review:

- Product Decision
- vision-lock.md
- prd.md
- release-1.md
- acceptance-test-specification.md
- seeded-demonstration-scenarios.md

### Architecture change

Review:

- ADR
- system-overview.md
- domain-model.md
- affected component specifications
- API and Data contracts
- testing-strategy.md

### API change

Review:

- api-design-principles.md
- affected API specification
- data-schema-reference.md
- frontend-architecture.md
- backend-architecture.md
- acceptance and regression tests

### Routing change

Review:

- ADR-002
- route-engine.md
- golden-route-fixtures.md
- regression-test-catalog.md
- acceptance-test-specification.md
- demonstration scenarios

### AI change

Review:

- ADR-003
- ai-boundaries.md
- ai-services-architecture.md
- adversarial-test-catalog.md
- privacy-security-specification.md
- safety.md

## Repository Completion Check

The Product Operating System is structurally complete when:

1. Every canonical concept has one source.
2. All documents are indexed.
3. Dependencies are traceable.
4. No duplicate concept definitions conflict.
5. Product Decisions and ADRs govern intentional change.
6. Instructor artifacts derive from canonical documentation.
7. Implementation and tests reference the same authoritative sources.

## Governance

This index must be updated whenever:

- a canonical document is added,
- a document is renamed,
- authority changes,
- ownership changes,
- or a document is superseded.

## Definition of Done

The Documentation Index is complete when every Pathfinder repository artifact has a clear location, purpose, owner, authority, and dependency path, enabling contributors to navigate the Product Operating System without ambiguity or terminology drift.
