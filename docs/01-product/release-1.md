# Pathfinder Release 1 Specification

**Version:** 1.0\
**Status:** Canonical Product Specification

## Purpose

This document defines the complete scope of Pathfinder Release 1. It
translates the Product Vision into a bounded implementation that
engineering, design, testing, and evaluation can execute without
expanding scope.

## Release Objective

Demonstrate that Pathfinder can transform Confirmed Facts into an
explainable Reentry Route and perform a meaningful Reroute when user
circumstances change.

## Core Product Loop

Capture → Confirm → Map → Route → Explain → Update → Reroute

Every Release 1 capability must strengthen one or more stages of this
loop.

## In Scope

### User Experience

-   Authentication
-   Guided intake
-   Adaptive Route View
-   Today experience
-   Route explanation ("Why it comes next.")
-   Meaningful Reroute

### Trust

-   Proposed Fact workflow
-   Confirmed Fact workflow
-   Provenance for every route-affecting fact

### Routing

-   Dependency Graph infrastructure
-   Deterministic Route Engine
-   Route Version generation
-   Route History support

### Documents

Supported document types: - Identification guidance - Job offer -
Housing application or denial - Supervision schedule - Other fictional
or safely de-identified Release 1 examples

## Out of Scope

-   General-purpose chatbot
-   Organization administration
-   Case management
-   Predictive risk scoring
-   Recidivism prediction
-   Legal determinations
-   Broad workflow marketplace
-   Unconfirmed facts affecting the Route

## Acceptance Criteria

Release 1 is complete when Pathfinder can:

1.  Capture structured user information.
2.  Separate Proposed Facts from Confirmed Facts.
3.  Generate a deterministic Route.
4.  Explain why each action comes next.
5.  Preserve provenance.
6.  Produce a meaningful Reroute after a confirmed change.
7.  Maintain user control and privacy.
8.  Pass automated routing tests.

## Demonstration Narrative

A successful demonstration should show:

1.  Initial intake.
2.  Fact confirmation.
3.  Route generation.
4.  Explanation.
5.  A meaningful change in circumstances.
6.  Reroute.
7.  Explanation of what changed.

The demonstration should emphasize product behavior rather than
interface complexity.

## Success Measures

Release 1 succeeds when users can: - Understand what to do next. -
Understand why it comes next. - Trust the Route. - Observe meaningful
adaptation after change.

## Dependencies

This document references: - Documentation Constitution - Vision Lock -
Glossary - Product Principles - Product Vision - Product Philosophy

## Governance

Any expansion beyond this scope requires an approved Product Decision.
Architectural impacts additionally require an ADR.
