# Pathfinder Problem Space

**Version:** 1.0\
**Status:** Canonical Research Document

## Purpose

This document defines the problem Pathfinder is designed to solve. It
provides the evidence framework for product decisions and explains why a
Route-first approach is appropriate for Release 1.

## Executive Summary

People returning to their communities after incarceration often face
multiple interconnected obligations, barriers, deadlines, and
opportunities simultaneously. Success rarely depends on completing
isolated tasks; instead, progress depends on completing the *right*
action in the *right* order.

Pathfinder addresses this sequencing problem by producing an explainable
Reentry Route rather than a disconnected checklist.

## Problem Statement

Traditional reentry support frequently distributes information across
agencies, programs, paper documents, and conversations. Individuals must
determine:

-   what to do next,
-   why it matters,
-   which actions are prerequisites,
-   what deadlines exist,
-   and what new opportunities become available after completing an
    action.

This cognitive burden increases as circumstances change.

## Systems Perspective

Reentry is an interconnected system rather than a linear process.

Common domains include:

-   Identification
-   Housing
-   Employment
-   Transportation
-   Healthcare
-   Financial obligations
-   Supervision requirements
-   Family responsibilities

A change in one domain can alter progress in several others, making
sequencing a core product problem.

## Product Hypothesis

Users benefit more from an explainable Route that adapts to confirmed
changes than from disconnected task lists, static resource directories,
or conversational assistance alone.

## Design Implications

The problem space supports the following architectural decisions:

-   Route-first product identity.
-   Deterministic Route Engine.
-   Confirmed Fact trust boundary.
-   Dependency Graph as infrastructure.
-   Provenance for every route-affecting fact.
-   Meaningful Reroute after confirmed change.

## Evidence Categories

Release 1 validation draws from:

-   Government publications
-   Academic literature
-   Nonprofit research
-   Published lived experience
-   Competitor analysis
-   Instructor feedback
-   Scenario-based evaluation

Each source category informs product direction but does not
independently redefine product behavior.

## Research Questions

1.  Which barriers most frequently create downstream dependencies?
2.  Which actions unlock the greatest subsequent progress?
3.  Which deadlines most strongly affect sequencing?
4.  How do users understand and trust explanations?
5.  Which Route changes are perceived as meaningful?
6.  Which interactions reduce cognitive load without hiding important
    information?

## Success Indicators

Evidence should demonstrate that users can:

-   identify what comes next,
-   understand why it comes next,
-   recognize what an action unlocks,
-   adapt to meaningful Reroutes,
-   maintain trust in the Route.

## Out of Scope

This document does not prescribe implementation details, routing
algorithms, or UI behavior. Those are defined by the architecture and
product specifications.

## Traceability

Supports:

-   vision.md
-   product-philosophy.md
-   release-1.md
-   prd.md
-   system-overview.md

## Definition of Done

The problem space is sufficiently documented when product decisions can
be traced to evidence categories, architectural choices remain
justified, and future research can extend this document without changing
the Version 2 product identity.
