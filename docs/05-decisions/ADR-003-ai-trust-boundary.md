
# ADR-003 — AI Trust Boundary

**ADR:** 003  
**Status:** Accepted  
**Date:** 2026-07-10

## Context

Pathfinder uses AI to improve usability through document interpretation and plain-language explanations. During the Version 2 Design Freeze, a key architectural decision was whether AI should influence routing decisions.

Allowing probabilistic model output to determine sequencing would weaken reproducibility, explainability, testing, and user trust.

## Decision

Artificial intelligence is constrained to **interpretation and explanation**.

AI may:

- Extract candidate facts from supported documents.
- Normalize free-form user input.
- Summarize information.
- Generate plain-language explanations from deterministic reason codes.
- Identify ambiguity requiring user confirmation.

AI shall not:

- Confirm Facts.
- Publish GraphVersions.
- Publish Route Versions.
- Determine eligibility.
- Select the Focus Action.
- Prioritize or sequence Actions.
- Modify Provenance.
- Override verified Rules.

All AI output is treated as **untrusted input** until validated.

## Decision Drivers

- User trust
- Deterministic behavior
- Explainability
- Auditability
- Security
- Privacy
- Testability

## Alternatives Considered

### AI-directed routing

Rejected because model behavior is probabilistic and not guaranteed to be reproducible.

### AI-confirmed facts

Rejected because trust requires explicit confirmation or approved deterministic workflows.

### AI-generated graph structure

Rejected because graph publication must be deterministic, versioned, and auditable.

## Consequences

### Positive

- Preserves deterministic routing.
- Prevents AI from silently changing Route behavior.
- Simplifies testing and regression validation.
- Supports explainable trust boundaries.

### Trade-offs

- Additional validation logic.
- Reduced flexibility for unconstrained AI automation.
- More explicit engineering around confirmation workflows.

## Architectural Requirements

Implementation shall ensure:

- AI output enters as candidate data only.
- Schema, business-rule, and security validation occur before persistence.
- Prompt injection is treated as untrusted content.
- Deterministic explanation templates exist as a fallback.
- AI outages do not prevent Route generation from existing Confirmed Facts.

## Validation

The implementation shall demonstrate:

1. AI cannot alter Route sequencing.
2. AI cannot activate Proposed Facts.
3. Prompt injection attempts are neutralized.
4. Deterministic routing continues when AI services are unavailable.
5. AI-generated explanations never invent facts or reason codes.

## Cross References

- ai-boundaries.md
- route-engine.md
- dependency-graph.md
- provenance.md
- system-overview.md
- prd.md

## Decision Outcome

**Accepted**

Changes to this trust boundary require a superseding ADR. User-visible changes to AI behavior additionally require an approved Product Decision.
