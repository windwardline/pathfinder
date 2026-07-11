# Pathfinder Domain Model

**Version:** 1.0\
**Status:** Canonical Architecture Specification\
**Owner:** Architecture\
**Applies To:** Pathfinder Release 1

## 1. Purpose

This document defines the canonical domain model for Pathfinder. It
specifies the core entities, value objects, relationships, invariants,
lifecycle states, and ownership boundaries required to implement the
Route-first product architecture.

This document is authoritative for domain semantics. Product definitions
remain governed by the Vision Lock and Glossary. Architectural changes
require an Architecture Decision Record (ADR). Product behavior changes
additionally require a Product Decision.

## 2. Architectural Context

Pathfinder follows the locked architecture:

``` text
Confirmed Facts
      ↓
Dependency Graph
      ↓
Route Engine
      ↓
Route
      ↓
Adaptive Route View
```

The Dependency Graph is infrastructure.

The Route is the product.

The Route Engine is the sole sequencing authority.

Only Confirmed Facts may influence Route generation.

## 3. Domain Boundaries

The Release 1 domain is divided into five bounded contexts:

1.  **Identity and Access**
2.  **Fact and Provenance**
3.  **Planning**
4.  **Routing**
5.  **Presentation**

### 3.1 Identity and Access

Responsible for users, authentication, authorization, data ownership,
and user isolation.

### 3.2 Fact and Provenance

Responsible for Proposed Facts, Confirmed Facts, source references,
confirmation state, and correction history.

### 3.3 Planning

Responsible for Goals, Actions, Requirements, Obligations, Constraints,
Deadlines, Blockers, Unlocks, and Dependencies.

### 3.4 Routing

Responsible for the Dependency Graph, Route Engine inputs, Route
Versions, Route History, and Reroute events.

### 3.5 Presentation

Responsible for the Adaptive Route View, Today, Focus Action, and
user-facing explanations.

## 4. Aggregate Model

The principal aggregate roots are:

-   `User`
-   `FactRecord`
-   `Plan`
-   `Route`
-   `RouteHistory`

The `Plan` aggregate owns the user's active planning domain. The `Route`
aggregate is generated from a validated snapshot of the `Plan` and
Confirmed Facts.

## 5. Core Entities

## 5.1 User

Represents the person whose Route is being generated.

### Required fields

-   `user_id`
-   `created_at`
-   `status`
-   `locale`
-   `time_zone`

### Invariants

-   Every route-affecting record belongs to exactly one user.
-   A user cannot access another user's facts, plans, documents, or
    routes.
-   Organization access is not supported in Release 1.
-   Data sharing is explicit and user-controlled.

## 5.2 FactRecord

Represents a claim about the user's circumstances.

A FactRecord begins as a Proposed Fact and may transition to a Confirmed
Fact.

### Required fields

-   `fact_id`
-   `user_id`
-   `fact_type`
-   `value`
-   `status`
-   `provenance_id`
-   `created_at`
-   `updated_at`

### Optional fields

-   `confirmed_at`
-   `confirmed_by`
-   `supersedes_fact_id`
-   `expires_at`
-   `confidence_note`

### Allowed states

``` text
PROPOSED
CONFIRMED
REJECTED
SUPERSEDED
EXPIRED
```

### State transitions

``` text
PROPOSED → CONFIRMED
PROPOSED → REJECTED
CONFIRMED → SUPERSEDED
CONFIRMED → EXPIRED
```

### Invariants

-   Only `CONFIRMED` facts may influence the Dependency Graph or Route
    Engine.
-   Every FactRecord must have Provenance.
-   Fact confirmation must be attributable.
-   A superseding fact must preserve the historical record.
-   Rejected facts remain auditable but never affect routing.

## 5.3 Provenance

Represents the origin of a fact or rule.

### Provenance types

-   `USER_ENTRY`
-   `DOCUMENT_EXTRACTION`
-   `VERIFIED_RULE`
-   `SYSTEM_DERIVATION`
-   `USER_CORRECTION`

### Required fields

-   `provenance_id`
-   `user_id`
-   `source_type`
-   `source_reference`
-   `created_at`

### Optional fields

-   `document_id`
-   `page_number`
-   `section_reference`
-   `rule_id`
-   `extraction_metadata`
-   `entered_by`

### Invariants

-   Every route-affecting fact has exactly one active provenance record.
-   Provenance cannot be deleted while referenced by an active Route
    Version.
-   Source references must remain understandable without model-generated
    prose.
-   Document extraction alone does not create a Confirmed Fact.

