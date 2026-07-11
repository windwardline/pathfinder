# Pathfinder Validation Strategy

**Version:** 1.0 **Status:** Canonical Research Document

## 1. Purpose

This document defines how Pathfinder's product hypotheses will be
validated. It distinguishes validated evidence from assumptions and
specifies the evaluation required before expanding product scope.

## 2. Validation Principles

-   Validate behavior, not marketing.
-   Measure user understanding before efficiency.
-   Test deterministic routing independently of AI.
-   Preserve the Route-first product identity.
-   Record results without redefining product concepts.

## 3. Primary Product Hypotheses

### H1 --- Route Comprehension

Users can correctly identify what comes next and explain why it comes
next after viewing a Route.

### H2 --- Reroute Comprehension

Users understand how a confirmed change alters their Route.

### H3 --- Trust

Confirmed Facts and provenance increase user confidence in
recommendations.

### H4 --- Cognitive Load

The Adaptive Route View reduces perceived complexity compared with an
equivalent checklist.

### H5 --- Determinism

Identical routing inputs always produce identical Routes.

## 4. Evaluation Methods

### Scenario-Based Evaluation

Participants complete realistic reentry scenarios using Pathfinder.

### Comparative Evaluation

Compare Pathfinder against: - static checklist - resource directory -
linear action plan

### Technical Verification

Use automated fixture, regression, metamorphic, and adversarial tests to
verify deterministic routing.

## 5. Success Metrics

User metrics: - Correctly identifies next action - Correctly explains
"why it comes next" - Correctly identifies at least one unlock -
Correctly interprets a Reroute - Reports confidence in the Route

Engineering metrics: - Deterministic Route reproduction - Zero Proposed
Facts affecting routing - Explanation reason-code accuracy - Provenance
completeness - Successful regression test execution

## 6. Data Collection

Collect: - task completion observations - comprehension responses -
confidence ratings - usability notes - routing logs (non-identifying) -
defect reports

## 7. Evidence Classification

### Validated

Supported through completed evaluation.

### Supported

Backed by literature or competitor research but not yet product-tested.

### Hypothesis

Requires validation.

## 8. Exit Criteria for Release 1

Release 1 validation is successful when:

1.  Users consistently understand what comes next.
2.  Users consistently understand why it comes next.
3.  Reroute explanations are interpreted correctly.
4.  Deterministic routing passes automated testing.
5.  Provenance remains traceable.
6.  No AI component changes Route sequencing.

## 9. Future Research

Future studies may evaluate: - longitudinal use - collaboration
workflows - accessibility outcomes - integration with community
resources - additional reentry domains

## 10. Traceability

Supports: - problem-space.md - literature-review.md -
competitor-analysis.md - release-1.md - prd.md

## 11. Definition of Done

Validation planning is complete when every major product hypothesis has
a measurable evaluation method, explicit success criteria, and
traceability to product decisions.
