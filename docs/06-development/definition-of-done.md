
# Pathfinder Definition of Done

**Version:** 1.0  
**Status:** Canonical Development Standard

## Purpose

This document defines the minimum conditions required for Pathfinder work to be considered complete.

A story, feature, architectural change, documentation change, or release increment is not done merely because code exists or a user interface appears functional. Completion requires product alignment, architectural consistency, testing, documentation, privacy, safety, and review.

## Core Rule

Work is complete only when it preserves the Version 2 Design Freeze and satisfies all applicable criteria in this document.

## 1. Product Alignment

The work must:

- Strengthen the Route, Reroute, Route Engine, Route View, or the core Release 1 loop.
- Preserve the Route-first product identity.
- Use protected terminology consistently.
- Avoid introducing competing concepts.
- Stay within approved Release 1 scope unless governed by a Product Decision.
- Preserve the locked value proposition and product principles.

## 2. Architecture

The work must:

- Follow the canonical architecture:

  `Confirmed Facts → Dependency Graph → Route Engine → Route → Adaptive Route View`

- Preserve the Route Engine as the sole sequencing authority.
- Keep the Dependency Graph as infrastructure.
- Prevent AI from determining eligibility, priority, or order.
- Ensure only Confirmed Facts affect routing.
- Preserve Provenance for every route-affecting fact.
- Avoid undocumented architectural changes.

Architectural changes require an ADR.

## 3. Domain Integrity

The implementation must:

- Enforce canonical entity states and transitions.
- Preserve user ownership.
- Reject invalid domain state.
- Prevent Proposed Facts from entering routing.
- Preserve immutable Route Versions and GraphVersions.
- Prevent hard dependency cycles.
- Maintain historical traceability.

## 4. Functional Completion

The feature or story must:

- Meet all documented acceptance criteria.
- Support normal, empty, blocked, loading, and error states where applicable.
- Produce expected behavior across supported Release 1 scenarios.
- Avoid hidden or undocumented fallback behavior.
- Preserve the last valid Route when failures occur.

## 5. Testing

All applicable tests must exist and pass:

- Unit tests
- Integration tests
- Golden fixture tests
- Regression tests
- Metamorphic tests
- Adversarial tests
- Security tests
- Privacy tests
- Accessibility tests
- Performance tests

Critical routing invariants must be covered explicitly.

## 6. AI Safety

For any AI-related work:

- All model output is treated as untrusted input.
- Output schemas are validated.
- Prompt injection defenses are tested.
- AI cannot publish Confirmed Facts, GraphVersions, or Route Versions.
- AI cannot alter reason codes or sequencing.
- Deterministic fallback behavior exists.
- AI outage does not prevent routing from existing Confirmed Facts.

## 7. Security

The work must:

- Enforce authentication and authorization.
- Preserve strict user isolation.
- Avoid unnecessary sensitive logging.
- Follow least-privilege principles.
- Validate all external input.
- Protect Route, Fact, document, and Provenance access.
- Pass cross-user access tests.

Any user-isolation failure blocks completion.

## 8. Privacy

The work must:

- Collect only necessary data.
- Preserve explicit user control.
- Respect export and deletion requirements.
- Minimize sensitive retention.
- Avoid duplicating personal information unnecessarily.
- Preserve Provenance without weakening privacy.

## 9. Accessibility

User-facing work must:

- Support keyboard navigation.
- Provide semantic structure.
- Maintain logical focus order.
- Use accessible labels and error messages.
- Avoid color-only meaning.
- Support responsive layouts.
- Be usable in loading, empty, blocked, and error states.

## 10. Explainability

Any Route-affecting behavior must:

- Produce structured reason codes.
- Answer “Why it comes next.”
- Identify relevant Dependencies, Deadlines, Obligations, or Unlocks.
- Preserve supporting Provenance.
- Avoid introducing unsupported claims.

## 11. Documentation

The work must update all affected canonical documentation.

Documentation must:

- Use canonical terminology.
- Cross-reference existing sources rather than duplicate definitions.
- Include changes to requirements, architecture, risks, or tests.
- Add or supersede ADRs when required.
- Record Product Decisions for user-visible changes.
- Avoid stale or contradictory language.

## 12. Code Quality

Code must:

- Be readable and maintainable.
- Follow coding standards.
- Avoid unnecessary dependencies.
- Keep domain logic out of the UI.
- Keep business rules explicit.
- Avoid circular dependencies.
- Include comments only where the intent is not obvious from code.
- Pass linting, formatting, type checking, and static analysis.

## 13. Review

Completion requires:

- Peer review or independent agent review.
- Verification against acceptance criteria.
- Terminology review.
- Architecture review for shared contracts.
- Security and privacy review when applicable.
- Confirmation that scope has not expanded.

## 14. Traceability

Every completed item must link to:

- Story or task identifier
- Acceptance criteria
- Relevant Product Decision or ADR
- Relevant canonical specification
- Test evidence

## 15. Operational Readiness

When applicable, the work must include:

- Migration strategy
- Rollback strategy
- Observability
- Error monitoring
- Logging
- Feature flags
- Deployment notes
- Data repair or recovery considerations

## 16. Story-Level Definition of Done

A user story is done when:

1. Acceptance criteria are satisfied.
2. Required tests pass.
3. Documentation is updated.
4. Review is complete.
5. No critical or high-severity defect remains.
6. Route-first architecture is preserved.
7. Security, privacy, and accessibility requirements are met.

## 17. Release-Level Definition of Done

Release 1 is done when:

1. The full core loop is demonstrated:

   `Capture → Confirm → Map → Route → Explain → Update → Reroute`

2. Identical inputs produce identical Routes.
3. Proposed Facts never affect routing.
4. Every route-affecting fact has Provenance.
5. Meaningful Reroute is demonstrated.
6. AI cannot alter sequencing.
7. Cross-user isolation passes.
8. Accessibility release gates pass.
9. Critical and high-priority risks have accepted mitigations.
10. Backup demonstration and seeded scenarios are validated.
11. Instructor-facing artifacts match canonical documentation.
12. No terminology drift remains across the repository.

## 18. Exceptions

Exceptions are not informal.

Any exception to this Definition of Done must include:

- documented rationale
- identified risk
- named owner
- mitigation
- expiration or follow-up condition
- approval through the appropriate Product Decision or ADR process

## 19. Traceability

Supports:

- coding-standards.md
- repository-structure.md
- testing-strategy.md
- release-1.md
- prd.md
- system-overview.md
- route-engine.md
- ai-boundaries.md
- provenance.md
- risk-register.md
- safety.md

## 20. Governance

This Definition of Done applies to all Pathfinder implementation work.

Changes require review by Product and Engineering. Changes affecting product behavior require a Product Decision. Changes affecting architecture require an ADR.

## 21. Final Completion Test

Before declaring work complete, the owner must be able to answer **yes** to all of the following:

- Is the Route-first identity preserved?
- Are the acceptance criteria met?
- Are trust boundaries intact?
- Are tests complete and passing?
- Is the documentation current?
- Is the work secure, private, accessible, and explainable?
- Has scope remained controlled?
- Can another engineer understand and maintain the result?

If any answer is **no**, the work is not done.
