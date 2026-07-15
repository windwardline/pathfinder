# Pathfinder Documentation Constitution

**Version:** 1.0\
**Status:** Canonical Governance Document

## Purpose

This Constitution defines how Pathfinder documentation is created,
maintained, and evolved. It is the governing document for all repository
documentation.

## Authority

1.  The [Version 2 Design Freeze](version-2-design-freeze.md) is the current
    canonical product definition.
2.  This Constitution governs documentation structure and change
    management.
3.  Product Decisions and Architecture Decision Records (ADRs) are the
    only mechanisms for changing frozen product or architectural
    concepts.

## Documentation Hierarchy

1.  Governance
2.  Product
3.  Architecture
4.  Research
5.  Risk
6.  Decisions
7.  Stories
8.  Evaluations
9.  Instructor Deliverables (derived artifacts)

Instructor documents summarize canonical documentation and never
redefine it.

## Source of Truth

Every concept has exactly one canonical definition. Other documents
reference that definition instead of creating alternative wording.

## Protected Terminology

The following terms are protected: - Route - Reroute - Route Engine -
Route View - Confirmed Fact - Proposed Fact - Provenance - Dependency
Graph - Goal - Action - Dependency - Unlock - Blocker - Constraint -
Requirement - Obligation - Deadline - Today - Focus Action

## Product Identity

Internal Category: **Life Navigation Infrastructure for Reentry**

External Position: **Pathfinder builds and continuously updates a user's
Reentry Route.**

Locked Value Proposition: **Pathfinder builds your reentry route by
showing what comes next, why it comes next, and what it unlocks.**

## Architecture Rule

Canonical flow:

Confirmed Facts → Dependency Graph → Route Engine → Route → Adaptive
Route View

The Dependency Graph is infrastructure. The Route is the product. The
Route Engine owns sequencing.

## AI Boundary

LLMs may: - interpret - extract - summarize - explain

LLMs may not: - determine sequencing - prioritize actions - replace
deterministic routing

## Documentation Standards

-   Write in clear, startup-quality language.
-   Avoid competing terminology.
-   Avoid redefining concepts.
-   Cross-reference canonical documents where appropriate.
-   Record intentional changes through Product Decisions or ADRs.

## Change Management

Product changes require a Product Decision. Architectural changes
require an ADR. Terminology changes require both when applicable.

## Definition of Done

Documentation is complete when it: - aligns with the Design Freeze or
approved decisions, - preserves protected terminology, - contains no
conflicting definitions, - maintains architectural consistency, - avoids
scope creep, - references canonical sources where needed.
