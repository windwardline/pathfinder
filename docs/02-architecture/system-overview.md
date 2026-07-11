# Pathfinder System Overview

**Version:** 1.0\
**Status:** Canonical Architecture Document

## Purpose

This document defines the high-level architecture of Pathfinder and
serves as the entry point for all architecture documentation. Detailed
implementation belongs in companion architecture documents.

## Architectural Principles

-   The Route is the product.
-   The Dependency Graph is implementation infrastructure.
-   The Route Engine is the sole sequencing authority.
-   Only Confirmed Facts influence routing.
-   Every route-affecting fact has provenance.
-   AI augments understanding but never owns sequencing.

## Canonical Flow

``` text
User Input / Documents
          │
          ▼
    Proposed Facts
          │
     User Confirmation
          │
          ▼
    Confirmed Facts
          │
          ▼
   Dependency Graph
          │
          ▼
     Route Engine
          │
          ▼
         Route
          │
          ▼
 Adaptive Route View
          │
   User Updates
          │
          └──────────────► Reroute
```

## Core Components

### Intake Layer

Captures structured information from users and supported documents. All
extracted information begins as Proposed Facts.

### Trust Layer

Separates Proposed Facts from Confirmed Facts, maintains provenance, and
prevents unconfirmed information from influencing routing.

### Dependency Graph

Internal representation of relationships among goals, actions,
requirements, obligations, constraints, and deadlines. This layer is not
the primary user-facing product.

### Route Engine

Consumes Confirmed Facts and the Dependency Graph to generate a
deterministic Route. Recomputes Routes whenever confirmed circumstances
change.

### Route

The primary product artifact presented to the user. Every Route is
explainable, versioned, and reproducible from the same Confirmed Facts.

### Adaptive Route View

Presents the Route with progressive disclosure, Today focus,
accessibility support, and meaningful explanations.

## Cross-Cutting Concerns

-   Authentication and authorization
-   Privacy-first data handling
-   Provenance and auditability
-   Accessibility
-   Automated testing
-   Deterministic routing
-   Security monitoring

## Companion Documents

-   domain-model.md
-   route-engine.md
-   dependency-graph.md
-   ai-boundaries.md
-   provenance.md

## Governance

Architectural changes require an approved Architecture Decision Record
(ADR). Product behavior changes additionally require a Product Decision.
