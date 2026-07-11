# Pathfinder Provenance Specification

**Version:** 1.0\
**Status:** Canonical Architecture Specification\
**Owner:** Architecture\
**Applies To:** Pathfinder Release 1

## 1. Purpose

This specification defines how Pathfinder records, preserves, validates,
and exposes provenance for every route-affecting fact. Provenance is the
foundation of explainability, auditability, reproducibility, and user
trust.

## 2. Architectural Role

``` text
User Input / Documents
          ↓
Candidate Facts
          ↓
Validation
          ↓
Proposed Facts
          ↓
User Confirmation
          ↓
Confirmed Facts + Provenance
          ↓
Dependency Graph
          ↓
Route Engine
          ↓
Route + Explanation
```

Every route-affecting decision must be traceable back to evidence.

## 3. Principles

-   Every route-affecting Confirmed Fact has provenance.
-   Provenance is immutable once referenced by a published Route
    Version.
-   Provenance explains evidence, not decisions.
-   Missing provenance blocks activation of required facts.
-   Provenance is independent of AI-generated wording.

## 4. Provenance Record

Required fields:

-   provenance_id
-   user_id
-   source_type
-   source_reference
-   created_at
-   created_by
-   integrity_hash

Optional fields:

-   document_id
-   page_reference
-   section_reference
-   extraction_metadata
-   superseded_by
-   retention_policy

## 5. Source Types

Release 1 supports:

-   USER_ENTRY
-   DOCUMENT_EXTRACTION
-   VERIFIED_RULE
-   USER_CORRECTION
-   SYSTEM_DERIVATION

New source types require an ADR.

## 6. Evidence Chain

Every Confirmed Fact must support this chain:

``` text
Source
   ↓
Provenance
   ↓
Proposed Fact
   ↓
User Confirmation
   ↓
Confirmed Fact
   ↓
Dependency Graph
   ↓
Route
   ↓
Explanation
```

No step may be skipped.

## 7. Confidence vs Confirmation

Confidence is an extraction property.

Confirmation is a trust property.

High-confidence extraction does **not** create a Confirmed Fact.

Only explicit confirmation or an approved deterministic workflow may do
so.

## 8. Document Lineage

Supported metadata includes:

-   document identifier
-   upload timestamp
-   extraction version
-   parser version
-   model version (if applicable)
-   page references

Document lineage supports auditability without making uploaded documents
authoritative by themselves.

## 9. Supersession

Facts may be superseded but never silently overwritten.

Supersession must preserve:

-   previous value
-   previous provenance
-   superseding reference
-   timestamp
-   reason

Historical Route Versions continue referencing historical provenance.

## 10. Explainability Contract

Every explanation must be able to identify:

-   which Confirmed Facts influenced the Route
-   the provenance supporting those facts
-   deterministic reason codes
-   the Route Version

Plain-language explanations may summarize this information but cannot
invent supporting evidence.

## 11. Retention

Release 1 principles:

-   preserve provenance required by published Route Versions
-   support user-requested export
-   support approved deletion workflows
-   minimize unnecessary retention of personal data

Implementation details depend on deployment policy.

## 12. Security

-   Provenance records inherit user ownership.
-   Cross-user provenance access is prohibited.
-   Integrity hashes protect against silent modification.
-   Administrative access must be audited.
-   Debug logs should avoid exposing unnecessary personal information.

## 13. Failure Modes

### Missing provenance

Prevent activation of the associated Confirmed Fact.

### Broken evidence chain

Reject Route publication.

### Invalid source reference

Reject provenance validation.

### Deleted supporting document

Retain provenance metadata while following approved retention policy.

### AI-generated unsupported citation

Reject before persistence.

## 14. Testing

Unit tests:

-   provenance creation
-   integrity hash validation
-   supersession
-   evidence-chain validation

Integration tests:

-   document extraction to Proposed Fact
-   confirmation to Confirmed Fact
-   provenance through Route generation
-   Route explanation references

Adversarial tests:

-   forged provenance identifiers
-   cross-user provenance access
-   missing source references
-   modified integrity hashes
-   unsupported source types

## 15. Acceptance Criteria

Release 1 is complete when:

1.  Every route-affecting Confirmed Fact has provenance.
2.  Evidence chains remain intact.
3.  Historical Route Versions retain historical provenance.
4.  Missing provenance blocks routing where required.
5.  Explanations remain traceable.
6.  Security and adversarial tests pass.

## 16. Traceability

Implements:

-   vision-lock.md
-   glossary.md
-   product-principles.md
-   release-1.md
-   prd.md
-   system-overview.md
-   domain-model.md
-   dependency-graph.md
-   route-engine.md
-   ai-boundaries.md

## 17. Definition of Done

The provenance subsystem is complete when provenance is immutable for
published Route Versions, evidence chains are enforceable,
explainability is traceable to supporting evidence, user ownership is
preserved, and automated tests validate all trust boundaries.
