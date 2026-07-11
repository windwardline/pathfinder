
# Implementation Phases

**Version:** 1.0  
**Status:** Canonical Implementation Specification

## Purpose

This document defines the detailed execution phases for Pathfinder Release 1. It expands the Implementation Roadmap into governed work packages with explicit objectives, dependencies, deliverables, exit criteria, and quality gates.

## Principles

- Each phase delivers a verifiable increment.
- Dependencies are respected.
- No phase may bypass canonical documentation.
- Scope remains bounded by Release 1.
- Every phase ends with objective evidence.

## Phase 0 — Governance Readiness

### Objective

Confirm that the repository has the minimum canonical documentation required to begin implementation.

### Deliverables

- Vision Lock
- Product Principles
- PRD
- Release 1 Specification
- Core ADRs
- System Overview
- Testing Strategy
- Definition of Done

### Exit Criteria

- Canonical terminology is stable.
- Core architecture is documented.
- Product scope is frozen.
- No unresolved foundational contradiction remains.

## Phase 1 — Repository Foundation

### Objective

Create a reproducible, governed engineering environment.

### Deliverables

- Repository structure
- Branch protection
- Contribution templates
- CI skeleton
- Formatting and linting
- Static analysis
- Secret scanning
- Test harness

### Dependencies

- Phase 0 complete

### Exit Criteria

- New developer onboarding succeeds.
- CI runs on pull requests.
- `main` is protected.
- Repository standards are automated.

## Phase 2 — Identity, Ownership, and Persistence

### Objective

Establish the secure persistence and ownership model.

### Deliverables

- User model
- Authentication integration
- Authorization boundaries
- Relational schema
- Migration framework
- Audit events
- Idempotency records

### Dependencies

- Phase 1 complete
- Data Architecture approved
- Data Schema Reference approved

### Exit Criteria

- Cross-user access tests pass.
- Migrations execute in development and test.
- Ownership is enforced in persistence and service boundaries.
- Audit events are recorded.

## Phase 3 — Fact and Provenance Foundation

### Objective

Implement the Proposed Fact and Confirmed Fact trust model.

### Deliverables

- Fact entities
- Fact lifecycle transitions
- Provenance records
- Confirmation events
- Supersession
- Facts API
- Provenance API

### Dependencies

- Phase 2 complete
- ADR-004 accepted

### Exit Criteria

- Proposed Facts cannot affect routing.
- Confirmed Facts require Provenance.
- Supersession preserves history.
- Facts and Provenance integration tests pass.

## Phase 4 — Plan and Dependency Graph

### Objective

Implement the canonical Plan and Dependency Graph infrastructure.

### Deliverables

- Goals
- Actions
- Requirements
- Obligations
- Constraints
- Deadlines
- Blockers
- Dependencies
- GraphVersion generation
- Graph validation
- Cycle detection

### Dependencies

- Phase 3 complete
- ADR-005 accepted

### Exit Criteria

- Graph derivation is deterministic.
- Proposed Facts never enter published GraphVersions.
- Invalid hard cycles are rejected.
- GraphVersion immutability is enforced.

## Phase 5 — Route Engine

### Objective

Implement deterministic Route generation.

### Deliverables

- Routing Snapshot
- Eligibility rules
- Lexicographic ranking
- Stable tie-breaking
- Focus Action selection
- Route Version publication
- Explanation reason codes
- Blocked and completed Route states

### Dependencies

- Phase 4 complete
- ADR-002 accepted

### Exit Criteria

- Golden Route Fixtures pass.
- Identical inputs produce identical Routes.
- Focus Action is deterministic.
- No AI dependency exists in sequencing.

## Phase 6 — Reroute and Route History

### Objective

Implement meaningful Route change behavior.

### Deliverables

- Route History
- Reroute Event
- Structured Route Difference
- Trigger handling
- Concurrency control
- Reroute API
- Deterministic explanation payloads

### Dependencies

- Phase 5 complete

### Exit Criteria

- Confirmed changes produce expected Reroutes.
- Proposed Facts do not trigger Reroute.
- Stale Route Version requests are rejected.
- Route Differences match Golden Fixtures.