## 5.4 Goal

Represents an outcome the user is trying to achieve.

### Examples

-   Obtain identification
-   Begin employment
-   Secure housing
-   Maintain supervision compliance

### Required fields

-   `goal_id`
-   `plan_id`
-   `title`
-   `status`
-   `priority`
-   `created_at`

### Allowed states

-   `ACTIVE`
-   `ACHIEVED`
-   `PAUSED`
-   `ABANDONED`

### Invariants

-   Each Goal belongs to one Plan.
-   Goal priority is user-controlled input, not an LLM decision.
-   A Goal may depend on multiple Actions and Requirements.

## 5.5 Action

Represents a concrete step that may appear in the Route.

### Required fields

-   `action_id`
-   `plan_id`
-   `title`
-   `status`
-   `action_type`
-   `effort_estimate`
-   `created_at`

### Allowed states

-   `AVAILABLE`
-   `BLOCKED`
-   `IN_PROGRESS`
-   `COMPLETED`
-   `CANCELLED`

### Optional fields

-   `due_at`
-   `location`
-   `estimated_duration`
-   `cost_estimate`
-   `completion_evidence`

### Invariants

-   An Action may appear in the Route only when its hard Requirements
    are satisfied.
-   A completed Action remains in Route History.
-   An Action cannot be both `AVAILABLE` and `BLOCKED`.
-   Action status is determined by deterministic domain rules and
    confirmed state.

## 5.6 Requirement

Represents a prerequisite that must be satisfied before another entity
can progress.

### Required fields

-   `requirement_id`
-   `plan_id`
-   `description`
-   `requirement_type`
-   `status`

### Allowed states

-   `UNSATISFIED`
-   `SATISFIED`
-   `WAIVED`
-   `UNKNOWN`

### Invariants

-   `UNKNOWN` Requirements block critical sequencing unless a documented
    rule permits otherwise.
-   A Requirement may be satisfied by a FactRecord, Action, or verified
    Rule.
-   Requirement satisfaction must be explainable and traceable.

## 5.7 Obligation

Represents a mandatory commitment.

### Examples

-   Supervision appointment
-   Employment shift
-   Court-ordered payment
-   Mandatory orientation

### Required fields

-   `obligation_id`
-   `plan_id`
-   `title`
-   `status`
-   `start_at`
-   `source_fact_id`

### Invariants

-   Obligations derive from Confirmed Facts.
-   Conflicting Actions must be detected deterministically.
-   High-impact obligations must preserve provenance.

## 5.8 Constraint

Represents a limiting condition that affects available options.

### Constraint types

-   `TIME`
-   `TRANSPORTATION`
-   `FINANCIAL`
-   `LOCATION`
-   `AVAILABILITY`
-   `ACCESSIBILITY`
-   `POLICY`

### Required fields

-   `constraint_id`
-   `plan_id`
-   `constraint_type`
-   `value`
-   `status`
-   `source_fact_id`

### Invariants

-   Active Constraints affect Route feasibility.
-   Inactive or superseded Constraints cannot affect current Route
    generation.
-   Constraints must be grounded in Confirmed Facts or verified Rules.

## 5.9 Deadline

Represents a time-sensitive boundary.

### Required fields

-   `deadline_id`
-   `plan_id`
-   `title`
-   `due_at`
-   `severity`
-   `source_fact_id`

### Severity levels

-   `LOW`
-   `MODERATE`
-   `HIGH`
-   `CRITICAL`

### Invariants

-   High-impact deadlines require Confirmed Facts.
-   Deadlines influence sequencing deterministically.
-   Missed deadlines trigger Route recalculation when relevant.

## 5.10 Blocker

Represents a condition preventing an Action or Goal from progressing.

### Required fields

-   `blocker_id`
-   `plan_id`
-   `target_id`
-   `reason`
-   `source_type`
-   `active`

### Invariants

-   Every active Blocker must identify the blocked target.
-   Blockers must be explainable.
-   Removing a Blocker may trigger a Reroute.

## 5.11 Unlock

Represents progress made possible by completing an Action.

### Required fields

-   `unlock_id`
-   `source_action_id`
-   `target_id`
-   `unlock_type`

### Invariants

-   Unlock relationships must be explicit in the Dependency Graph.
-   Unlock value is computed deterministically.
-   An Unlock cannot imply unsupported eligibility or legal conclusions.

## 5.12 Dependency

Represents a typed relationship between two domain nodes.

### Supported relationship types

