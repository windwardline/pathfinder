
# Reroute API Specification

**Version:** 1.0  
**Status:** Canonical API Specification

## Purpose

This specification defines the API contract for creating, retrieving, and understanding Reroute events in Pathfinder Release 1.

A Reroute is the structured result of recalculating the Route after a confirmed change in user circumstances, Plan state, verified Rules, or completed work.

## Design Principles

- Reroute compares immutable Route Versions.
- Reroute is triggered only by confirmed routing-relevant changes.
- Proposed Facts never trigger Reroute.
- Route differences are computed from structured data, not generated prose.
- Every Reroute explains what changed, why it changed, what moved, what became blocked, and what became available.
- Reroute does not expose Dependency Graph internals as a required client model.

## Resources

- Reroute Event
- Route Difference
- Trigger Reference
- Moved Action
- Newly Blocked Action
- Newly Available Action
- Completed Action
- Removed Action

## Valid Reroute Triggers

Supported trigger types:

- `FACT_CONFIRMED`
- `FACT_SUPERSEDED`
- `FACT_EXPIRED`
- `ACTION_COMPLETED`
- `ACTION_FAILED`
- `DEADLINE_CHANGED`
- `CONSTRAINT_CHANGED`
- `OBLIGATION_CHANGED`
- `BLOCKER_ADDED`
- `BLOCKER_REMOVED`
- `GOAL_PRIORITY_CHANGED`
- `VERIFIED_RULE_CHANGED`

Proposed Fact creation, rejection, or editing does not trigger a Reroute.

## Endpoints

### Get Latest Reroute

`GET /v1/reroutes/latest`

Returns the latest Reroute Event for the authenticated user.

### Get Reroute Event

`GET /v1/reroutes/{rerouteEventId}`

Returns a specific immutable Reroute Event.

### List Reroute Events

`GET /v1/reroutes`

Supports filters:

- `trigger_type`
- `created_after`
- `created_before`
- `previous_route_version_id`
- `new_route_version_id`

Results are paginated.

### Request Route Recalculation

`POST /v1/reroutes`

Requests recalculation after an approved routing-relevant change.

Required fields:

- `trigger_type`
- `trigger_reference`
- `expected_current_route_version_id`
- `idempotency_key`

This endpoint does not accept:

- Action ordering
- Priority overrides
- Client-authored Route Steps
- Graph nodes or edges
- Model-generated ranking values

Response includes:

- `status`
- `reroute` (the immutable Reroute Event representation)
- `idempotent_replay`

### Get Route Difference

`GET /v1/reroutes/{rerouteEventId}/difference`

Returns the structured difference between the previous and new Route Versions.

## Reroute Event Representation

A Reroute Event includes:

- `reroute_event_id`
- `previous_route_version_id`
- `new_route_version_id`
- `trigger_type`
- `trigger_reference`
- `created_at`
- `engine_version`
- `rule_set_version`
- `difference_summary`
- `explanation`

## Route Difference Contract

A Route Difference includes:

- `focus_action_changed`
- `previous_focus_action`
- `new_focus_action`
- `added_actions`
- `moved_actions`
- `newly_blocked_actions`
- `newly_available_actions`
- `completed_actions`
- `removed_actions`
- `deadline_changes`
- `obligation_changes`
- `constraint_changes`
- `is_meaningful`

Action references use `action_id`, `title`, and deterministic `reason_codes`.
The authenticated user's identifier is intentionally omitted from the response.

### Moved Action

Includes:

- `action_id`
- `previous_position`
- `new_position`
- `reason_codes`

### Newly Blocked Action

Includes `action_id`, `title`, and `reason_codes`. Blocker and Requirement
identifiers remain inside the governed routing model; the user-facing Route
provides their plain-language effect without exposing graph topology.

### Newly Available Action

Includes `action_id`, `title`, and `reason_codes`.

### Deadline Change

Includes `action_id`, `title`, `reason_codes`, `previous_deadline`, and
`new_deadline`.

### Obligation Change

Includes `action_id`, `title`, `reason_codes`, `was_mandatory`, and
`is_mandatory`.

### Constraint Change

Includes `action_id`, `title`, `reason_codes`, `added_constraint_ids`, and
`removed_constraint_ids`. These references provide traceability for the
confirmed change without exposing the Dependency Graph as a client model.

## Explanation Contract

