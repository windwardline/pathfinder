
# Pathfinder Testing Strategy

**Version:** 1.0  
**Status:** Canonical Development Standard

## Purpose

This document defines the testing strategy for Pathfinder Release 1. It converts the product and architecture guarantees into verifiable engineering controls.

Testing must prove that:

- The Route is deterministic.
- Only Confirmed Facts affect routing.
- AI cannot override sequencing.
- Provenance remains intact.
- Reroute behavior is meaningful and explainable.
- User data remains isolated.
- The product degrades safely under failure.

## Testing Principles

- Test behavior, not implementation detail.
- Prefer deterministic fixtures over informal manual checks.
- Treat AI output as untrusted.
- Preserve reproducibility across engine and rule-set versions.
- Require regression protection for every routing change.
- Test normal, empty, blocked, error, and adversarial states.

## Documented TDD Feature — Selectable Demonstration Scenarios

One Release 1 feature is preserved as an explicit red → green → refactor
case study for instructor review: selecting any canonical seeded demonstration
scenario from SD-001 through SD-010.

### Requirement

The feature derives from `seeded-demonstration-scenarios.md`: every canonical
scenario must start from a known fictional dataset, be selectable without
manual database manipulation, and preserve the Confirmed Fact trust boundary.

### Red

Commit `cccfa2f` added the specification before the implementation. The focused
integration run produced three expected failures:

- the endpoint did not return the requested scenario identifier,
- SD-008 contained no Proposed Fact,
- and an unknown scenario identifier returned success instead of a validation error.

Reproduction command:

```bash
POSTGRES_URL=postgres://localhost:5432/pathfinder_review \
AUTH_SECRET=<local-test-secret> \
pnpm --filter web test -- tests/api-lifecycle.integration.test.ts
```

### Green

Commit `b267351` added the smallest complete implementation: a validated
scenario-selection contract, fictional fixtures for SD-001 through SD-010,
the empty-state selector, and preservation of Proposed-Fact isolation.

The focused result was 14 passing integration tests. The browser suite also
passed four tests covering the default demonstration, Proposed Fact
confirmation, SD-010 selection, and the 390px experience.

### Refactor

Public scenario labels and objectives are isolated in
`apps/web/src/lib/demo-scenario-catalog.ts`. Dependency fixtures remain in the
server-imported `apps/web/src/lib/demo-scenarios.ts`; the client does not receive
Dependency Graph structure. This preserves ADR-005 while keeping the UI catalog
easy to review.

### Evidence Map

| Evidence | Repository location |
|---|---|
| Canonical scenarios | `docs/09-testing/seeded-demonstration-scenarios.md` |
| Test-first specification | `apps/web/tests/api-lifecycle.integration.test.ts` |
| Browser acceptance | `apps/web/tests/e2e/release-1.spec.ts` |
| Validated seed endpoint | `apps/web/src/app/api/demo/seed/route.ts` |
| Metadata-only UI catalog | `apps/web/src/lib/demo-scenario-catalog.ts` |
| Server-side fixtures | `apps/web/src/lib/demo-scenarios.ts` |

Only this feature is presented as the repository's formal TDD case study.
Other automated tests remain ordinary regression, integration, security, or
acceptance evidence.

## Testing Pyramid

### 1. Unit Tests

Unit tests cover isolated business rules.

Required coverage:

- Fact state transitions
- Provenance validation
- Graph node and edge validation
- Cycle detection
- Action eligibility
- Ranking factor evaluation
- Lexicographic ordering
- Tie-breaking
- Explanation reason-code generation
- Route difference logic

### 2. Integration Tests

Integration tests verify boundaries between components.

Required flows:

- Proposed Fact → Confirmed Fact
- Confirmed Facts → Dependency Graph
- Dependency Graph → Routing Snapshot
- Routing Snapshot → Route Version
- Confirmed change → Reroute
- Route Version → Adaptive Route View
- Provenance propagation
- User ownership enforcement

### 3. Regression Tests

Regression tests protect published behavior.

Required regression controls:

- Golden Route fixtures
- Stable Route ordering
- Stable Focus Action selection
- Stable reason-code output
- Stable blocked-state classification
- Stable Route-difference behavior

Any intended change to expected Route behavior must include:

1. Updated fixture.
2. Product or architecture rationale.
3. Product Decision or ADR when required.
4. Review of downstream documentation.

## Golden Fixture Strategy

Each fixture must include:

- Fixture identifier
- Scenario description
- Confirmed Facts
- Plan state
- GraphVersion
- engine version
- rule-set version
- expected Focus Action
- expected ordered Route
- expected blocked Actions
- expected explanation reason codes
- expected Reroute diff, when applicable

Golden fixtures are canonical test assets and must be version controlled.

## Required Release 1 Scenarios

