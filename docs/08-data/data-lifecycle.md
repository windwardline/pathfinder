
# Pathfinder Data Lifecycle Specification

**Version:** 1.0  
**Status:** Canonical Data Specification

## Purpose

This document defines the lifecycle of Pathfinder data from creation through retention, export, supersession, archival, deletion, anonymization, backup, and recovery.

The objective is to preserve the trust, auditability, and reproducibility required by the Route-first architecture while minimizing unnecessary retention of sensitive information.

## Lifecycle Principles

- Collect only what is required to build, explain, and update a Route.
- Preserve immutable historical records only when necessary for Route reproducibility, auditability, safety, or approved operational needs.
- Distinguish deletion of user content from deletion of minimum audit metadata.
- Avoid retaining raw documents when structured Provenance is sufficient.
- Make export and deletion user-controlled.
- Never silently rewrite historical Route Versions.

## Data Classes

### Class A — Core Account Data

Examples:

- user identifier
- locale
- time zone
- account status

Retention:

- retained while the account is active
- deleted or anonymized through approved account-deletion workflow

### Class B — Route-Affecting Structured Data

Examples:

- Confirmed Facts
- Goals
- Actions
- Requirements
- Obligations
- Constraints
- Deadlines
- Blockers
- Dependencies

Retention:

- retained while required for active Route generation
- historical versions retained only as needed for Route replay and auditability
- superseded state remains traceable

### Class C — Provenance Metadata

Examples:

- source type
- source reference
- page or section reference
- integrity hash
- Rule identifier

Retention:

- preserved for published Route Versions that depend on it
- minimized to the smallest evidence record necessary

### Class D — Raw Documents

Examples:

- job offer
- housing denial
- supervision schedule
- identification instructions

Retention:

- minimized by default
- retained only when needed for confirmation, user review, or approved traceability
- eligible for deletion after structured facts and Provenance are established, subject to policy

### Class E — Published Version History

Examples:

- Plan Versions
- GraphVersions
- Route Versions
- Reroute Events
- Explanation reason codes

Retention:

- immutable while retained
- preserved to support Route history, auditability, and deterministic replay
- personal data minimized within snapshots

### Class F — Operational and Security Logs

Examples:

- authentication events
- authorization failures
- Route publication events
- cross-user access attempts
- model failures

Retention:

- limited by operational policy
- sensitive values redacted
- retained longer only where justified by security needs

## Data Creation

Data creation must:

- assign ownership
- assign creation timestamp
- validate schema
- validate source and Provenance where applicable
- record actor or system origin
- avoid unnecessary sensitive duplication

## Fact Supersession

Facts are superseded rather than overwritten.

Supersession must preserve:

- prior Fact value
- prior Provenance
- superseding Fact reference
- confirmation state
- timestamps
- historical Route references

Current routing must exclude superseded or expired Facts.

## Route History

Route History may retain:

- Route Version metadata
- ordered Route Steps
- explanation reason codes
- Provenance references
- engine and rule-set versions
- input snapshot hash

Route History should avoid duplicating raw source documents.

## User Export

Users must be able to request an export containing:

- current Confirmed Facts
- active Goals and Actions
- current Route
- Route History
- Reroute Events
- Provenance summaries
- account data

Export requirements:

- authenticated request
- explicit confirmation
- secure delivery
- time-limited access
- audit event
- machine-readable and human-readable formats where practical

## User Deletion

Account deletion must:

1. Authenticate the user.
2. Confirm intent.
3. Identify all dependent records.
4. Apply retention exceptions.
5. Delete or anonymize unnecessary personal data.
6. Revoke active sessions and sharing.
7. Record the deletion operation.
8. Provide completion status.

## Deletion Outcomes

### Hard Delete

Appropriate when:

- data is no longer needed
- no historical Route or audit requirement depends on it
- no security retention requirement applies

### Anonymization

Appropriate when:

- aggregate analysis may continue
- identity is not required
- re-identification risk is acceptably reduced

### Minimal Retention

Appropriate when:

- integrity or security records must be preserved
- historical Route reproducibility requires limited metadata
- a legal or operational requirement applies

Minimal retention must not become indefinite retention by default.

## Raw Document Deletion

Deleting a raw document may preserve:

- document identifier
- integrity hash
- source type
- upload timestamp
- page or section references
- extraction metadata needed for historical traceability

