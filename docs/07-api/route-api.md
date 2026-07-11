
# Route API Specification

**Version:** 1.0  
**Status:** Canonical API Specification

## Purpose

This specification defines the external API contract for retrieving and understanding a user's Route. The Route is the primary product artifact exposed by Pathfinder.

## Design Principles

- The Route is the primary API resource.
- APIs expose Route behavior, not Dependency Graph internals.
- Responses are deterministic for identical Route Versions.
- Only published Route Versions are returned.
- Explanations are derived from deterministic reason codes.

## Resources

- Route
- Route Version
- Focus Action
- Route Step
- Explanation
- Reroute Reference

## Endpoints

### Get Current Route

`GET /v1/routes/current`

Returns the latest published Route for the authenticated user.

### Get Route Version

`GET /v1/routes/{routeVersionId}`

Returns a specific immutable Route Version.

### List Route Versions

`GET /v1/routes`

Returns paginated Route Version summaries.

## Route Representation

A Route contains:

- route_id
- route_version_id
- engine_version
- rule_set_version
- graph_version
- generated_at
- focus_action
- ordered_steps
- route_status
- explanation_summary

## Focus Action

Exactly one Focus Action exists when at least one Action is eligible.

The Focus Action includes:

- action_id
- title
- status
- explanation
- reason_codes
- unlock_summary

## Route Step

Each Route Step includes:

- sequence
- action_id
- state
- explanation
- reason_codes
- blockers (if applicable)

## Explanation Contract

Every explanation answers:

- Why it comes next.
- What it unlocks.
- Which confirmed conditions influenced sequencing.

Plain-language text must never contradict structured reason codes.

## Status Values

Supported Route states:

- ACTIVE
- BLOCKED
- COMPLETED

## Error Responses

Standard error object:

- error_code
- message
- correlation_id
- retryable

Example conditions:

- Route not found
- Unauthorized
- Forbidden
- Validation failure
- Internal error

## Security

All endpoints require:

- authentication
- authorization
- ownership validation

Clients cannot modify Route Versions through this API.

## Caching

Published Route Versions are immutable and cacheable.

The current Route endpoint may return a newer Route Version after a successful Reroute.

## Acceptance Criteria

- Only published Route Versions are returned.
- Focus Action is deterministic.
- Explanation reason codes are preserved.
- Dependency Graph details are not exposed.
- Responses use canonical terminology.

## Traceability

Supports:

- api-design-principles.md
- route-engine.md
- ADR-001
- ADR-002
- ADR-004

## Definition of Done

The Route API is complete when clients can retrieve immutable Route Versions, understand the current Focus Action, consume deterministic explanations, and remain isolated from internal routing implementation details.
