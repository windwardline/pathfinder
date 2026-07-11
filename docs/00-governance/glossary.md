# Pathfinder Glossary

**Version:** 1.0\
**Status:** Canonical Governance Artifact

## Purpose

This glossary defines the canonical meaning of Pathfinder terminology.
Every protected concept has a single authoritative definition. Other
documentation must reference these definitions rather than introducing
alternate wording.

## Product Philosophy

**Pathfinder does not help users manage a list of tasks. It helps them
understand and continuously navigate their Route through reentry.**

------------------------------------------------------------------------

## Core Concepts

### Route

The primary product artifact produced by Pathfinder. A continuously
updated, explainable sequence of actions generated from Confirmed Facts,
goals, barriers, obligations, deadlines, constraints, and dependencies.

### Reroute

Recalculation of the Route after confirmed circumstances change, with an
explanation of what changed, why it changed, what moved, what became
blocked, and what became available.

### Route Engine

The deterministic component responsible for sequencing the Route. The
Route Engine is the sole authority for prioritization and sequencing.

### Route View

The adaptive user interface that presents the Route while minimizing
cognitive load.

------------------------------------------------------------------------

## Trust

### Proposed Fact

Information extracted, inferred, or entered that has not yet been
confirmed. Proposed Facts never influence the Route.

### Confirmed Fact

Information verified by the user or trusted workflow. Only Confirmed
Facts may affect Route generation.

### Provenance

The traceable source associated with every route-affecting fact,
enabling explanation and auditability.

### Explanation

The user-facing rationale describing **why an action comes next**.

------------------------------------------------------------------------

## Domain

### Goal

A desired outcome the user is attempting to achieve.

### Action

A concrete step within the Route.

### Dependency

A relationship indicating one Action or Requirement must be satisfied
before another.

### Unlock

Progress made possible by completing an Action.

### Blocker

A condition preventing progress until resolved.

### Constraint

A limiting condition affecting the Route, including time,
transportation, finances, or availability.

### Requirement

A prerequisite that must be satisfied before another Action can proceed.

### Obligation

A mandatory commitment such as supervision, employment, or legal
requirements.

### Deadline

A time-sensitive constraint that influences sequencing.

------------------------------------------------------------------------

## Infrastructure

### Dependency Graph

The internal representation of relationships between Confirmed Facts,
Goals, Actions, Requirements, Constraints, and Dependencies. It is
implementation infrastructure rather than the primary product.

### Route Version

A snapshot of the Route at a specific point in time.

### Route History

The chronological record of Route Versions.

### Scenario

A hypothetical set of changed Confirmed Facts used to evaluate potential
Reroutes.

------------------------------------------------------------------------

## User Experience

### Today

The focused presentation of the Route appropriate for the current
moment.

### Focus Action

The highest-priority actionable item presented to the user based on the
current Route.

------------------------------------------------------------------------

## AI Boundary

Large language models may interpret, extract, summarize, and explain
information. They do not determine sequencing, prioritize actions, or
replace the Route Engine.

## Governance

Definitions in this glossary may only be modified through an approved
Product Decision or Architecture Decision Record (ADR). All repository
documentation shall reference these definitions as the canonical
terminology.
