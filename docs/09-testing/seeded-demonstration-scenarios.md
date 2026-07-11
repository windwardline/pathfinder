
# Seeded Demonstration Scenarios

**Version:** 1.0  
**Status:** Canonical Testing Specification

## Purpose

This document defines the fixed demonstration scenarios for Pathfinder Release 1. These scenarios provide a consistent basis for instructor evaluations, stakeholder demonstrations, acceptance testing, and regression verification.

## Principles

- Every scenario uses seeded, fictional data.
- Scenarios are deterministic and repeatable.
- Demonstrations use canonical terminology only.
- Demonstrations validate product behavior, not presentation style.
- Expected outcomes are protected by the Golden Route Fixtures.

## Standard Scenario Package

Each scenario includes:

- Scenario ID
- Title
- Objective
- Initial Confirmed Facts
- Relevant Provenance
- Initial Route Version
- Demonstration steps
- Expected Route behavior
- Expected Reroute behavior (if applicable)
- Acceptance criteria

## Release 1 Demonstration Scenarios

| ID | Scenario | Objective |
|---|---|---|
| SD-001 | First-Time User | Generate an initial Route from Confirmed Facts |
| SD-002 | Identification Completed | Demonstrate prerequisite unlock behavior |
| SD-003 | Transportation Lost | Show meaningful Reroute after a confirmed constraint change |
| SD-004 | Housing Application Denied | Demonstrate Blocker creation and explanation |
| SD-005 | Work Schedule Conflict | Show deterministic handling of conflicting Obligations |
| SD-006 | Deadline Updated | Demonstrate deterministic reprioritization |
| SD-007 | Focus Action Completed | Show advancement to the next Focus Action |
| SD-008 | Proposed Fact Review | Demonstrate that Proposed Facts do not affect routing |
| SD-009 | Fact Confirmation | Demonstrate Route recalculation after confirmation |
| SD-010 | Route Completion | Demonstrate successful completion of all Goals |

## Demonstration Script Requirements

Each scripted demonstration shall:

1. Start from a known seeded dataset.
2. Execute only documented user actions.
3. Avoid manual data manipulation.
4. Show the Route before and after changes.
5. Explain why changes occurred using canonical explanations.
6. End with verification against expected results.

## Success Criteria

Every demonstration must verify:

- Deterministic Route generation
- Correct Focus Action
- Correct Route ordering
- Correct explanation reason codes
- Correct Reroute behavior where applicable
- Preservation of the Confirmed Fact trust boundary

## Instructor Evaluation

A demonstration is successful when:

- Expected behavior matches the Golden Route Fixture.
- No terminology drift is observed.
- No undocumented behavior occurs.
- No manual intervention is required.

## Change Control

Demonstration scenarios are version controlled.

Changes require:
- updated fixture references,
- documentation review,
- and a Product Decision or ADR if behavior changes.

## Traceability

Supports:

- golden-route-fixtures.md
- testing-strategy.md
- acceptance-test-specification.md
- route-engine.md
- route-api.md
- reroute-api.md

## Definition of Done

The seeded demonstration catalog is complete when every Release 1 demonstration is repeatable, deterministic, traceable to Golden Route Fixtures, and suitable for evaluation without modification.