-   `REQUIRES`
-   `BLOCKS`
-   `UNLOCKS`
-   `SUPPORTS`
-   `CONFLICTS_WITH`
-   `SATISFIES`

### Required fields

-   `dependency_id`
-   `plan_id`
-   `source_node_id`
-   `target_node_id`
-   `relationship_type`
-   `active`

### Invariants

-   Dependencies must connect valid node types.
-   Hard prerequisite cycles are invalid.
-   Conflicts must be symmetric at evaluation time.
-   Dependency evaluation cannot depend on model-generated prose.

## 5.13 Plan

The aggregate representing the user's current structured planning state.

### Contains

-   Goals
-   Actions
-   Requirements
-   Obligations
-   Constraints
-   Deadlines
-   Blockers
-   Unlocks
-   Dependencies

### Required fields

-   `plan_id`
-   `user_id`
-   `version`
-   `status`
-   `created_at`
-   `updated_at`

### Invariants

-   A Plan belongs to exactly one user.
-   A Plan version is immutable after Route generation.
-   Every Route is generated from one specific Plan version.
-   Mutations create a new Plan version or a new routing snapshot.

## 5.14 Dependency Graph

The internal graph representation of the Plan.

### Node categories

-   Goal
-   Action
-   Requirement
-   Obligation
-   Constraint
-   Deadline
-   Blocker
-   Confirmed Fact
-   Verified Rule

### Edge categories

-   Requires
-   Blocks
-   Unlocks
-   Supports
-   Conflicts With
-   Satisfies

### Invariants

-   The graph is derived only from Confirmed Facts and verified Rules.
-   The graph is not directly editable by the user.
-   Graph generation is deterministic for the same inputs.
-   The graph must reject invalid hard-dependency cycles.
-   Graph changes must be traceable to input changes.

## 5.15 Route

The primary product artifact generated by the Route Engine.

### Required fields

-   `route_id`
-   `user_id`
-   `plan_version`
-   `route_version`
-   `status`
-   `generated_at`
-   `engine_version`

### Contains

-   Ordered Route Steps
-   Focus Action
-   Explanation references
-   Blocked state summary
-   Route change summary

### Invariants

-   A Route is reproducible from the same inputs and engine version.
-   Every Route Step references an Action.
-   Every Route Step includes an explanation source.
-   The Route cannot include an Action with unmet hard Requirements.
-   The Route is immutable after publication.

## 5.16 RouteStep

Represents an ordered Action within a Route.

### Required fields

-   `route_step_id`
-   `route_id`
-   `action_id`
-   `position`
-   `state`
-   `explanation_id`

### Step states

-   `FOCUS`
-   `UPCOMING`
-   `BLOCKED`
-   `COMPLETED`

### Invariants

-   Exactly one active Focus Action exists when an actionable Route
    exists.
-   Positions are unique within a Route Version.
-   Blocked steps identify blocking dependencies.

## 5.17 Explanation

Represents the rationale for why an Action comes next.

### Required fields

-   `explanation_id`
-   `route_step_id`
-   `reason_codes`
-   `provenance_references`
-   `plain_language_text`

### Reason code examples

-   `HARD_PREREQUISITE`
-   `DEADLINE_PROXIMITY`
-   `HIGH_UNLOCK_VALUE`
-   `USER_PRIORITY`
-   `CONFLICT_AVOIDANCE`
-   `BLOCKER_REMOVAL`

### Invariants

-   Plain-language text may be model-assisted.
-   Reason codes and sequencing basis are deterministic.
-   Explanations must answer: **Why it comes next.**
-   Explanation text cannot introduce new facts.

## 5.18 RouteVersion

An immutable snapshot of a Route.

### Required fields

-   `route_version_id`
-   `route_id`
-   `version_number`
-   `input_snapshot_hash`
-   `engine_version`
-   `created_at`

### Invariants

-   Route Versions are immutable.
-   Input snapshot hash must identify the exact Confirmed Facts and Plan
    version.
-   Route Versions support reproducibility and auditability.

## 5.19 RouteHistory

The chronological record of Route Versions.

### Invariants

-   History is append-only.
-   Deleted user data must follow approved retention and deletion
    policy.
-   Route History must not expose data across users.

## 5.20 RerouteEvent

Represents a meaningful change between two Route Versions.

### Required fields

-   `reroute_event_id`
-   `previous_route_version_id`
-   `new_route_version_id`
-   `trigger_type`
-   `trigger_reference`
-   `change_summary`

### Trigger types

