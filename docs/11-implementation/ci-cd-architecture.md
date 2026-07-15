
# CI/CD Architecture

**Version:** 1.0  
**Status:** Canonical Implementation Specification

## Purpose

This document defines the Continuous Integration and Continuous Delivery architecture for Pathfinder Release 1. It establishes how code, documentation, infrastructure, database changes, and release artifacts are validated, promoted, deployed, verified, and rolled back.

The CI/CD system must enforce the Version 2 Design Freeze rather than merely automate builds.

## Principles

- `main` is always releasable.
- Every change is validated before merge.
- Build artifacts are immutable.
- The same reviewed commit and lockfile are used across environments; Vercel
  rebuilds each deployment and Release 1 does not claim byte-identical promotion.
- Deterministic Route behavior is a release gate.
- Database and infrastructure changes are version controlled.
- Deployment is automated, observable, and reversible.
- Documentation consistency is part of delivery quality.

## Pipeline Overview

```text
Pull Request
    ↓
Source Validation
    ↓
Build
    ↓
Static Analysis
    ↓
Unit Tests
    ↓
Integration Tests
    ↓
Golden Route Fixtures
    ↓
Regression Tests
    ↓
Adversarial & Security Tests
    ↓
Artifact Packaging
    ↓
Staging Deployment
    ↓
Acceptance Validation
    ↓
Production Approval
    ↓
Production Deployment
    ↓
Post-Deployment Verification
```

## Source Validation

Every pull request must validate:

- Branch naming
- Commit metadata where required
- Formatting
- Linting
- Type checking
- Documentation syntax
- Broken cross-references where tooling permits
- Secret scanning
- Dependency policy

## Build Stage

The build stage must:

- use pinned dependencies
- produce reproducible artifacts
- record build metadata
- fail on warnings defined as errors
- avoid environment-specific business logic
- generate checksums for release artifacts

Required build metadata:

- commit SHA
- build identifier
- application version
- engine version
- rule-set version
- schema version
- build timestamp

## Static Analysis

Required analysis includes:

- type checking
- linting
- dependency vulnerability scanning
- secret scanning
- infrastructure configuration scanning
- code-quality checks
- license-policy checks where applicable

Critical findings block merge and release.

Release 1 uses the pinned Google OSV-Scanner reusable workflow to scan
`pnpm-lock.yaml` on pull requests, pushes to `main`, scheduled security runs,
and manual runs. The scanner fails on any known vulnerability. This lockfile
gate replaces the retired npm audit endpoint while preserving transitive
dependency coverage.

## Test Stages

### Unit Tests

Run on every pull request.

### Integration Tests

Run on every pull request affecting APIs, persistence, routing, or shared contracts.

### Golden Route Fixtures

Run on every pull request that could affect:

- Route Engine
- Facts
- Provenance
- Dependency Graph
- Rules
- data schema
- API contracts
- explanation reason codes

### Regression Tests

Run before merge and before release candidates.

### Adversarial Tests

Run on changes affecting:

- AI services
- APIs
- authentication
- authorization
- persistence
- routing
- document processing
- external input validation

### Acceptance Tests

Run in Staging against the release candidate.

## Documentation Validation

CI should verify:

- required front matter or metadata
- canonical filenames
- valid internal references where tooling supports it
- no forbidden terminology substitutions
- no duplicate canonical definitions
- ADR numbering integrity
- Product Decision references where required

Terminology checks should flag, not silently rewrite, content.

## Artifact Packaging

Release artifacts must be:

- immutable
- versioned
- checksummed
- traceable to source
- stored in an approved registry
- traceable to the exact reviewed commit and lockfile

Artifacts may include:

- application images or packages
- migration bundles
- infrastructure plans
- static frontend assets
- documentation bundles
- test reports

## Environment Promotion

Release 1 delivery flow:

```text
Pull request → GitHub Actions → Vercel Preview → protected merge → Vercel Production
```

Progression requires:

- successful prior stage
- approved commit
- environment configuration validation
- migration readiness
- no unresolved release-blocking defects

## Staging Validation

Vercel Preview is the Release 1 staging boundary. It must approximate Production behavior closely enough to validate:

- deployment
- migrations
- authentication
- Route generation
- Reroute
- AI fallback behavior
- observability
- seeded scenarios
- rollback readiness

## Production Approval

Production deployment requires a protected merge with:

- Release Manager approval
- Product confirmation of scope
- Engineering confirmation of build health
- Architecture confirmation for ADR-sensitive changes
- Security confirmation for high-risk changes
- acceptance test completion
- release record creation

## Database Migration Pipeline

Database changes require:

- versioned migration files
- forward migration
- rollback or recovery plan
- schema compatibility review
- fixture compatibility review
- migration test in Staging
- post-migration integrity validation

Routing-affecting schema changes require Golden Route and deterministic replay tests.

## Infrastructure Pipeline

Infrastructure changes require:

- plan generation
- reviewable diff
- policy validation
- secret exposure checks
- environment-specific approval
- drift detection where practical
- post-apply verification

