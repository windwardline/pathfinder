
# Release Management

**Version:** 1.0  
**Status:** Canonical Operations Specification

## Purpose

Defines how Pathfinder Release 1 is planned, approved, versioned, released, and verified while preserving the Version 2 Design Freeze.

## Principles

- Releases are predictable and reversible.
- `main` always represents releasable code.
- Documentation is synchronized with implementation.
- Release decisions are evidence-based.
- Deterministic routing is a non-negotiable release invariant.

## Release Types

| Type | Purpose |
|---|---|
| Major | Architectural or product milestone |
| Minor | Backward-compatible capability additions |
| Patch | Defect corrections without scope expansion |
| Emergency | Critical production correction |

## Release Inputs

A release candidate shall include:

- Approved implementation
- Passing CI
- Passing acceptance tests
- Passing Golden Route Fixtures
- Passing regression and adversarial suites
- Updated canonical documentation
- Release notes

## Versioning

Application releases use Semantic Versioning.

Documentation versions remain independent and are maintained within each canonical document.

## Approval Checklist

Before release approval:

- Product verifies Release 1 scope.
- Engineering verifies build health.
- Architecture verifies ADR compliance.
- Testing verifies all release gates.
- Security verifies critical findings are resolved.
- Documentation is synchronized.

## Release Record

Each release records:

- Release version
- Build identifier
- Commit reference
- Engine version
- Rule-set version
- Schema version
- Migration version
- Release date
- Approvers
- Known limitations

## Release Gates

Release is blocked if:

- Any critical defect remains.
- Route determinism cannot be demonstrated.
- Proposed Facts affect routing.
- AI alters sequencing.
- Cross-user isolation fails.
- Documentation is inconsistent.

## Post-Release Verification

Verify:

1. Service health
2. Authentication
3. Route generation
4. Reroute generation
5. Monitoring and alerts
6. Seeded demonstration scenario execution

## Hotfix Policy

Hotfixes:

- Address production-critical issues only.
- Minimize change scope.
- Require regression execution proportional to risk.
- Must be merged back into `main`.

## Communication

Each release includes:

- Release summary
- User-visible changes
- Fixed defects
- Known issues
- Rollback reference

## Traceability

Supports:

- deployment-strategy.md
- branching-strategy.md
- acceptance-test-specification.md
- regression-test-catalog.md
- definition-of-done.md

## Definition of Done

Release management is complete when every Pathfinder release follows a documented approval, verification, communication, and rollback process that preserves the Route-first architecture and Version 2 Design Freeze.
