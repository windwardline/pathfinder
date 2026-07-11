
# Pathfinder Safety Specification

**Version:** 1.0  
**Status:** Canonical Risk Document

## Purpose

This specification defines the product safety requirements for Pathfinder Release 1. It complements the PRD, AI Boundaries, Route Engine, and Privacy & Security specifications by describing how Pathfinder behaves safely under normal, unexpected, and adversarial conditions.

## Safety Principles

- Preserve user autonomy.
- Never replace professional legal, medical, or emergency advice.
- Explain decisions rather than conceal them.
- Fail safely rather than fabricate certainty.
- Protect trust through deterministic behavior.
- Keep the user in control of route-affecting decisions.

## Supported Use

Release 1 supports:

- Building a Route from Confirmed Facts.
- Explaining why an Action comes next.
- Meaningful Reroute after confirmed change.
- User-controlled planning for reentry.

## Unsupported Use

Pathfinder must not:

- Provide legal determinations.
- Diagnose medical or behavioral conditions.
- Predict recidivism.
- Assign personal-risk scores.
- Make parole or supervision decisions.
- Replace case managers, attorneys, or clinicians.

## Safe Failure Behavior

When required information is unavailable:

- Do not invent facts.
- Preserve the last valid Route.
- Explain missing information.
- Request confirmation where appropriate.
- Use deterministic explanation templates if AI is unavailable.

## High-Risk Scenarios

| Scenario | Required Response |
|---|---|
| Missing provenance | Prevent route-affecting activation |
| Proposed Fact submitted as confirmed | Require confirmation |
| Route Engine failure | Preserve last valid Route |
| Prompt injection | Reject malicious instructions |
| Conflicting obligations | Present conflict and reroute deterministically |

## Human Oversight

Users remain responsible for confirming facts.

Professionals may assist users, but Release 1 does not support hidden organizational control of Routes.

## Abuse & Misuse Cases

- Attempting to inject false facts
- Attempting cross-user data access
- Using AI output as authoritative evidence
- Manipulating explanations to change sequencing
- Circumventing confirmation workflows

Each case must be detected or mitigated through validation, authorization, and deterministic routing.

## Safety Testing

Required testing includes:

- Failure-state testing
- Prompt injection testing
- Hallucination resistance
- Deterministic routing verification
- User-isolation testing
- Explanation fallback testing

## Acceptance Criteria

Release 1 safety is achieved when:

1. AI cannot override routing.
2. Unsupported advice is never presented as authoritative.
3. Failed components degrade safely.
4. Route trust boundaries remain intact.
5. Safety regression tests pass.

## Traceability

Supports:

- ai-boundaries.md
- route-engine.md
- provenance.md
- privacy-security-specification.md
- risk-register.md

## Definition of Done

This specification is complete when all documented safety behaviors are implemented, tested, and verified without compromising the Route-first architecture or the Confirmed Fact trust boundary.
