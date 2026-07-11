
# Provenance API Specification

**Version:** 1.0  
**Status:** Canonical API Specification

## Purpose

This specification defines the API contract for creating, retrieving, validating, and preserving Provenance in Pathfinder Release 1.

Provenance provides the evidence chain supporting Proposed Facts, Confirmed Facts, Dependency Graph relationships, Route generation, and explanations.

## Design Principles

- Every route-affecting Confirmed Fact has Provenance.
- Provenance is immutable once referenced by a published Route Version.
- Provenance records evidence; it does not determine Route order.
- Provenance must remain traceable across fact supersession and Route history.
- AI-generated citations are never accepted without validation.

## Resources

- Provenance Record
- Source Reference
- Document Lineage
- Rule Reference
- Integrity Record
- Provenance Validation Result

## Supported Source Types

- `USER_ENTRY`
- `DOCUMENT_EXTRACTION`
- `VERIFIED_RULE`
- `USER_CORRECTION`
- `SYSTEM_DERIVATION`

New source types require an ADR.

## Endpoints

### Create Provenance Record

`POST /v1/provenance`

Creates a Provenance Record.

Required fields:

- `source_type`
- `source_reference`
- `created_by`

Optional fields:

- `document_id`
- `page_reference`
- `section_reference`
- `rule_id`
- `extraction_metadata`
- `retention_policy`

Response includes:

- `provenance_id`
- `integrity_hash`
- `created_at`
- `status`

### Get Provenance Record

`GET /v1/provenance/{provenanceId}`

Returns a Provenance Record owned by the authenticated user.

### Validate Provenance

`POST /v1/provenance/{provenanceId}/validate`

Returns:

- `valid`
- `validation_errors`
- `integrity_status`
- `reference_status`

This endpoint does not change fact state.

### List Provenance Records

`GET /v1/provenance`

Supports filters:

- `source_type`
- `document_id`
- `rule_id`
- `created_after`
- `created_before`

### Get Evidence Chain

`GET /v1/provenance/{provenanceId}/chain`

Returns the structured lineage linking:

- source
- Provenance
- Proposed Fact
- confirmation event
- Confirmed Fact
- GraphVersion
- Route Version
- explanation

## Provenance Representation

A Provenance Record includes:

- `provenance_id`
- `user_id`
- `source_type`
- `source_reference`
- `created_at`
- `created_by`
- `integrity_hash`
- `document_id`
- `page_reference`
- `section_reference`
- `rule_id`
- `extraction_metadata`
- `retention_policy`
- `status`

## Immutability

Published Provenance Records are immutable.

Corrections require:

1. Creating a new Provenance Record.
2. Linking the new record through fact supersession.
3. Preserving the previous record for historical Route Versions.

No endpoint supports in-place mutation of published Provenance.

## Integrity Contract

Every Provenance Record must include an integrity hash computed from canonical normalized fields.

Validation must detect:

- modified source references
- changed document lineage
- altered rule identifiers
- unauthorized metadata mutation
- cross-user linkage

## Document Lineage

For document-derived evidence, the API should preserve:

- document identifier
- upload timestamp
- parser version
- extraction version
- model version (if applicable)
- page or section reference
- content hash

Document content itself may be stored separately under approved retention policy.

## Rule Provenance

Verified Rule Provenance must include:

- rule identifier
- rule-set version
- jurisdiction
- effective date range
- source reference
- owner

Expired Rules may remain in historical Provenance but cannot support current routing.

## Evidence Chain Contract

The Evidence Chain API must return structured references without relying on generated prose.

The required chain is:

```text
Source
  ↓
Provenance
  ↓
Proposed Fact
  ↓
Confirmation Event
  ↓
Confirmed Fact
  ↓
GraphVersion
  ↓
Route Version
  ↓
Explanation
```

Missing required links must produce a validation error.

## Security

All endpoints require:

- authentication
- authorization
- user ownership validation
- source-reference validation
- audit logging for sensitive access

Cross-user Provenance access is prohibited.

## Privacy

- Return the minimum source detail necessary.
- Redact sensitive document excerpts where appropriate.
- Avoid exposing raw model prompts or responses by default.
- Preserve traceability while following approved deletion and retention policies.

## Error Model

Standard error fields:

- `error_code`
- `message`
- `correlation_id`
- `retryable`
- `field_errors` (optional)

Example error codes:

- `PROVENANCE_NOT_FOUND`
- `INVALID_SOURCE_TYPE`
- `INVALID_SOURCE_REFERENCE`
- `INTEGRITY_MISMATCH`
- `CROSS_USER_REFERENCE`
- `IMMUTABLE_RECORD`
- `BROKEN_EVIDENCE_CHAIN`
- `UNAUTHORIZED`
- `FORBIDDEN`

## Idempotency

Creation requests should support idempotency keys.

Repeated identical requests return the same Provenance Record.

Conflicting reuse of a key returns `IDEMPOTENCY_CONFLICT`.

## Observability

Emit structured events for:

- Provenance created
- Provenance validation passed
- Provenance validation failed
- Evidence chain requested
- integrity mismatch detected
- cross-user access attempt
- retention action executed

Logs must not expose unnecessary sensitive content.

## Acceptance Criteria

The Provenance API is complete when:

1. Provenance Records can be created and retrieved.
2. Published Provenance is immutable.
3. Integrity validation detects tampering.
4. Evidence Chains are complete and structured.
5. Cross-user access is blocked.
6. Document and Rule lineage are preserved.
7. Historical Route Versions retain historical Provenance.
8. Missing or invalid Provenance blocks fact activation where required.
9. API responses use canonical terminology.
10. Automated integration and adversarial tests pass.

## Required Tests

- Create USER_ENTRY Provenance
- Create DOCUMENT_EXTRACTION Provenance
- Create VERIFIED_RULE Provenance
- Validate integrity hash
- Detect altered source reference
- Reject unsupported source type
- Reject cross-user access
- Retrieve complete Evidence Chain
- Detect broken Evidence Chain
- Preserve historical Provenance after fact supersession
- Enforce immutable published record
- Validate idempotent creation

## Traceability

Supports:

- api-design-principles.md
- facts-api.md
- provenance.md
- domain-model.md
- route-engine.md
- dependency-graph.md
- ADR-004

## Definition of Done

The Provenance API is complete when evidence records are immutable, integrity-protected, user-isolated, traceable through the full Route lifecycle, and all required validation, security, and adversarial tests pass.
