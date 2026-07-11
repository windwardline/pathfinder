
# Operational Runbook

**Version:** 1.0
**Status:** Canonical Operations Specification

## Purpose

This runbook defines the routine operational procedures for Pathfinder Release 1. It provides the standard operating guidance for deployment verification, production health, incident triage, maintenance, rollback, recovery, and operational validation while preserving the Version 2 Design Freeze.

## Operating Principles

- Protect users before restoring features.
- Preserve Route determinism and the Confirmed Fact trust boundary.
- Follow documented procedures rather than ad hoc actions.
- Record operational actions that affect production.
- Escalate uncertainty rather than improvising architectural changes.

## Daily Operations

Operators should verify:

- Service health
- Authentication and authorization
- Route generation
- Reroute generation
- Monitoring dashboards
- Backup status
- Scheduled jobs
- Alert queues

## Deployment Checklist

Before deployment:

1. Confirm approved release.
2. Verify CI and release gates.
3. Confirm migration readiness.
4. Notify stakeholders when required.

After deployment:

1. Verify health endpoints.
2. Execute seeded demonstration scenarios.
3. Confirm Route generation.
4. Confirm Reroute generation.
5. Review dashboards and alerts.
6. Record deployment outcome.

## Routine Maintenance

- Review operational alerts.
- Verify backup completion.
- Review audit logs.
- Verify scheduled recovery tests.
- Remove expired operational credentials in accordance with policy.
- Confirm documentation remains current.

## Incident Triage

1. Identify severity.
2. Determine user impact.
3. Contain if necessary.
4. Preserve evidence.
5. Escalate according to the Incident Response specification.
6. Verify recovery before closure.

## Rollback Procedure

Rollback only after confirming:

- Release impact
- Recovery path
- Migration compatibility

After rollback:

- Verify Route determinism.
- Verify immutable Route Versions remain intact.
- Verify Provenance integrity.
- Verify monitoring health.

## Recovery Checklist

Following restoration:

- Validate ownership boundaries.
- Validate authentication.
- Validate Route generation.
- Execute Golden Route Fixtures appropriate to the recovery scope.
- Execute acceptance verification.
- Review operational logs.

## Scheduled Operational Reviews

Review regularly:

- Open incidents
- Release cadence
- Monitoring effectiveness
- Backup success
- Recovery exercise results
- Documentation consistency

## Escalation

Immediately escalate:

- Cross-user data exposure
- Route non-determinism
- Provenance integrity failures
- AI trust-boundary violations
- Published Route corruption

## Operational Records

Maintain records for:

- Deployments
- Rollbacks
- Recovery exercises
- Incidents
- Release approvals
- Operational exceptions

## Traceability

Supports:

- deployment-strategy.md
- release-management.md
- monitoring-observability.md
- incident-response.md
- backup-recovery.md
- testing-strategy.md
- definition-of-done.md

## Definition of Done

The operational runbook is complete when routine production operations, deployments, maintenance, incident handling, rollback, recovery, and verification can be performed consistently while preserving Route determinism, Provenance integrity, user ownership, and the Version 2 Design Freeze.