The retained metadata must not reconstruct unnecessary sensitive content.

## Provenance After Deletion

When source content is deleted, Provenance may transition to a reduced form containing:

- source category
- integrity hash
- historical reference
- deletion status
- retention rationale

Historical explanations must remain honest about source availability.

## Backup Lifecycle

Backups must:

- be encrypted
- follow defined retention windows
- be tested through restore exercises
- prevent indefinite resurrection of deleted data
- respect deletion propagation procedures

Deletion from production must propagate to backups according to documented operational timelines.

## Recovery

Recovery procedures must preserve:

- user ownership
- Fact state
- immutable version history
- Provenance integrity
- Route and GraphVersion consistency
- deletion markers

Recovered environments must not reactivate deleted accounts or superseded Facts incorrectly.

## Retention Policy Configuration

Environment-specific policy must define:

- raw document retention
- operational log retention
- backup retention
- inactive account retention
- export package expiration
- deletion propagation windows

Production deployment is blocked until these values are approved and documented.

## Data Minimization Review

Before adding a field, the owner must answer:

- Is this data required for Route creation, explanation, safety, or operation?
- Can the same outcome be achieved with less sensitive information?
- Is the value already stored elsewhere?
- What is the deletion behavior?
- What is the retention justification?
- Does the field affect user trust or surveillance risk?

## Analytics

Release 1 analytics should use:

- event categories
- non-sensitive identifiers
- aggregate counts
- operational performance data

Analytics must not create:

- recidivism scores
- personal-risk profiles
- hidden institutional monitoring
- unauthorized cross-user comparisons

## De-Identification

De-identification must:

- remove direct identifiers
- reduce indirect re-identification risk
- avoid retaining unnecessary free text
- preserve only the minimum analytical utility
- be reviewed before external sharing

## Sharing

Release 1 supports no hidden organization access.

Any future sharing must be:

- explicit
- user-approved
- revocable
- scoped
- logged
- governed by a Product Decision and ADR

## Failure Modes

### Deletion job partially fails

**Response:** Preserve deletion state, retry safely, and report incomplete status.

### Export contains unauthorized data

**Response:** Block delivery, record a security incident, and investigate.

### Backup restore resurrects deleted data

**Response:** Reapply deletion markers before environment availability.

### Provenance becomes incomplete after source deletion

**Response:** Preserve reduced Provenance and mark source availability accurately.

### Retention policy missing

**Response:** Block production deployment.

## Observability

Track:

- export requested
- export completed
- export failed
- deletion requested
- deletion completed
- deletion partially failed
- retention exception applied
- backup created
- restore test completed
- deletion propagation completed
- anonymization completed

Logs must avoid unnecessary personal data.

## Testing Requirements

### Unit Tests

- retention-policy evaluation
- deletion eligibility
- anonymization rules
- export field selection
- reduced Provenance generation

### Integration Tests

- full user export
- account deletion
- raw document deletion with Provenance preservation
- Route History retention
- backup deletion propagation
- recovery with deletion markers

### Adversarial Tests

- cross-user export request
- unauthorized deletion request
- malformed retention override
- restore of deleted account
- re-identification through analytics payload
- incomplete deletion dependency graph

## Acceptance Criteria

The data lifecycle is complete for Release 1 when:

1. Data classes have documented retention behavior.
2. User export is authenticated, secure, and auditable.
3. User deletion removes or anonymizes unnecessary personal data.
4. Published Route history remains internally consistent.
5. Provenance survives source deletion in an honest reduced form.
6. Backups follow approved retention and deletion propagation rules.
7. Recovery preserves deletion state and immutable history.
8. Analytics do not create surveillance or risk-scoring behavior.
9. Production retention values are explicitly approved.
10. Lifecycle integration and adversarial tests pass.

## Traceability

Supports:

- data-architecture.md
- data-schema-reference.md
- provenance.md
- privacy-security-specification.md
- safety.md
- risk-register.md
- facts-api.md
- provenance-api.md
- route-api.md
- reroute-api.md

## Definition of Done

The data lifecycle is complete when Pathfinder can create, retain, export, supersede, archive, delete, anonymize, back up, and recover Release 1 data without violating user control, privacy, Provenance, Route reproducibility, or the Version 2 Design Freeze.
