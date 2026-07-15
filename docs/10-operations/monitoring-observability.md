
# Monitoring & Observability

**Version:** 1.0
**Status:** Canonical Operations Specification

## Purpose

This specification defines how Pathfinder Release 1 is monitored in production to verify health, determinism, reliability, privacy, and security without exposing sensitive user information.

## Observability Principles

- Observe product behavior, not user behavior.
- Structured telemetry over free-form logs.
- Protect user privacy through data minimization.
- Detect trust-boundary violations early.
- Every production issue should be diagnosable from telemetry.

## Telemetry Pillars

### Metrics

Capture:

- Route generation count
- Route generation latency
- Reroute latency
- Graph build latency
- Fact confirmation rate
- Failed confirmations
- Authentication success/failure
- Authorization failures
- API error rates
- Background job success/failure

### Structured Logging

Every log entry should include:

- timestamp
- correlation_id
- request_id
- service
- operation
- severity
- outcome

Never log raw sensitive document content, secrets, or unnecessary personal data.

### Tracing

Distributed tracing should cover:

- Fact confirmation
- Graph generation
- Route generation
- Reroute generation
- Explanation generation
- API request lifecycle

## Health Checks

Services expose health endpoints verifying:

- application availability
- database connectivity
- dependency availability
- configuration validity
- Route Engine readiness

Health checks must not expose sensitive internals.

## Alerts

Critical alerts:

- Route generation failures
- Non-deterministic routing detection
- Cross-user authorization failure
- Provenance integrity failure
- Route publication failure
- Graph publication failure
- Backup failure
- Excessive API error rate

## Dashboards

Recommended dashboards:

- Application health
- Route Engine
- API performance
- Security events
- Background processing
- Release health

## Privacy

Telemetry must:

- minimize identifiers
- redact sensitive values
- respect retention policy
- support audit investigations without unnecessary personal data

## Incident Correlation

All operational events should support correlation through request and correlation identifiers.

## Operational Verification

Following deployment verify:

1. Health endpoints
2. Metrics ingestion
3. Alert delivery
4. Route generation
5. Reroute generation
6. Seeded demonstration scenario

## Automated Release 1 Health Verification

`.github/workflows/production-health.yml` calls the public health endpoint four
times per hour and can also be run manually. The verifier fails unless the
application, database, configuration, and Route Engine checks are all ready.

`scripts/verify_production_health.mjs` emits one structured, privacy-safe JSON
event containing only operational status, latency, versions, and the endpoint's
correlation identifier. It does not send user identifiers, Fact values, Route
content, or document content.

The workflow failure is the automation boundary. Notification services such as
Zapier may subscribe to failed workflow runs, but must not receive Pathfinder
user data or production credentials.

`apps/web/src/lib/telemetry.ts` emits an enumerated JSON contract for Route
generation, Fact mutation, Action completion, and magic-link delivery. The
contract accepts operational categories and timings only; it has no fields for
user identifiers, email addresses, Fact values, Route content, or documents.
Inbound correlation headers are accepted only when they are opaque UUIDs.

`.github/workflows/production-alert.yml` converts a failed Production health or
Recovery drill run into a labeled GitHub issue, updating the existing open
alert instead of creating notification noise. The issue contains only the
workflow name, commit, run link, and detection time. Zapier may subscribe to
the `production-alert` label when an additional delivery channel is useful.

## Traceability

Supports:

- deployment-strategy.md
- release-management.md
- privacy-security-specification.md
- testing-strategy.md
- ADR-002
- ADR-003
- ADR-004

## Definition of Done

Monitoring and observability are complete when production health, Route determinism, trust boundaries, and operational reliability can be verified through structured metrics, logs, traces, dashboards, and alerts without compromising user privacy.
