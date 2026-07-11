
# Facts API Specification

**Version:** 1.0  
**Status:** Canonical API Specification

## Purpose

This specification defines the API contract for Proposed Facts and Confirmed Facts in Pathfinder Release 1. It enforces the trust boundary that only Confirmed Facts may influence the Dependency Graph, Route Engine, Route, or Reroute.

## Design Principles

- Every fact begins as a Proposed Fact unless created through an explicitly approved deterministic workflow.
- Confirmation is a distinct, auditable action.
- Confidence does not equal confirmation.
- Every route-affecting Confirmed Fact must have Provenance.
- Fact history is preserved through supersession rather than destructive overwrite.
- AI output is always treated as candidate data.

## Resources

- Proposed Fact
- Confirmed Fact
- Fact Version
- Confirmation Event
- Rejection Event
- Supersession Event
- Provenance Reference

## Fact Status Values

Supported states:

- `PROPOSED`
- `CONFIRMED`
- `REJECTED`
- `SUPERSEDED`
- `EXPIRED`

Allowed transitions:

```text
PROPOSED → CONFIRMED
PROPOSED → REJECTED
CONFIRMED → SUPERSEDED
CONFIRMED → EXPIRED
```

No other transition is valid without a superseding ADR.

## Endpoints

### Create Proposed Fact

`POST /v1/facts`

Creates a Proposed Fact.

Required request fields:

- `fact_type`
- `value`
- `provenance_id`

Optional request fields:

- `effective_from`
- `expires_at`
- `notes`
- `source_context`

Response:

- `fact_id`
- `status`
- `created_at`
- `provenance_id`

### List Facts

`GET /v1/facts`

Supports filters:

- `status`
- `fact_type`
- `created_after`
- `created_before`

Results are paginated.

### Get Fact

`GET /v1/facts/{factId}`

Returns the current fact record and its state history.

### Confirm Proposed Fact

`POST /v1/facts/{factId}/confirm`

Confirms a Proposed Fact.

Request may include:

- `confirmation_method`
- `confirmation_note`
- `idempotency_key`

Response includes:

- `fact_id`
- `status: CONFIRMED`
- `confirmed_at`
- `confirmed_by`
- `route_recalculation_pending`

### Reject Proposed Fact

`POST /v1/facts/{factId}/reject`

Rejects a Proposed Fact.

Request includes:

- `reason_code`
- `reason_note` (optional)
- `idempotency_key`

Rejected facts remain auditable and never affect routing.

### Supersede Confirmed Fact

`POST /v1/facts/{factId}/supersede`

Creates a replacement Proposed Fact and links it to the current Confirmed Fact.

Required request fields:

- `replacement_value`
- `provenance_id`
- `reason_code`

The original fact remains Confirmed until the replacement is confirmed. After confirmation, the original fact becomes `SUPERSEDED`.

### Expire Fact

`POST /v1/facts/{factId}/expire`

Marks a Confirmed Fact as expired when supported by policy or verified timing rules.

This operation requires:

- explicit authorization
- reason code
- timestamp
- audit record

## Fact Representation

A fact response includes:

- `fact_id`
- `user_id`
- `fact_type`
- `value`
- `status`
- `provenance_id`
- `created_at`
- `updated_at`
- `confirmed_at`
- `confirmed_by`
- `supersedes_fact_id`
- `superseded_by_fact_id`
- `expires_at`
- `version`

Sensitive fields should be minimized in list responses.

## Confirmation Contract

Confirmation must:

- identify who or what confirmed the fact
- identify the confirmation method
- preserve an audit event
- validate ownership
- verify the fact is currently `PROPOSED`
- verify required Provenance exists
- be idempotent

Confirmation must not:

- mutate unrelated facts
- bypass Provenance
- rely only on model confidence
- silently overwrite existing Confirmed Facts

## Provenance Linkage

Every Proposed Fact must reference Provenance.

Every route-affecting Confirmed Fact must preserve that Provenance reference.

The Facts API must reject:

- unknown Provenance identifiers
- cross-user Provenance references
- unsupported source types
- missing integrity metadata where required

## Routing Effects

### Proposed Fact

- Does not alter the Dependency Graph.
- Does not trigger Route generation.
- Does not trigger Reroute.
- May appear in confirmation UI.

### Confirmed Fact

- May trigger a new GraphVersion.
- May trigger Route recalculation.
- May produce a Reroute Event.
- Must preserve Provenance.

### Rejected Fact

- Has no routing effect.
- Remains available for audit.

### Superseded or Expired Fact

- Is excluded from current routing state.
- Remains referenced by historical Route Versions where applicable.
- May trigger a new GraphVersion and Reroute.

## Idempotency

State-changing endpoints require an idempotency key.

Repeated requests with the same key and semantically identical payload must return the same result.

Conflicting reuse of an idempotency key must return a validation error.

## Validation Rules

The API must validate:

- authenticated user
- fact ownership
- recognized fact type
- value schema
- valid state transition
- Provenance ownership
- supported confirmation method
- timestamp consistency
- supersession integrity

## Error Model

Standard error fields:

- `error_code`
- `message`
- `correlation_id`
- `retryable`
- `field_errors` (optional)

Example error codes:

- `FACT_NOT_FOUND`
- `INVALID_FACT_STATE`
- `PROVENANCE_REQUIRED`
- `PROVENANCE_NOT_FOUND`
- `CROSS_USER_REFERENCE`
- `INVALID_FACT_VALUE`
- `IDEMPOTENCY_CONFLICT`
- `UNAUTHORIZED`
- `FORBIDDEN`

## Security

All endpoints require:

- authentication
- authorization
- strict ownership validation
- input validation
- audit logging for state transitions

Cross-user references must be rejected and logged as security events.

## Privacy

- Avoid returning unnecessary sensitive values.
- Log identifiers rather than full sensitive payloads.
- Support export and approved deletion workflows.
- Preserve required historical traceability without retaining unnecessary source content.

## Observability

Emit structured events for:

- Proposed Fact created
- Fact confirmed
- Fact rejected
- Fact superseded
- Fact expired
- invalid transition attempted
- cross-user reference detected
- Route recalculation requested

## Concurrency

Concurrent confirmation or supersession requests must use optimistic locking or equivalent version checks.

Only one valid terminal transition may succeed.

## Acceptance Criteria

The Facts API is complete when:

1. Proposed Facts can be created with Provenance.
2. Confirmation is explicit, auditable, and idempotent.
3. Rejected Facts never affect routing.
4. Supersession preserves history.
5. Only Confirmed Facts can trigger routing changes.
6. Cross-user references are blocked.
7. Invalid state transitions are rejected.
8. Concurrent mutations remain consistent.
9. API responses use canonical terminology.
10. Automated integration and adversarial tests pass.

## Required Tests

- Create Proposed Fact
- Confirm Proposed Fact
- Reject Proposed Fact
- Supersede Confirmed Fact
- Expire Confirmed Fact
- Duplicate confirmation request
- Conflicting idempotency key
- Missing Provenance
- Cross-user Provenance reference
- Proposed Fact has no routing effect
- Confirmed Fact triggers Route recalculation
- Superseded Fact removed from current routing state
- Concurrent confirmation conflict

## Traceability

Supports:

- api-design-principles.md
- domain-model.md
- provenance.md
- route-engine.md
- dependency-graph.md
- ai-boundaries.md
- ADR-003
- ADR-004

## Definition of Done

The Facts API is complete when the full Proposed Fact and Confirmed Fact lifecycle is implemented, every transition is auditable, Provenance is enforced, only Confirmed Facts can affect routing, and all security, concurrency, and adversarial tests pass.
