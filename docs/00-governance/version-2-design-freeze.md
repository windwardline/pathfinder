# Version 2 Design Freeze

**Version:** 2.0  
**Status:** Approved Product Baseline  
**Repository Ratification:** 2026-07-15

## Purpose

This artifact is the authoritative product baseline repeatedly referenced by
Pathfinder's canonical documentation. It freezes product identity and trust
boundaries by reference instead of duplicating their complete definitions.

## Frozen Product Identity

- Pathfinder is Life Navigation Infrastructure for Reentry.
- The Route is the product.
- The user-facing promise is what comes next, why it comes next, and what it unlocks.
- Reroute is the structured response to a change in Confirmed Facts.
- The Dependency Graph remains infrastructure and is not a primary user-facing artifact.

## Frozen Trust Boundaries

- Only Confirmed Facts may affect a Route.
- The Route Engine is the sole sequencing authority.
- AI may interpret, extract, summarize, and explain.
- AI may never confirm a Fact, select a Focus Action, prioritize or sequence Actions, or publish a Route.
- Pathfinder does not perform risk scoring, recidivism prediction, legal determinations, or hidden disclosure to outside organizations.

## Authoritative References

- [Vision Lock](vision-lock.md)
- [Glossary](glossary.md)
- [Product Principles](product-principles.md)
- [Release 1](../01-product/release-1.md)
- [ADR-001 through ADR-006](../05-decisions/)

## Change Control

A user-visible behavior change requires an approved Product Decision. An
architectural change requires an ADR. A change to a trust boundary requires a
superseding ADR and, when user-visible, a Product Decision.

## Release 1 Interpretation

Release 1 may use a compact relational persistence projection as approved by
ADR-006. That implementation choice does not alter canonical domain concepts,
the deterministic Route Engine, immutable published snapshots, or user-facing
terminology.