Every Reroute explanation must answer:

- What changed?
- Why did it change?
- What moved?
- What became blocked?
- What became available?

The explanation must be derived from:

- immutable Route Versions
- deterministic reason codes
- confirmed trigger data
- Provenance references

Plain-language wording may be AI-assisted but cannot add or remove structured meaning.

Deterministic templates must be available as a fallback.

## Processing Contract

```text
Confirmed Change
      ↓
New Routing Snapshot
      ↓
New GraphVersion
      ↓
Route Engine Evaluation
      ↓
New Route Version
      ↓
Structured Route Difference
      ↓
Reroute Event
```

All persistence must be atomic.

If any step fails, no partial Reroute Event or Route Version is published.

## Concurrency

Reroute requests must use optimistic concurrency.

The client supplies `expected_current_route_version_id`.

If the current Route has changed, the API returns a conflict and does not recalculate from stale assumptions.

## Idempotency

Reroute requests require an idempotency key.

Repeated identical requests return the same Reroute Event.

Conflicting reuse of a key returns `IDEMPOTENCY_CONFLICT`.

## Status Values

Supported processing states:

- `PENDING`
- `COMPLETED`
- `FAILED`

Release 1 should prefer synchronous completion for seeded scenarios where practical, but the API contract supports explicit processing state.

## Error Model

Standard error fields:

- `error_code`
- `message`
- `correlation_id`
- `retryable`
- `field_errors` (optional)

Example error codes:

- `REROUTE_NOT_FOUND`
- `INVALID_TRIGGER_TYPE`
- `TRIGGER_NOT_CONFIRMED`
- `STALE_ROUTE_VERSION`
- `ROUTE_RECALCULATION_FAILED`
- `GRAPH_VALIDATION_FAILED`
- `IDEMPOTENCY_CONFLICT`
- `UNAUTHORIZED`
- `FORBIDDEN`

## Security

All endpoints require:

- authentication
- authorization
- strict user ownership validation
- trigger-reference validation
- audit logging

Cross-user Route Version references must be rejected and logged.

## Privacy

- Return only the minimum change detail required by the Route View.
- Do not expose raw Graph topology.
- Minimize sensitive trigger details in list responses.
- Preserve historical Reroute records according to approved retention rules.

## Observability

Emit structured events for:

- Reroute requested
- Routing snapshot created
- GraphVersion created
- Route Version published
- Route Difference generated
- Reroute completed
- Reroute failed
- stale Route conflict
- cross-user reference attempt
- explanation fallback used

Logs must avoid unnecessary sensitive content.

## Caching

Reroute Events and Route Differences are immutable after successful publication and may be cached.

The latest Reroute endpoint must reflect the newest completed event.

## Acceptance Criteria

The Reroute API is complete when:

1. Only confirmed routing-relevant changes trigger recalculation.
2. Proposed Facts never trigger Reroute.
3. Previous and new Route Versions are immutable and traceable.
4. Route Differences are structured and deterministic.
5. Explanations answer all five required Reroute questions.
6. Stale Route requests are rejected safely.
7. Idempotent requests return stable results.
8. Partial publication cannot occur.
9. Cross-user references are blocked.
10. AI cannot alter Route Difference semantics.
11. API responses use canonical terminology.
12. Automated integration and adversarial tests pass.

## Required Tests

- Confirmed Fact triggers Reroute
- Proposed Fact does not trigger Reroute
- Action completion changes Focus Action
- Transportation Constraint changes Route order
- Obligation conflict creates blocked Action
- Deadline change moves Action earlier
- Housing denial adds Blocker
- Stale Route Version conflict
- Duplicate idempotent request
- Conflicting idempotency key
- Partial persistence failure
- Cross-user Route Version reference
- Explanation service failure uses deterministic fallback
- Identical before/after inputs produce empty Route Difference
- Route Difference preserves deterministic reason codes

## Traceability

Supports:

- api-design-principles.md
- route-api.md
- facts-api.md
- provenance-api.md
- route-engine.md
- dependency-graph.md
- domain-model.md
- ADR-001
- ADR-002
- ADR-004

## Definition of Done

The Reroute API is complete when confirmed changes can produce atomic, immutable, deterministic Reroute Events; every Route Difference is explainable and traceable; stale and cross-user requests are rejected; and all required integration, regression, concurrency, and adversarial tests pass.
