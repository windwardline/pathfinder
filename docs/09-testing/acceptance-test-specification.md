
# Acceptance Test Specification

**Version:** 1.0
**Status:** Canonical Testing Specification

## Purpose

This specification defines the formal acceptance tests for Pathfinder Release 1. These tests verify that the implemented system satisfies the Version 2 Design Freeze, PRD, Release 1 Specification, and core architectural decisions.

## Acceptance Principles

- Acceptance tests validate externally observable behavior.
- Tests are deterministic and repeatable.
- Seeded data is required.
- Expected outcomes are defined by Golden Route Fixtures.
- Acceptance failures block Release 1.

## Test Case Format

Each acceptance test includes:

- Test ID
- Objective
- Preconditions
- Seeded scenario
- Test steps
- Expected results
- Pass/Fail criteria
- Traceability

## Acceptance Test Catalog

| ID | Objective | Primary Verification |
|---|---|---|
| AT-001 | Initial Route generation | Route generated from Confirmed Facts only |
| AT-002 | Focus Action selection | Deterministic Focus Action |
| AT-003 | Proposed Fact submission | No routing impact |
| AT-004 | Fact confirmation | Route recalculated |
| AT-005 | Transportation constraint | Meaningful Reroute |
| AT-006 | Housing blocker | Blocked Action and explanation |
| AT-007 | Deadline change | Deterministic reprioritization |
| AT-008 | Completed Focus Action | Correct next Focus Action |
| AT-009 | Provenance validation | Every route-affecting Fact traceable |
| AT-010 | Route completion | Completed Route state |

## Cross-Cutting Acceptance Criteria

Every applicable test verifies:

- Route-first behavior
- Deterministic sequencing
- Confirmed Fact trust boundary
- Provenance integrity
- Correct explanation reason codes
- User ownership enforcement
- No Dependency Graph exposure
- Canonical terminology

## Failure Classification

### Critical
- Non-deterministic Route
- Proposed Fact affects routing
- AI alters sequencing
- Cross-user data exposure

### Major
- Incorrect Focus Action
- Incorrect Route Difference
- Missing Provenance

### Minor
- Cosmetic UI issues
- Non-blocking wording defects

## Release Gate

Release 1 is accepted only when:

1. All acceptance tests pass.
2. Golden Route Fixtures pass.
3. Seeded Demonstration Scenarios pass.
4. No unresolved Critical defects remain.
5. Required documentation is synchronized.

## Traceability

Supports:

- prd.md
- release-1.md
- golden-route-fixtures.md
- seeded-demonstration-scenarios.md
- testing-strategy.md
- ADR-001 through ADR-005

## Definition of Done

The acceptance specification is complete when every Release 1 capability has a deterministic acceptance test, each test is traceable to canonical requirements, and successful execution objectively demonstrates product readiness.
