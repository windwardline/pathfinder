
# Pathfinder Contributing Guide

**Version:** 1.0  
**Status:** Canonical Development Standard

## Purpose

This guide defines how contributors participate in Pathfinder development after the Version 2 Design Freeze. It ensures that all contributions preserve the product identity, architectural decisions, and repository governance.

## Core Principles

- The repository is the canonical source of truth.
- Documentation leads implementation.
- Preserve the Version 2 Design Freeze unless an approved governance process changes it.
- Improve clarity without redesigning the product.
- Protect canonical terminology.

## Before Contributing

Contributors should read, at minimum:

- `vision-lock.md`
- `glossary.md`
- `product-principles.md`
- `release-1.md`
- `system-overview.md`
- ADR-001 through ADR-006 and applicable Product Decisions
- `coding-standards.md`
- `testing-strategy.md`
- `definition-of-done.md`

## Contribution Types

### Documentation

Update canonical documents, improve clarity, add traceability, or correct inconsistencies.

### Product

User-visible behavior changes require a Product Decision.

### Architecture

Architectural changes require a superseding ADR.

### Engineering

Implementation changes must conform to the canonical architecture and development standards.

### Research

Research additions must identify authoritative sources, distinguish evidence from hypotheses, and avoid changing product behavior without governance.

## Protected Terminology

Do not rename or replace canonical concepts, including:

- Route
- Reroute
- Route Engine
- Adaptive Route View
- Confirmed Fact
- Proposed Fact
- Dependency Graph
- Focus Action
- Provenance

New overlapping terminology requires review before adoption.

## Pull Request Expectations

Every contribution should include:

- Purpose
- Scope
- Linked issue, story, Product Decision, or ADR
- Test evidence (when applicable)
- Documentation updates (when applicable)
- Risk assessment for significant changes

## Review Checklist

Reviewers verify:

- Product identity is preserved.
- No terminology drift exists.
- Architectural boundaries remain intact.
- Tests are appropriate.
- Documentation is synchronized.
- Scope remains within Release 1.

## Governance Matrix

| Change | Approval Required |
|---|---|
| Documentation clarification | Maintainer review |
| User-visible product behavior | Product Decision |
| Architecture | ADR |
| Security or privacy controls | Security review |
| Repository standards | Engineering review |

## Contributor Responsibilities

Contributors are expected to:

- Keep changes focused.
- Leave the repository more consistent than they found it.
- Prefer cross-references over duplication.
- Raise uncertainties rather than inventing new concepts.
- Preserve deterministic behavior.

## Communication

Architectural disagreements should be resolved through documented decisions rather than implementation divergence.

## Code of Collaboration

- Be respectful and evidence-driven.
- Challenge ideas, not people.
- Document assumptions.
- Prefer measurable reasoning over opinion.

## Traceability

Supports:

- repository-structure.md
- branching-strategy.md
- coding-standards.md
- definition-of-done.md
- ADR-001 through ADR-006 and applicable Product Decisions

## Definition of Done

A contribution is accepted when it passes review, satisfies applicable testing and documentation requirements, preserves canonical terminology, and remains consistent with the Version 2 Design Freeze.
