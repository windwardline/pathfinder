
# Pathfinder Privacy & Security Specification

**Version:** 1.0  
**Status:** Canonical Risk & Governance Document

## Purpose

Defines the privacy and security requirements for Pathfinder Release 1.

## Security Principles

- Users own their data.
- Only Confirmed Facts affect routing.
- Every route-affecting fact has provenance.
- Least privilege applies throughout the system.
- AI output is untrusted until validated.
- Security controls must not change Route behavior.

## Privacy Principles

- Collect only data needed for Route generation.
- Minimize retention of sensitive information.
- Support export and approved deletion.
- Require explicit user-controlled sharing.
- Protect provenance while minimizing personal data.

## Threat Model

| Threat | Control | Verification | Reference |
|---|---|---|---|
| Cross-user access | Authentication and authorization | Security tests | system-overview.md |
| Prompt injection | Validation pipeline | Adversarial tests | ai-boundaries.md |
| Hallucinated facts | Confirmation workflow | Integration tests | domain-model.md |
| Tampered provenance | Integrity validation | Audit tests | provenance.md |
| Routing regression | Golden fixtures | Regression tests | route-engine.md |

## Release 1 Requirements

- User ownership enforcement
- Immutable Route Versions
- Provenance for all route-affecting facts
- Deterministic routing independent of AI
- Security event logging with minimal exposure

## Acceptance Criteria

1. Cross-user access tests pass.
2. Prompt injection defenses pass.
3. Routing remains deterministic if AI is unavailable.
4. Provenance remains intact.
5. Privacy controls satisfy Release 1 requirements.

## Definition of Done

Privacy, security, and trust controls are implemented and validated without changing the Route-first architecture.
