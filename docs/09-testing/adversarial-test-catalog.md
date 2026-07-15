
# Adversarial Test Catalog

**Version:** 1.0
**Status:** Canonical Testing Specification

## Purpose

This catalog defines the adversarial test suites used to verify Pathfinder's resilience against malformed, hostile, unexpected, and unauthorized inputs while preserving the Route-first architecture and Confirmed Fact trust model.

## Principles

- Test trust boundaries, not only happy paths.
- Treat all external input as untrusted.
- Preserve deterministic routing under attack.
- Fail safely without corrupting Route, GraphVersion, or Provenance.
- Adversarial failures block release when they affect trust, security, or determinism.

## Adversarial Test Suites

| ID | Category | Primary Objective |
|---|---|---|
| ATC-001 | Prompt Injection | Prevent AI instructions from altering routing |
| ATC-002 | Hallucinated Facts | Reject unconfirmed AI-generated facts |
| ATC-003 | Cross-User Access | Enforce strict ownership isolation |
| ATC-004 | Provenance Integrity | Detect tampering and broken evidence chains |
| ATC-005 | Invalid State Transitions | Reject illegal Fact lifecycle changes |
| ATC-006 | Graph Integrity | Reject cycles and invalid relationships |
| ATC-007 | Route Integrity | Prevent partial or inconsistent publication |
| ATC-008 | API Abuse | Validate malformed, oversized, and replayed requests |
| ATC-009 | Concurrency | Preserve consistency during competing updates |
| ATC-010 | Authorization | Prevent privilege escalation |

## Required Attack Scenarios

### AI Trust Boundary
- Prompt injection
- Instruction smuggling
- Hallucinated citations
- AI-generated priority values
- AI attempts to publish Route content

### Data Integrity
- Modified integrity hashes
- Broken Provenance references
- Invalid Rule identifiers
- Missing required Provenance
- Corrupted snapshot hashes

### Routing Integrity
- Proposed Facts submitted as routing inputs
- Duplicate Focus Actions
- Non-deterministic ordering attempts
- Invalid Route Difference payloads
- Stale Route Version updates

### Graph Integrity
- Hard dependency cycles
- Invalid edge types
- Cross-user node references
- Orphaned nodes
- Incompatible relationship types

### API Misuse
- Invalid schemas
- Replay attacks
- Idempotency conflicts
- Oversized payloads
- Unsupported enum values

### Authorization
- Horizontal privilege escalation
- Unauthorized export requests
- Unauthorized deletion requests
- Cross-user Provenance lookup
- Cross-user Route retrieval

## Expected Behavior

Every adversarial test shall verify that Pathfinder:

- Rejects the request safely.
- Preserves immutable published artifacts.
- Does not leak sensitive information.
- Produces structured error responses.
- Records an audit event when appropriate.
- Continues deterministic routing for valid requests.

## Release-Critical Failures

The following failures block Release 1:

- AI alters Route sequencing.
- Proposed Facts influence routing.
- Cross-user data exposure.
- Published Route corruption.
- Published GraphVersion corruption.
- Provenance integrity failure.
- Unauthorized privilege escalation.
- Deterministic replay failure.

## Continuous Integration

The adversarial suite executes:

- On every pull request affecting routing, APIs, security, or persistence.
- Before release candidates.
- After security-sensitive dependency updates.

## Automated Evidence Map

| ID | Automated evidence |
|---|---|
| ATC-001 | `apps/web/tests/ai-boundary.test.ts` prompt-injection wrapping |
| ATC-002 | AI candidate schema plus Proposed-only API persistence and browser confirmation boundary |
| ATC-003 | Cross-user Fact, Provenance, Route, and export integration tests |
| ATC-004 | Provenance tamper detection integration test |
| ATC-005 | Lifecycle validation and concurrent transition integration tests |
| ATC-006 | Cycle, dangling edge, duplicate id, and relationship tests in `RouteEngine.test.ts` |
| ATC-007 | Atomic Reroute publication and corrupted GraphVersion fallback integration test |
| ATC-008 | Schema, oversized input, idempotency replay, and conflicting-key tests |
| ATC-009 | Competing confirmation/rejection and per-user publication-lock tests |
| ATC-010 | Unauthenticated route handlers plus cross-user and export/deletion authorization tests |

## Governance

Expected behavior changes require:
1. Updated adversarial tests.
2. Documentation updates.
3. Product Decision (user-visible behavior).
4. ADR (architectural behavior).

## Traceability

Supports:
- testing-strategy.md
- privacy-security-specification.md
- safety.md
- facts-api.md
- provenance-api.md
- reroute-api.md
- ADR-002
- ADR-003
- ADR-004

## Definition of Done

The adversarial catalog is complete when Pathfinder's trust boundaries, routing engine, APIs, persistence layer, and ownership model are protected by repeatable automated tests that demonstrate secure, deterministic behavior under hostile conditions.