-   `FACT_CONFIRMED`
-   `FACT_SUPERSEDED`
-   `ACTION_COMPLETED`
-   `ACTION_FAILED`
-   `DEADLINE_CHANGED`
-   `CONSTRAINT_CHANGED`
-   `OBLIGATION_CHANGED`

### Invariants

-   A RerouteEvent compares immutable Route Versions.
-   It must explain:
    -   what changed
    -   why it changed
    -   what moved
    -   what became blocked
    -   what became available
-   The summary cannot invent facts or causal relationships.

## 6. Relationship Matrix

  Source          Relationship               Target            Allowed
  --------------- -------------------------- ----------------- -------------------------------
  Action          REQUIRES                   Requirement       Yes
  Requirement     SATISFIES                  Action            No; inverse semantics invalid
  Fact            SATISFIES                  Requirement       Yes
  Action          UNLOCKS                    Action            Yes
  Action          SUPPORTS                   Goal              Yes
  Constraint      BLOCKS                     Action            Yes
  Obligation      CONFLICTS_WITH             Action            Yes
  Deadline        SUPPORTS                   Action priority   Through Route Engine only
  Goal            REQUIRES                   Action            Yes
  Proposed Fact   any route-affecting edge   any               No

## 7. Domain Invariants

The following invariants are non-negotiable:

1.  Only Confirmed Facts affect the Route.
2.  Every route-affecting fact has Provenance.
3.  The Route Engine owns sequencing.
4.  LLM output cannot directly change domain state.
5.  Hard prerequisite cycles are invalid.
6.  Route Versions are immutable.
7.  Identical inputs and engine version produce identical Routes.
8.  Every active Route Step is explainable.
9.  User data is strictly isolated.
10. No domain entity may encode predictive risk scoring or recidivism
    prediction.

## 8. Lifecycle Example

``` text
Document Uploaded
      ↓
Proposed Fact Created
      ↓
User Confirms Fact
      ↓
Confirmed Fact Added
      ↓
Plan Version Updated
      ↓
Dependency Graph Rebuilt
      ↓
Route Engine Executes
      ↓
New Route Version Published
      ↓
Reroute Event Recorded
```

## 9. Failure Modes

### Unconfirmed information

**Response:** Exclude from routing and show confirmation required.

### Invalid dependency cycle

**Response:** Reject graph publication, log validation error, and
surface a safe administrative error state.

### Missing provenance

**Response:** Prevent fact activation and block Route generation if the
fact is required.

### Conflicting obligations

**Response:** Preserve the conflict, mark affected Actions, and let the
Route Engine resolve ordering using deterministic rules.

### Route Engine failure

**Response:** Preserve the last valid Route Version and display a
non-destructive error state.

### Model-generated unsupported claim

**Response:** Reject the output before domain persistence.

## 10. Data Ownership

-   Users own their data.
-   Each aggregate must include `user_id` or inherit ownership through
    an aggregate root.
-   Cross-user joins are forbidden outside explicitly authorized system
    operations.
-   Organization tenancy is out of scope for Release 1.
-   Data export and deletion must preserve applicable audit requirements
    without retaining unnecessary personal data.

## 11. Testing Requirements

### Unit tests

-   State transitions
-   Invariant enforcement
-   Dependency validation
-   Route reproducibility
-   Explanation reason-code mapping

### Integration tests

-   Proposed Fact confirmation flow
-   Graph generation from Confirmed Facts
-   Route generation
-   Reroute after meaningful change
-   User isolation
-   Provenance persistence

### Adversarial tests

-   Unconfirmed fact injection
-   Cross-user access attempts
-   Cyclic dependencies
-   Unsupported edge types
-   LLM output attempting to set priority
-   Missing provenance
-   Contradictory obligations

## 12. Traceability

This specification implements:

-   `vision-lock.md`
-   `glossary.md`
-   `product-principles.md`
-   `release-1.md`
-   `prd.md`
-   `system-overview.md`

Companion architecture documents:

-   `route-engine.md`
-   `dependency-graph.md`
-   `ai-boundaries.md`
-   `provenance.md`

## 13. Definition of Done

This domain model is implemented when:

-   All aggregate roots and entities are represented in code.
-   State transitions are validated.
-   Domain invariants are enforced at service and persistence
    boundaries.
-   Routing ignores Proposed Facts.
-   Provenance is required for route-affecting facts.
-   Route Versions are immutable and reproducible.
-   Reroute Events correctly describe Route changes.
-   Automated tests cover normal, error, empty, and adversarial states.
-   No implementation introduces competing terminology.