1. Identification prerequisite unlocks employment onboarding.
2. Transportation loss changes the Route.
3. Supervision Obligation conflicts with a work schedule.
4. Housing denial introduces a Blocker.
5. Completed Focus Action advances the Route.
6. Proposed document extraction has no routing effect.
7. Confirmed Deadline change causes a meaningful Reroute.
8. Missing Provenance blocks fact activation.
9. All remaining Actions are blocked.
10. All Goals are complete.

## Metamorphic Testing

Metamorphic tests verify invariants across transformations.

Required properties:

- Reordering input records does not change the Route.
- Adding an unrelated Confirmed Fact does not change the Route.
- A Proposed Fact never changes the Route.
- Re-running the same snapshot produces the same Route.
- Completing the Focus Action produces an expected Reroute.
- Changing only explanation wording does not change Route order.
- Updating an inactive Constraint does not affect the Route.

## Adversarial Testing

Adversarial tests must cover:

- Prompt injection
- Hallucinated facts
- Cross-user node references
- Forged Provenance
- Missing source references
- Cyclic hard dependencies
- Unsupported edge types
- LLM-supplied priority values
- Conflicting mandatory Obligations
- Malformed routing snapshots
- Partial persistence failures
- Rule-set version mismatch

## AI Boundary Testing

The AI layer must be tested independently from routing.

Required assertions:

- AI cannot publish Confirmed Facts.
- AI cannot publish GraphVersions.
- AI cannot publish Route Versions.
- AI cannot set priority.
- AI cannot alter explanation reason codes.
- AI outage does not prevent deterministic routing.
- Deterministic templates replace failed explanations safely.

## Security Testing

Required security coverage:

- Authentication
- Authorization
- Cross-user isolation
- Ownership checks
- Sensitive logging review
- Document-access isolation
- Administrative access auditing
- Export authorization

Any user-isolation failure blocks release.

## Privacy Testing

Privacy verification must confirm:

- Data minimization
- Explicit sharing
- Correct retention behavior
- Approved deletion behavior
- Redaction in logs
- Provenance preservation without unnecessary duplication

## Accessibility Testing

Release 1 testing must include:

- Keyboard navigation
- Screen-reader compatibility
- Focus order
- Semantic headings and labels
- Error-message clarity
- Color-independent meaning
- Responsive behavior
- Loading, empty, blocked, and error states

## Performance Testing

Release 1 engineering targets:

- Route evaluation within 500 ms under normal demonstration conditions
- Reroute comparison within 250 ms after Route generation
- Graph build and validation within 500 ms for 500 nodes and 2,000 edges
- Prerequisite and downstream traversal within 100 ms

Correctness and determinism take precedence over speed.

## Reliability Testing

Required reliability cases:

- AI service unavailable
- Database write failure
- Partial GraphVersion creation
- Route publication failure
- Explanation service timeout
- Retry behavior
- Preservation of the last valid Route

No new Route Version may be published partially.

## Test Data Rules

- Use fictional or safely de-identified data.
- Never commit real sensitive user information.
- Fixtures must be reproducible.
- Scenario assumptions must be documented.
- Test data must preserve canonical terminology.

## Coverage Expectations

Coverage metrics are secondary to behavior coverage.

Minimum expectations:

- Full coverage of routing invariants
- Full coverage of trust boundaries
- Full coverage of failure states
- Full coverage of user-isolation paths
- Regression coverage for every published fixture

## Continuous Integration Gates

A pull request may not merge unless:

1. Unit tests pass.
2. Integration tests pass.
3. Golden fixtures pass.
4. Metamorphic tests pass.
5. Security checks pass.
6. Documentation changes are included when required.
7. No unauthorized terminology drift is introduced.

## Release Gates

Release 1 may not ship unless:

- Identical inputs produce identical Routes.
- Proposed Facts never affect routing.
- AI cannot alter sequencing.
- Provenance is complete.
- Meaningful Reroute is demonstrated.
- Cross-user isolation passes.
- Accessibility checks pass.
- Safe degradation is verified.
- All critical and high-priority risks have accepted mitigations.

## Defect Severity

### Critical

- Cross-user data exposure
- AI alters sequencing
- Proposed Fact affects Route
- Non-deterministic Route
- Missing Provenance on route-affecting fact

### High

- Incorrect Focus Action
- Incorrect Reroute diff
- Broken blocked-state behavior
- Inaccessible primary Route flow

### Medium

- Explanation wording defect
- Non-critical performance regression
- Secondary UI inconsistency

### Low

- Cosmetic or non-blocking documentation issue

## Traceability

Supports:

- coding-standards.md
- repository-structure.md
- route-engine.md
- dependency-graph.md
- ai-boundaries.md
- provenance.md
- safety.md
- privacy-security-specification.md
- ADR-002
- ADR-003
- ADR-004

## Definition of Done

The testing strategy is implemented when:

- all required test layers exist,
- golden fixtures are version controlled,
- deterministic guarantees are enforced in CI,
- adversarial and security tests pass,
- accessibility and performance gates are defined,
- and Release 1 cannot ship when any critical trust boundary fails.
