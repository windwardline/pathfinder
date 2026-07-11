# Pathfinder Product Principles

**Version:** 1.0\
**Status:** Canonical Product Governance Artifact

## Purpose

These principles guide every product decision for Pathfinder. They are
the evaluation criteria for new features, product trade-offs, roadmap
changes, and Product Decisions. When principles conflict, decisions
should favor preserving the Route-first product identity.

## Principle 1 --- The Route Is the Product

The primary value delivered by Pathfinder is the Reentry Route. Every
major capability must contribute to creating, improving, explaining, or
updating the Route.

**Decision test:** Does this strengthen the user's Route?

------------------------------------------------------------------------

## Principle 2 --- Explainability Builds Trust

Every route-affecting action should be explainable.

The standard explanation is:

**Why it comes next.**

Users should be able to understand why an action appears where it does
in the Route.

------------------------------------------------------------------------

## Principle 3 --- Deterministic Where It Matters

Critical sequencing is owned by the Route Engine.

Artificial intelligence may interpret information, but deterministic
logic governs the Route.

------------------------------------------------------------------------

## Principle 4 --- Trust Begins with Confirmed Facts

Only Confirmed Facts influence the Route.

Proposed Facts require user confirmation before they become
route-affecting inputs.

------------------------------------------------------------------------

## Principle 5 --- Adapt to Change

Life changes. The product must adapt without forcing users to rebuild
plans.

A meaningful Reroute explains:

-   what changed
-   why it changed
-   what moved
-   what became blocked
-   what became available

------------------------------------------------------------------------

## Principle 6 --- Reduce Cognitive Load

The complete Route always exists, but the Route View presents only the
information users need at the moment.

The interface should feel calm, focused, and approachable.

------------------------------------------------------------------------

## Principle 7 --- User Control Is Fundamental

Users own their information.

Sharing is explicit, revocable, and transparent.

The product is never designed as a surveillance or monitoring system.

------------------------------------------------------------------------

## Principle 8 --- Privacy First

Collect only the information needed to generate and maintain the Route.

Protect route-affecting information with strong security and provenance.

------------------------------------------------------------------------

## Principle 9 --- Preserve Product Identity

Avoid feature expansion that changes Pathfinder into a chatbot,
checklist, case-management platform, or resource directory.

Future capabilities should reinforce the Route-first identity rather
than compete with it.

------------------------------------------------------------------------

## Principle 10 --- Grow Through Evidence

Product evolution follows evidence from research, validation, user
feedback, and approved Product Decisions or ADRs---not assumptions or
terminology drift.

## Feature Admission Filter

A feature should enter active development only if it can answer **yes**
to all of the following:

1.  Does it strengthen the Route or Reroute?
2.  Does it preserve deterministic sequencing?
3.  Does it maintain the Confirmed Fact trust boundary?
4.  Does it reduce or appropriately manage cognitive load?
5.  Does it respect user control and privacy?
6.  Does it fit within the approved product scope?

If any answer is **no**, the feature is deferred or requires a Product
Decision.

## Governance

These principles apply across Product, Architecture, Design, Research,
and Engineering documentation. Changes require an approved Product
Decision, and architectural impacts additionally require an ADR.
