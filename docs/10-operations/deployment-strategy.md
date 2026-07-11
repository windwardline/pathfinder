
# Deployment Strategy

**Version:** 1.0
**Status:** Canonical Operations Specification

## Purpose

This document defines how Pathfinder Release 1 is deployed, promoted, verified, and rolled back while preserving deterministic behavior and the Version 2 Design Freeze.

## Principles

- Deploy small, reversible changes.
- `main` is always releasable.
- Infrastructure changes are version controlled.
- Deployments must never bypass automated quality gates.
- Route determinism takes precedence over deployment speed.

## Environments

| Environment | Purpose |
|---|---|
| Local | Developer implementation |
| Development | Shared integration |
| Test | Automated validation |
| Staging | Release candidate verification |
| Production | User-facing environment |

Configuration differences must be externalized; application behavior must remain consistent.

## Deployment Pipeline

1. Build
2. Static analysis
3. Unit tests
4. Integration tests
5. Golden Route Fixtures
6. Regression tests
7. Adversarial tests
8. Package artifacts
9. Deploy to Staging
10. Acceptance validation
11. Production approval
12. Production deployment
13. Post-deployment verification

## Release Gates

Deployment to Production requires:

- All CI checks pass.
- Acceptance tests pass.
- Golden Route Fixtures pass.
- No unresolved critical defects.
- Documentation synchronized.
- Approved release record.

## Rollback Strategy

Rollback must:

- Restore the previous application version.
- Preserve immutable Route Versions and GraphVersions.
- Prevent partial schema rollback without a migration plan.
- Verify service health after rollback.

## Database Changes

- Forward migrations are required.
- Recovery or rollback procedures must be documented.
- Breaking schema changes require an ADR.
- Migrations affecting routing require regression execution.

## Secrets and Configuration

- Store secrets outside source control.
- Rotate credentials regularly.
- Use least privilege.
- Audit administrative access.

## Monitoring

Monitor:

- Deployment success
- Route generation latency
- Reroute latency
- Error rates
- Authentication failures
- Cross-user authorization failures
- Failed Route publications

## Incident Response

Critical incidents include:

- Cross-user data exposure
- Non-deterministic routing
- Published Route corruption
- Provenance integrity failure
- AI trust-boundary violation

Critical incidents pause production releases until resolved.

## Operational Verification

After deployment verify:

- Health endpoints
- Authentication
- Route generation
- Reroute generation
- Golden seeded scenario execution
- Logging and monitoring

## Traceability

Supports:

- branching-strategy.md
- testing-strategy.md
- definition-of-done.md
- acceptance-test-specification.md
- regression-test-catalog.md
- ADR-001 through ADR-005

## Definition of Done

The deployment strategy is complete when every release follows a repeatable, automated, reversible process that preserves Route determinism, trust boundaries, and operational stability.
