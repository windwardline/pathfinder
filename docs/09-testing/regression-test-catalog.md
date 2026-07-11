
# Regression Test Catalog

**Version:** 1.0
**Status:** Canonical Testing Specification

## Purpose

This catalog defines the regression suites that protect Pathfinder from unintended behavioral changes. Every release candidate must execute these suites to ensure the Version 2 Design Freeze remains intact.

## Principles

- Regression tests protect observable behavior.
- Deterministic routing is a release invariant.
- Golden Route Fixtures are the authoritative expected results.
- Any intentional behavior change requires updated fixtures and appropriate governance.

## Regression Suites

| Suite ID | Area | Protected Behavior |
|---|---|---|
| RT-001 | Route Engine | Deterministic Route ordering |
| RT-002 | Focus Action | Stable Focus Action selection |
| RT-003 | Facts | Proposed Facts never affect routing |
| RT-004 | Provenance | Every route-affecting Fact remains traceable |
| RT-005 | Dependency Graph | Valid graph generation from Confirmed Facts |
| RT-006 | Reroute | Stable Route Difference generation |
| RT-007 | Explanations | Reason codes remain consistent |
| RT-008 | Security | User ownership and isolation |
| RT-009 | API Contracts | Backward-compatible API behavior |
| RT-010 | Data Replay | Identical inputs reproduce identical Route Versions |

## Required Invariants

Every regression execution verifies:

- Identical Routing Snapshots produce identical Routes.
- Proposed Facts never change Route output.
- AI cannot alter sequencing.
- Published Route Versions remain immutable.
- Published GraphVersions remain immutable.
- Cross-user references are rejected.
- Route explanations match structured reason codes.

## Execution Policy

Regression suites run:

- On every pull request.
- Before merge to `main`.
- Before every release candidate.
- After schema migrations affecting routing.
- After rule-set changes.

## Failure Handling

A regression failure requires:

1. Investigation.
2. Root-cause identification.
3. Fixture comparison.
4. Product Decision or ADR if behavior intentionally changed.
5. Updated documentation before release.

## Release Gate

Release is blocked when:

- Any critical regression fails.
- Golden Route Fixtures fail.
- Acceptance tests fail.
- Route determinism cannot be demonstrated.

## Traceability

Supports:

- testing-strategy.md
- golden-route-fixtures.md
- acceptance-test-specification.md
- route-engine.md
- ADR-002
- ADR-004

## Definition of Done

The regression catalog is complete when all protected Route, Reroute, trust-boundary, API, and persistence behaviors are covered by automated regression suites and enforced in continuous integration.
