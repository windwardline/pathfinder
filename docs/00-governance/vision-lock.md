# Pathfinder Vision Lock

**Version:** 1.0\
**Status:** Canonical Product Vision\
**Authority:** References the Version 2 Design Freeze and the
Documentation Constitution.

## Purpose

The Vision Lock preserves Pathfinder's product identity. It defines the
concepts that remain stable unless changed through an approved Product
Decision or Architecture Decision Record (ADR).

## Product Identity

**Product:** Pathfinder

**Internal Category:** Life Navigation Infrastructure for Reentry

**External Position:** Pathfinder builds and continuously updates a
user's Reentry Route.

**Locked Value Proposition:**

> Pathfinder builds your reentry route by showing what comes next, why
> it comes next, and what it unlocks.

## Product Philosophy

Pathfinder does not help users manage a list of tasks. It helps them
understand and continuously navigate their Route through reentry.

The Route is the product. Everything else exists to create, explain,
validate, or update the Route.

## North Star

Help justice-impacted individuals confidently navigate reentry by
continuously generating an explainable Route through interconnected
barriers, obligations, and opportunities.

## Product Principles

-   Explainable
-   Adaptive
-   Calm
-   User Controlled
-   Trustworthy
-   Privacy First
-   Deterministic Where It Matters

## Route / Reroute

### Route

An explainable, continuously updated sequence of actions derived from
Confirmed Facts, goals, barriers, obligations, deadlines, and
dependencies.

### Reroute

Whenever circumstances change, Pathfinder recalculates the Route and
explains:

-   what changed
-   why it changed
-   what moved
-   what became blocked
-   what became available

## Locked Architecture

Confirmed Facts → Dependency Graph → Route Engine → Route → Adaptive
Route View

The Dependency Graph is implementation infrastructure.

The Route is the primary user-facing product artifact.

The Route Engine exclusively owns sequencing.

## AI Position

LLMs may:

-   interpret
-   extract
-   summarize
-   explain

LLMs do not:

-   determine sequencing
-   prioritize actions
-   replace deterministic routing

## UX Philosophy

The complete Route always exists.

The Route View adaptively exposes the appropriate amount of information
to minimize cognitive load.

Today's work is presented through the Today experience without implying
the Route is limited to a fixed number of actions.

Explainability consistently answers:

**Why it comes next.**

## Release 1 Boundaries

Core loop:

Capture → Confirm → Map → Route → Explain → Update → Reroute

Every Release 1 feature must strengthen this loop.

## Non-Goals

-   AI chatbot
-   Resource directory
-   Checklist manager
-   Recidivism prediction
-   Personal-risk scoring
-   Unsupported legal advice
-   Hidden authority access
-   Organization-first workflows

## Governance

This Vision Lock is referenced by all Product, Architecture, Research,
Risk, and Engineering documentation.

Changes require an approved Product Decision or ADR.