## Phase 7 — AI-Assisted Services

### Objective

Add bounded AI-assisted interpretation and explanation.

### Deliverables

- AI Gateway
- Prompt Template Registry
- Structured extraction
- Candidate Fact generation
- Explanation generation
- Deterministic fallbacks
- Prompt-injection defenses
- AI observability and cost controls

### Dependencies

- Phase 3 complete
- Phase 5 complete
- ADR-003 accepted

### Exit Criteria

- AI cannot confirm Facts.
- AI cannot alter Route order.
- AI outage does not block routing.
- Adversarial AI tests pass.

## Phase 8 — Frontend Core Experience

### Objective

Deliver the user-facing Route experience.

### Deliverables

- Authentication experience
- Today
- Route View
- Focus Action
- Fact Confirmation
- Explanation
- Reroute presentation
- Route History
- Loading, empty, blocked, completed, and error states

### Dependencies

- Route, Facts, Provenance, and Reroute APIs available

### Exit Criteria

- Seeded Demonstration Scenarios pass.
- Accessibility checks pass.
- Frontend does not contain sequencing logic.
- Canonical terminology is preserved.

## Phase 9 — Security, Privacy, and Safety Hardening

### Objective

Verify all trust and safety boundaries before release.

### Deliverables

- Security review
- Privacy review
- Authorization tests
- Prompt-injection tests
- Data lifecycle workflows
- Export and deletion
- Sensitive logging review
- Threat-model validation

### Dependencies

- Core product flow implemented

### Exit Criteria

- No unresolved critical security defects.
- Cross-user isolation passes.
- Data export and deletion are verified.
- Safety and adversarial test catalogs pass.

## Phase 10 — Operations and Production Readiness

### Objective

Prepare Pathfinder for repeatable deployment and operation.

### Deliverables

- Infrastructure provisioning
- CI/CD pipeline
- Monitoring and observability
- Backup and recovery
- Incident response
- Operational runbook
- Release management

### Dependencies

- Application Release Candidate available

### Exit Criteria

- Staging deployment succeeds.
- Rollback is tested.
- Recovery exercise succeeds.
- Alerts and dashboards function.
- Post-deployment verification passes.

## Phase 11 — Release Validation

### Objective

Prove Release 1 readiness against the canonical repository.

### Deliverables

- Acceptance test report
- Golden Route Fixture report
- Regression report
- Adversarial test report
- Accessibility report
- Risk review
- Release record
- Demonstration package

### Dependencies

- Phases 0–10 complete

### Exit Criteria

- All Release 1 acceptance tests pass.
- No unresolved Critical defects remain.
- High-priority risks have accepted mitigations.
- Route determinism is demonstrated.
- Meaningful Reroute is demonstrated.
- Instructor artifacts match canonical documentation.

## Cross-Phase Controls

Every phase must include:

- Updated documentation
- Traceability to requirements
- Required tests
- Independent review
- Risk review
- Scope verification
- Terminology review

## Dependency Rule

A later phase may begin early only when:

- shared contracts are stable,
- dependencies are documented,
- concurrent work cannot redefine upstream behavior,
- and integration order is known.

## Phase Exception Process

Exceptions require:

- documented rationale
- identified risk
- named owner
- mitigation
- approval
- expiration or follow-up condition

Exceptions cannot bypass Route determinism, Confirmed Fact boundaries, Provenance, or user isolation.

## Progress Reporting

Each phase report should include:

- status
- completed deliverables
- open blockers
- failed quality gates
- risks
- decisions required
- next phase readiness

## Traceability

Supports:

- implementation-roadmap.md
- repository-bootstrap.md
- backend-architecture.md
- frontend-architecture.md
- ai-services-architecture.md
- infrastructure-architecture.md
- ci-cd-architecture.md
- testing-strategy.md
- definition-of-done.md
- release-management.md
- ADR-001 through ADR-005

## Definition of Done

The implementation phase model is complete when every Release 1 capability is assigned to a governed phase with explicit dependencies, deliverables, quality gates, exit criteria, and traceability—and no phase can declare completion without objective evidence that the Version 2 Design Freeze remains intact.