Manual production changes outside the pipeline are prohibited except documented emergency procedures.

## Security Gates

Release-blocking conditions include:

- exposed secrets
- critical dependency vulnerability
- cross-user authorization failure
- prompt-injection defense failure
- Provenance integrity failure
- public data-store exposure
- unauthorized privilege escalation
- unsafe infrastructure policy

## Determinism Gates

The pipeline must block release if:

- identical Routing Snapshots produce different Routes
- Focus Action changes unexpectedly
- reason codes change without approval
- Proposed Facts affect Route output
- Route replay fails
- GraphVersion derivation changes unexpectedly
- AI availability changes sequence

## Deployment Strategies

Supported strategies may include:

- rolling deployment
- blue/green deployment
- canary deployment

Release 1 should use the simplest strategy that provides safe rollback and operational visibility.

The selected strategy must not allow simultaneous incompatible schema and application versions without an explicit compatibility plan.

## Feature Flags

Feature flags may support:

- controlled rollout
- safe disablement
- staged testing
- operational fallback

Feature flags must not:

- create competing routing behavior
- silently change protected product semantics
- bypass Product Decisions or ADRs
- remain permanently undocumented

## Rollback

Rollback must be tested and documented.

Rollback requirements:

- identify the last known-good artifact
- preserve immutable Route Versions and GraphVersions
- handle schema compatibility safely
- restore service health
- verify deterministic Route behavior
- record the rollback event
- trigger incident review when appropriate

## Post-Deployment Verification

After deployment, verify:

1. Service health
2. Authentication
3. Authorization
4. Current Route retrieval
5. Route generation
6. Reroute generation
7. Provenance access
8. AI fallback
9. Monitoring and alerts
10. Seeded Demonstration Scenario
11. No unexpected Route regression

## Release Evidence

The pipeline should preserve:

- test reports
- Golden Route Fixture results
- acceptance test results
- security scan results
- artifact checksums
- migration results
- infrastructure plan and apply results
- approver record
- deployment logs
- post-deployment verification results

## Failure Handling

### Build Failure

- Stop pipeline.
- Publish diagnostics.
- Do not package artifacts.

### Test Failure

- Stop promotion.
- Preserve test evidence.
- Require remediation or governed expected-output change.

### Migration Failure

- Stop deployment.
- Execute recovery plan.
- Preserve previous valid application and data state.

### Deployment Failure

- Halt rollout.
- Roll back or contain.
- verify service health before resuming.

### Post-Deployment Verification Failure

- Treat as release incident.
- Roll back when trust or correctness is affected.
- Preserve evidence for review.

## Observability

CI/CD telemetry should include:

- build duration
- failure rate
- test duration
- flaky test rate
- deployment duration
- rollback frequency
- change failure rate
- mean time to recovery
- artifact promotion history
- approval latency

## Access Control

- Pipeline permissions follow least privilege.
- Production deployment rights are restricted.
- Secret access is audited.
- Approval roles are separated where practical.
- Service accounts use short-lived credentials when possible.

## Non-Goals

Release 1 CI/CD does not require:

- multi-region deployment orchestration
- fully autonomous production release
- unrestricted self-service production access
- parallel incompatible Route Engine versions
- custom-built CI infrastructure

## Testing the Pipeline

Required tests include:

- pipeline configuration validation
- failed-build handling
- failed-test handling
- migration failure recovery
- rollback execution
- secret-scanning validation
- artifact integrity validation
- staging acceptance run
- post-deployment verification failure
- production approval enforcement

## Acceptance Criteria

The CI/CD architecture is complete when:

1. Every pull request runs required quality checks.
2. Golden Route Fixtures and regression suites are enforced.
3. Security and adversarial gates are automated.
4. Every deployment reports the exact commit and release identity; rebuilds use the locked dependency graph.
5. Vercel Preview validation precedes protected merge and Production.
6. Database and infrastructure changes are version controlled.
7. Production requires the repository's protected pull-request approval and checks.
8. Rollback is documented and tested.
9. Post-deployment verification includes Route and Reroute behavior.
10. Release evidence is retained.
11. Pipeline permissions follow least privilege.
12. Documentation validation is integrated.
13. Determinism failures block release.

## Traceability

Supports:

- implementation-roadmap.md
- repository-bootstrap.md
- branching-strategy.md
- testing-strategy.md
- acceptance-test-specification.md
- golden-route-fixtures.md
- regression-test-catalog.md
- adversarial-test-catalog.md
- deployment-strategy.md
- release-management.md
- monitoring-observability.md
- infrastructure-architecture.md
- backend-architecture.md
- frontend-architecture.md
- ai-services-architecture.md
- ADR-001 through ADR-006 and applicable Product Decisions

## Definition of Done

The CI/CD architecture is complete when Pathfinder changes can be validated, packaged, promoted, deployed, verified, and rolled back through a secure, automated, traceable pipeline that enforces Route determinism, trust boundaries, documentation consistency, user isolation, and the Version 2 Design Freeze.
