
# Pathfinder Risk Register

**Version:** 1.0  
**Status:** Canonical Risk Document

## Purpose

This document identifies, evaluates, and tracks Release 1 risks across product, architecture, engineering, AI, security, privacy, research, competition, and operations.

## Risk Rating

- **Likelihood:** Low / Medium / High
- **Impact:** Low / Medium / High

## Risk Register

| ID | Category | Risk | Likelihood | Impact | Early Warning | Mitigation | Owner | Traceability |
|---|---|---|---|---|---|---|---|---|
| R-001 | Product | Route-first identity drifts toward checklist/chatbot | M | H | Scope expansion | Enforce Vision Lock and Product Principles | Product | vision-lock.md |
| R-002 | Architecture | Non-deterministic routing | L | H | Different Routes from same inputs | Golden fixtures, regression tests | Engineering | route-engine.md |
| R-003 | Trust | Proposed Facts influence routing | L | H | Route changes before confirmation | Enforce confirmation boundary | Engineering | domain-model.md |
| R-004 | AI | Hallucinated facts or priorities | M | H | Unsupported model output | AI validation pipeline | Engineering | ai-boundaries.md |
| R-005 | Security | Cross-user data exposure | L | H | Authorization failures | User isolation, least privilege | Engineering | system-overview.md |
| R-006 | Privacy | Oversharing sensitive information | M | H | Excessive logging | Data minimization | Engineering | provenance.md |
| R-007 | Competition | Competitors replicate Route concepts | M | M | Feature parity | Differentiate with deterministic Route/Reroute | Product | competitor-analysis.md |
| R-008 | Validation | Product hypotheses remain unproven | M | H | Weak evaluation results | Execute validation strategy | Product | validation.md |
| R-009 | Operations | Rule updates introduce regressions | M | H | Routing changes | Version rules, regression testing | Engineering | route-engine.md |
| R-010 | Scope | Release 1 scope creep | H | H | Growing backlog | Enforce Release 1 Specification | Product | release-1.md |

## Governance

High-impact mitigation changes that alter product behavior require a Product Decision. Architectural changes additionally require an ADR.

## Definition of Done

Every high-priority risk has an owner, mitigation, traceability, and review cadence before release.
