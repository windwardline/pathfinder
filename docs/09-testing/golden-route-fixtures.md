
# Golden Route Fixtures

**Version:** 1.0
**Status:** Canonical Testing Specification

## Purpose

Golden Route Fixtures are the canonical regression assets for Pathfinder Release 1. They prove that identical routing inputs always produce identical Route Versions and Reroute behavior.

## Principles

- Fixtures are immutable once approved.
- Every fixture is version controlled.
- Identical Routing Snapshots must produce identical outputs.
- Proposed Facts never affect expected results.
- AI output is never part of the expected routing result.

## Fixture Package

Every fixture shall contain:

- Fixture ID
- Scenario name
- Scenario description
- Confirmed Facts
- Provenance references
- Plan Version
- GraphVersion
- Engine version
- Rule-set version
- Input snapshot hash
- Expected Focus Action
- Expected ordered Route
- Expected blocked Actions
- Expected explanation reason codes
- Expected Route status
- Expected Reroute (if applicable)

## Required Release 1 Fixtures

| ID | Scenario | Primary Assertion |
|---|---|---|
| GF-001 | Initial Route generation | Deterministic Route creation |
| GF-002 | Identification unlocks employment | Unlock propagation |
| GF-003 | Transportation loss | Meaningful Reroute |
| GF-004 | Housing denial | Blocker handling |
| GF-005 | Supervision conflict | Constraint resolution |
| GF-006 | Deadline change | Route reprioritization |
| GF-007 | Focus Action completed | Correct successor selection |
| GF-008 | Proposed Fact submitted | No routing effect |
| GF-009 | Fact confirmation | Route recalculation |
| GF-010 | All Goals complete | Completed Route state |

## Validation Rules

Each fixture must verify:

- Stable Route ordering
- Stable Focus Action
- Stable reason codes
- Stable blocked state
- Stable Route status
- Stable Route Difference where applicable

## Change Control

Expected outputs may change only when:

1. A Product Decision changes user-visible behavior, or
2. An ADR changes routing architecture.

Fixture updates must include rationale and regression review.

## CI Requirements

Every pull request must execute all Golden Route Fixtures. Any unexpected output change blocks merging.

## Traceability

Supports:
- testing-strategy.md
- route-engine.md
- route-api.md
- reroute-api.md
- ADR-002
- ADR-004

## Definition of Done

The Golden Route Fixture catalog is complete when Release 1 routing behavior is reproducible, deterministic, version controlled, and protected by automated regression testing.
