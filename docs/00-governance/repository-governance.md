
# Repository Governance

**Version:** 1.0
**Status:** Canonical Governance Specification

## Purpose

This document defines how the Pathfinder repository is governed after the Version 2 Design Freeze. It establishes the decision hierarchy, document authority, review expectations, and change-control process used throughout development.

## Governance Hierarchy

Authority is applied in the following order:

1. Approved Product Decisions
2. Approved Architecture Decision Records (ADRs)
3. Version 2 Design Freeze
4. Canonical repository specifications
5. Implementation

Implementation must conform to the higher layers and must not redefine them.

## Change Categories

### Documentation Clarification

Improves wording without changing meaning.

Requires:
- Documentation review

### Product Change

Changes user-visible behavior.

Requires:
- Product Decision
- Documentation updates
- Acceptance test updates

### Architectural Change

Changes system structure or technical boundaries.

Requires:
- New or superseding ADR
- Architecture review
- Regression review

### Operational Change

Changes deployment, monitoring, recovery, or operational practice.

Requires:
- Operations review
- Documentation updates

## Canonical Terminology

The following concepts are protected:

- Route
- Reroute
- Route Engine
- Focus Action
- Confirmed Fact
- Proposed Fact
- Dependency Graph
- Provenance

Competing terminology shall not be introduced without governance approval.

## Repository Reviews

Every substantive change should be evaluated for:

- Terminology consistency
- Architectural consistency
- Scope alignment
- Documentation synchronization
- Testing impact
- Operational impact

## Required Updates

The following artifacts must be updated when applicable:

- Product specifications
- Architecture specifications
- API specifications
- Data specifications
- Testing specifications
- Operations specifications
- ADRs
- Product Decisions

## Release Governance

No release may knowingly diverge from canonical documentation.

Intentional behavior changes require updated documentation before release approval.

## Auditability

Repository history should clearly identify:

- Why a change occurred
- Who approved it
- Which documents changed
- Which tests changed
- Which Product Decision or ADR authorized it

## Traceability

Supports:

- repository-structure.md
- contributing.md
- branching-strategy.md
- definition-of-done.md
- release-management.md
- ADR-001 through ADR-005

## Definition of Done

Repository governance is complete when every significant product, architecture, documentation, testing, data, and operational change is traceable to an approved decision and remains consistent with the Version 2 Design Freeze.
