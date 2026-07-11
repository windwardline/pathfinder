
# Backup & Recovery

**Version:** 1.0
**Status:** Canonical Operations Specification

## Purpose

This specification defines the backup, restore, disaster recovery, and recovery verification requirements for Pathfinder Release 1.

The objective is to preserve user trust, Route reproducibility, Provenance integrity, and operational continuity while respecting approved retention and deletion policies.

## Principles

- Backups support recovery, not long-term data retention.
- Recovery must preserve immutable history.
- Recovery must not violate user deletion or ownership boundaries.
- Restore procedures are tested regularly.
- Recovery correctness takes precedence over recovery speed.

## Recovery Objectives

### Recovery Time Objective (RTO)

The acceptable time to restore critical Route generation services shall be defined before production deployment and validated through recovery exercises.

### Recovery Point Objective (RPO)

The maximum acceptable data loss window shall be defined before production deployment and validated against the backup schedule.

## Protected Assets

Backups shall include, as appropriate:

- Application databases
- Route Versions
- GraphVersions
- Provenance metadata
- Configuration
- Infrastructure definitions
- Secrets managed through approved secret-management systems
- Audit records required for recovery

Backups shall not become an alternative system of record.

## Backup Policy

Backups must be:

- encrypted
- integrity verified
- access controlled
- versioned
- monitored
- documented

Backup frequency and retention are environment-specific operational policies.

## Restore Procedure

A restore must:

1. Verify backup integrity.
2. Restore infrastructure dependencies.
3. Restore application data.
4. Validate schema compatibility.
5. Verify ownership boundaries.
6. Verify Route determinism.
7. Verify Provenance integrity.
8. Verify monitoring and alerts.

## Disaster Recovery

Disaster recovery plans shall cover:

- infrastructure loss
- database corruption
- region or availability-zone outage
- configuration corruption
- deployment failure
- credential compromise

Recovery procedures must be documented and rehearsed.

## Deletion Propagation

Approved deletion requests must propagate to backups according to documented operational policy.

Recovered environments shall not permanently resurrect deleted user data.

## Recovery Validation

Every recovery exercise must verify:

- Authentication
- Authorization
- Route generation
- Reroute generation
- Golden Route Fixtures
- Seeded Demonstration Scenarios
- Acceptance tests appropriate to the recovery scope

## Security

- Backup media is encrypted.
- Access follows least privilege.
- Administrative actions are audited.
- Recovery credentials are protected separately from application credentials.

## Operational Testing

Perform scheduled recovery exercises that include:

- Full restore
- Partial restore
- Backup integrity verification
- Recovery from failed deployment
- Recovery after schema migration
- Deletion propagation verification

## Failure Conditions

Recovery is considered unsuccessful if:

- Route determinism changes.
- Published Route Versions are altered.
- Provenance integrity fails.
- Cross-user ownership boundaries are violated.
- Required operational services remain unavailable.

## Traceability

Supports:

- deployment-strategy.md
- release-management.md
- monitoring-observability.md
- incident-response.md
- data-lifecycle.md
- privacy-security-specification.md
- regression-test-catalog.md
- ADR-002
- ADR-004

## Definition of Done

The backup and recovery strategy is complete when Pathfinder can reliably back up, restore, validate, and recover Release 1 without compromising Route determinism, Provenance integrity, immutable history, user ownership, or approved deletion behavior.
