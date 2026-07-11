# Pathfinder Product Requirements Document (PRD)

**Version:** 1.0\
**Status:** Canonical Product Requirements Document

## Purpose

This PRD defines the executable product requirements for Pathfinder
Release 1. It references the Documentation Constitution, Vision Lock,
Glossary, Product Principles, Product Vision, Product Philosophy, and
Release 1 Specification instead of redefining them.

## Product Summary

Pathfinder builds and continuously updates a user's Reentry Route by
transforming Confirmed Facts into an explainable sequence of actions
through the Route Engine.

## Target User

Release 1 serves justice-impacted adults during the first year after
release who are managing multiple interconnected goals, barriers,
obligations, constraints, and deadlines.

## Product Goals

-   Generate a trustworthy Route.
-   Explain why each action comes next.
-   Adapt through meaningful Reroute.
-   Reduce cognitive load.
-   Preserve user control and privacy.

## Functional Requirements

### Intake

-   Guided structured intake.
-   Authentication.
-   Support manual entry and supported document ingestion.

### Trust

-   Distinguish Proposed Facts from Confirmed Facts.
-   Require confirmation before route generation.
-   Preserve provenance for every route-affecting fact.

### Routing

-   Build a Dependency Graph from Confirmed Facts.
-   Generate a deterministic Route using the Route Engine.
-   Produce Route Versions and Route History.
-   Trigger Reroute when Confirmed Facts change.

### Explainability

-   Every Focus Action answers: **Why it comes next.**
-   Display dependencies, unlocks, and provenance where appropriate.

### Route View

-   Adaptive Today experience.
-   Progressive disclosure.
-   Accessible presentation.
-   Empty, loading, blocked, and error states.

## Non-Functional Requirements

-   Accessibility-first design.
-   Responsive interface.
-   Deterministic routing.
-   Privacy-first architecture.
-   Secure authentication and authorization.
-   Auditability through provenance.
-   Testable routing behavior.

## Primary User Journey

1.  Create account or sign in.
2.  Complete guided intake.
3.  Confirm Proposed Facts.
4.  Generate Route.
5.  Review Today's Focus Action.
6.  Understand why it comes next.
7.  Update circumstances.
8.  Receive meaningful Reroute.

## Acceptance Criteria

Release 1 must: - Generate consistent Routes from identical Confirmed
Facts. - Reject unconfirmed information from routing. - Preserve
provenance. - Produce deterministic explanations. - Demonstrate
meaningful Reroute. - Maintain user privacy. - Pass automated routing
tests.

## Security & Privacy

-   User-controlled data.
-   Explicit sharing only.
-   No hidden authority access.
-   No unsupported legal advice.
-   No predictive risk scoring.

## Traceability

Primary implementation reference: - release-1.md

Supporting governance: - documentation-constitution.md -
vision-lock.md - glossary.md - product-principles.md - vision.md -
product-philosophy.md

## Governance

Changes to product behavior require an approved Product Decision.
Architectural impacts additionally require an ADR.
