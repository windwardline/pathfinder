# TDD Case Study: Deterministic Deadline Urgency

**Version:** 1.0  
**Status:** Verified Release 1.2 Evidence

## Feature Boundary

Release 1.2 removes deadline ranking authority from users and AI. Pathfinder
derives urgency only from the confirmed due date using a deterministic policy:

- 24 hours or less: `CRITICAL`
- 72 hours or less: `HIGH`
- 14 days or less: `MODERATE`
- later: `LOW`

This is the repository's single documented TDD feature case study.

## Red

The tests were written before the policy module and API transform existed.

```bash
pnpm --filter web test tests/validation.test.ts
```

The first run failed because `src/lib/deadline-policy.ts` and the derived
severity contract did not exist. The test also established that a client value
of `CRITICAL` for a deadline more than 14 days away must be replaced with
`LOW`.

Primary red tests:

- `derives deadline urgency from time remaining instead of user-selected priority`
- `overrides client-supplied deadline severity at the API boundary`

## Green

The minimum implementation added `deriveDeadlineSeverity`, applied it in the
deadline request schema, used the same policy for AI candidates, and removed
the ranking control from the frontend.

```bash
pnpm --filter web test tests/validation.test.ts
```

Result: 7 tests passed.

## Refactor and Regression Boundary

The policy lives in one pure function shared by server validation, AI candidate
persistence, and client presentation. The server transform remains
authoritative, so a modified client cannot restore user-selected severity.
Browser acceptance verifies that no deadline-ranking control is exposed.

Evidence:

- `apps/web/src/lib/deadline-policy.ts`
- `apps/web/src/lib/validation.ts`
- `apps/web/tests/validation.test.ts`
- `apps/web/tests/e2e/release-1.spec.ts`

## Release Verification

The feature is covered by unit, API-boundary, browser, accessibility, mobile,
typecheck, lint, and production-build gates. It does not change the Route
Engine's ownership of priority or sequencing.
