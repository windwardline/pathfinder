
# Pathfinder Branching Strategy

**Version:** 1.0  
**Status:** Canonical Development Standard

## Purpose

This document defines the Git branching, merge, release, and version control strategy for Pathfinder Release 1. It establishes a lightweight workflow that preserves repository quality while supporting deterministic development aligned with the Version 2 Design Freeze.

## Guiding Principles

- The `main` branch is always releasable.
- Documentation and architecture evolve before implementation.
- Small, reviewable changes are preferred over long-lived branches.
- Every merge is traceable to an issue, story, Product Decision, or ADR.
- No branch may redefine canonical terminology or architecture.

## Branch Types

### `main`

The canonical production branch.

Requirements:

- Protected from direct pushes.
- All required checks pass before merge.
- Reflects the current approved Release 1 state.

### `feature/*`

Used for scoped implementation work.

Examples:

- `feature/route-engine-ranking`
- `feature/provenance-service`
- `feature/adaptive-route-view`

Requirements:

- One feature or story per branch.
- Rebased regularly.
- Deleted after merge.

### `bugfix/*`

Used for defect correction without expanding scope.

### `docs/*`

Used for canonical documentation updates.

### `hotfix/*`

Reserved for production-critical fixes after a tagged release.

## Branch Naming

Format:

`<type>/<short-kebab-case-description>`

Do not use personal names, ticket-only names, or vague descriptions.

## Merge Strategy

Use **Squash and Merge** by default.

This keeps history focused on completed work while preserving review discussion in pull requests.

Merge commits should be reserved for exceptional cases where branch history must be retained.

## Pull Request Requirements

Every pull request must include:

- Purpose
- Scope
- Linked issue or story
- Test evidence
- Documentation updates (if applicable)
- Risks
- Screenshots or recordings for UI changes (when relevant)

## Required Checks

A pull request may merge only when:

- All automated tests pass.
- Golden Route fixtures pass.
- Static analysis passes.
- Documentation is updated when required.
- No terminology drift is introduced.
- Required reviews are complete.

## Release Tags

Use semantic versioning for application releases:

- `v1.0.0`
- `v1.1.0`
- `v1.1.1`

Documentation versions remain independent and are recorded within each document.

## Change Governance

The following changes require additional approval:

- Product behavior → Product Decision
- Architecture → ADR
- Repository standards → Development standards review
- Security or privacy controls → Security review

## Commit Guidelines

Commits should:

- Represent one logical change.
- Use descriptive messages.
- Reference related issues when available.
- Avoid mixing refactoring with feature work.

Example:

`feat(route-engine): add deterministic tie-breaking`

## Repository Hygiene

- Delete merged branches.
- Keep branches short-lived.
- Avoid committing generated artifacts unless explicitly versioned.
- Do not commit secrets, credentials, or production data.
- Use fictional or approved test data only.

## Release Readiness

Before creating a release tag:

1. All Release 1 gates pass.
2. Documentation is synchronized.
3. Critical risks are reviewed.
4. Open high-severity defects are resolved or formally accepted.
5. Required demonstrations succeed.

## Traceability

Supports:

- repository-structure.md
- coding-standards.md
- testing-strategy.md
- definition-of-done.md
- ADR-001 through ADR-006 and applicable Product Decisions

## Definition of Done

This branching strategy is complete when every repository contribution follows a consistent branching model, protected merge process, review workflow, and release governance without compromising the Version 2 Design Freeze.
