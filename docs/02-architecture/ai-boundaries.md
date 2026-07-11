# Pathfinder AI Boundaries Specification

**Version:** 1.0\
**Status:** Canonical Architecture Specification

## Purpose

This document defines the permitted and prohibited use of AI within
Pathfinder. It establishes trust boundaries, validation requirements,
security controls, fallback behavior, and testing expectations.

## Core Principle

AI is an assistant to the product---not the product itself.

The Route Engine is the sole authority for sequencing. AI output is
always treated as **untrusted input** until validated.

## Architectural Position

``` text
Documents / User Input
        ↓
      AI Services
        ↓
Candidate Output
        ↓
Schema Validation
        ↓
User Confirmation (when applicable)
        ↓
Confirmed Facts
        ↓
Dependency Graph
        ↓
Route Engine
```

## Permitted AI Responsibilities

AI may:

-   Extract candidate facts from supported documents.
-   Summarize user-provided information.
-   Normalize free-form text into structured candidates.
-   Generate plain-language explanations from deterministic reason
    codes.
-   Rewrite content for readability.
-   Identify ambiguity requiring user confirmation.

## Prohibited AI Responsibilities

AI must never:

-   Determine Route order.
-   Select the Focus Action.
-   Confirm Proposed Facts.
-   Modify Provenance.
-   Publish Route Versions.
-   Publish GraphVersions.
-   Override deterministic rules.
-   Invent legal conclusions or eligibility.
-   Assign personal-risk or recidivism scores.

## Trust Boundary

Every AI output enters the system as a **candidate**.

Candidate outputs must pass:

1.  Schema validation.
2.  Business-rule validation.
3.  User confirmation where required.

Only then may they influence downstream systems.

## Validation Pipeline

``` text
AI Output
    ↓
Schema Validation
    ↓
Business Rules
    ↓
Security Validation
    ↓
Confirmation Workflow
    ↓
Confirmed Fact (optional)
```

## Prompt Injection Defense

The system must ignore instructions embedded in uploaded documents that
attempt to:

-   Change routing.
-   Reveal secrets.
-   Modify policies.
-   Execute arbitrary commands.
-   Circumvent confirmation.

Documents are treated strictly as data, never as executable
instructions.

## Model Failure Handling

If AI:

-   times out,
-   returns malformed data,
-   produces unsupported values,
-   or cannot confidently parse a document,

the application must fail safely by requesting user input rather than
fabricating facts.

Routing remains available using existing Confirmed Facts.

## Explanation Generation

Plain-language explanations may be AI-assisted, but they are generated
only from deterministic inputs:

-   reason codes,
-   Provenance,
-   Route metadata.

AI may improve wording but may not alter meaning.

Deterministic templates must be available as a fallback.

## Privacy

AI services receive only the minimum information required.

Sensitive identifiers should be minimized or redacted whenever
practical.

Model prompts and responses must not become canonical records unless
explicitly preserved under documented retention policies.

## Security Requirements

-   Validate all model output.
-   Log model failures without exposing sensitive data.
-   Reject unsupported fields.
-   Reject attempts to mutate protected state.
-   Record model version for diagnostics when appropriate.

## Testing

Required tests include:

-   malformed extraction
-   hallucinated facts
-   prompt injection
-   unsupported enum values
-   missing required fields
-   explanation fallback
-   deterministic Route preservation despite AI variability

## Acceptance Criteria

Release 1 is complete when:

1.  AI cannot influence sequencing directly.
2.  Proposed Facts remain isolated until confirmed.
3.  All AI output is validated.
4.  Prompt injection attempts are neutralized.
5.  Explanation fallbacks exist.
6.  Routing remains deterministic even if AI services are unavailable.

## Traceability

References:

-   vision-lock.md
-   glossary.md
-   product-principles.md
-   system-overview.md
-   domain-model.md
-   dependency-graph.md
-   route-engine.md

## Definition of Done

This specification is implemented when AI is fully constrained to its
documented responsibilities, every trust boundary is enforced,
deterministic routing is preserved, and all required adversarial tests
pass.
