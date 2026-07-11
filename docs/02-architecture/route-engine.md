# Pathfinder Route Engine Specification

**Version:** 1.0\
**Status:** Canonical Architecture Specification\
**Owner:** Architecture\
**Applies To:** Pathfinder Release 1

## 1. Purpose

This document defines the deterministic Route Engine for Pathfinder. It
specifies the engine's inputs, eligibility rules, ranking logic,
tie-breaking behavior, outputs, explanation model, Reroute behavior,
failure handling, and evaluation requirements.

The Route Engine is the sole sequencing authority. Large language models
may assist with interpretation and explanation but may not determine
priority, ordering, eligibility, or Route composition.

## 2. Architectural Position

The Route Engine operates within the locked architecture:

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

The Route Engine owns sequencing.

## 3. Responsibilities

The Route Engine must:

1.  Consume a validated routing snapshot.
2.  Exclude ineligible Actions.
3.  Detect blocked and conflicted Actions.
4.  Rank eligible Actions deterministically.
5.  Select the Focus Action.
6.  Produce an ordered Route.
7.  Generate structured explanation reason codes.
8.  Preserve reproducibility.
9.  support meaningful Reroute comparison.
10. Fail safely when inputs are incomplete or invalid.

The Route Engine must not:

-   confirm Proposed Facts
-   infer legal eligibility
-   create unsupported Requirements
-   generate new domain facts
-   use model prose as a sequencing input
-   optimize for recidivism or personal-risk prediction
-   make hidden decisions that cannot be explained

## 4. Routing Snapshot

The engine consumes an immutable `RoutingSnapshot`.

### Required fields

-   `user_id`
-   `plan_version`
-   `confirmed_fact_ids`
-   `graph_version`
-   `engine_version`
-   `generated_at`
-   `actions`
-   `requirements`
-   `constraints`
-   `obligations`
-   `deadlines`
-   `dependencies`
-   `goals`
-   `user_priorities`

### Snapshot invariants

-   All referenced facts are Confirmed Facts.
-   Every route-affecting fact has Provenance.
-   The Dependency Graph has passed structural validation.
-   Hard prerequisite cycles do not exist.
-   The snapshot is immutable during evaluation.
-   The snapshot hash uniquely identifies the full routing input.

## 5. Routing Pipeline

``` text
Validate Snapshot
      ↓
Determine Action Eligibility
      ↓
Evaluate Blockers and Conflicts
      ↓
Compute Ranking Factors
      ↓
Apply Deterministic Ordering
      ↓
Select Focus Action
      ↓
Build Ordered Route
      ↓
Generate Structured Explanations
      ↓
Publish Immutable Route Version
```

## 6. Snapshot Validation

The engine must reject a snapshot when any of the following is true:

-   a Proposed Fact is referenced
-   required Provenance is missing
-   a referenced node does not exist
-   a hard-dependency cycle exists
-   an Action has contradictory terminal states
-   an Obligation or Deadline lacks a Confirmed Fact source
-   user ownership is inconsistent
-   the engine version is missing
-   the graph version is missing

### Failure response

-   Do not publish a new Route Version.
-   Preserve the last valid Route Version.
-   Record a structured validation failure.
-   Return a safe error state to the application layer.
-   Do not expose internal stack traces to the user.

## 7. Action Eligibility

An Action is `ELIGIBLE` when all of the following are true:

1.  The Action is active.
2.  The Action is not completed or cancelled.
3.  All hard Requirements are satisfied or explicitly waived.
4.  No active hard Blocker prevents execution.
5.  No active Constraint makes the Action impossible at the current
    time.
6.  The Action does not conflict with a higher-priority mandatory
    Obligation.
7.  The Action is supported by the current Plan version.
8.  The Action belongs to the current user.

An Action is `BLOCKED` when one or more hard Requirements, Blockers,
Constraints, or Obligations prevent execution.

An Action is `UPCOMING` when it is not currently eligible but is
reachable after one or more predecessor Actions.

An Action is `COMPLETED` when confirmed completion evidence or explicit
user confirmation satisfies the completion rule.

## 8. Hard and Soft Conditions

### Hard conditions

Hard conditions determine eligibility.

Examples:

-   required identification is missing
-   mandatory appointment conflict
-   action location is unreachable under the current transportation
    Constraint
-   prerequisite document is unavailable
-   deadline has passed and the Action is no longer valid

### Soft conditions

Soft conditions influence ranking but do not make an Action ineligible.

Examples:

-   user preference
-   estimated effort
-   deadline proximity
-   number of downstream Unlocks
-   alignment with a high-priority Goal
-   reduction of future Blockers

The distinction between hard and soft conditions must be explicit in
rules and tests.

## 9. Ranking Factors

The Route Engine ranks eligible Actions using deterministic factors.

### 9.1 Required factors

-   `deadline_urgency`
-   `hard_prerequisite_value`
-   `unlock_value`
-   `blocker_reduction`
-   `goal_alignment`
-   `user_priority`
-   `conflict_avoidance`
-   `effort_cost`

### 9.2 Factor definitions

#### Deadline urgency

Measures the time sensitivity of the Action or its dependent Goal.

Inputs may include:

-   time remaining
-   Deadline severity
-   consequence of missing the Deadline
-   whether the Deadline is externally fixed

#### Hard prerequisite value

Measures whether completing the Action satisfies a hard Requirement for
downstream Actions.

#### Unlock value

Measures the number and importance of Actions or Goals made available by
completing the Action.

#### Blocker reduction

Measures how many active Blockers are removed or reduced.

#### Goal alignment

Measures alignment with user-selected Goal priorities.

#### User priority

Represents explicit user preference. User priority influences ranking
but cannot override hard safety or feasibility constraints.

#### Conflict avoidance

Rewards Actions that reduce scheduling or obligation conflicts.

#### Effort cost

Represents time, cost, travel burden, and complexity. Lower effort may
improve ranking when higher-value factors are otherwise comparable.

## 10. Ranking Model

Release 1 should use a lexicographic ranking model rather than an opaque
weighted model.

### Default priority order

1.  Critical deadline protection
2.  Mandatory obligation protection
3.  Hard prerequisite completion
4.  High unlock value
5.  Blocker reduction
6.  User-prioritized Goal alignment
7.  Conflict avoidance
8.  Lower effort
9.  Stable tie-breaker

### Rationale

Lexicographic ordering is preferred in Release 1 because it is:

-   easier to explain
-   easier to test
-   less vulnerable to hidden interactions
-   more stable across scenarios
-   simpler to audit
-   consistent with "Deterministic Where It Matters"

A weighted model may be considered later only through an approved ADR
and Product Decision.

## 11. Reference Ranking Tuple

Each eligible Action receives a deterministic ranking tuple:

``` text
(
  critical_deadline_rank,
  mandatory_obligation_rank,
  hard_prerequisite_rank,
  unlock_rank,
  blocker_reduction_rank,
  goal_alignment_rank,
  conflict_avoidance_rank,
  effort_rank,
  stable_action_id
)
```

The engine sorts using this tuple in documented order.

The final `stable_action_id` prevents nondeterministic ordering when all
other factors are equal.

## 12. Tie-Breaking

Tie-breaking must be deterministic.

### Tie-break order

1.  Earlier fixed Deadline
2.  Greater number of hard prerequisites satisfied downstream
3.  Greater Unlock value
4.  Higher user-priority Goal
5.  Lower effort
6.  Earlier Action creation timestamp
7.  Stable Action identifier

The engine must never use random selection.

## 13. Focus Action Selection

The Focus Action is the highest-ranked eligible Action.

### Invariants

-   Exactly one Focus Action exists when at least one eligible Action
    exists.
-   No Focus Action exists when all remaining Actions are blocked or
    completed.
-   The Focus Action must be present in the Route.
-   The Focus Action must include a structured explanation.
-   The Focus Action cannot be selected from Proposed Facts.

## 14. Ordered Route Construction

The Route contains:

-   one Focus Action
-   additional eligible Actions in ranked order
-   reachable upcoming Actions
-   blocked Actions with blocker summaries
-   completed Actions where needed for continuity

The Route is complete even when the Adaptive Route View exposes only a
subset.

The Route Engine does not enforce a fixed number of visible Actions.

## 15. Explanation Model

Every Route Step must include deterministic reason codes.

### Supported reason codes

-   `CRITICAL_DEADLINE`
-   `MANDATORY_OBLIGATION`
-   `HARD_PREREQUISITE`
-   `HIGH_UNLOCK_VALUE`
-   `BLOCKER_REMOVAL`
-   `USER_PRIORITY`
-   `CONFLICT_AVOIDANCE`
-   `LOWER_EFFORT`
-   `ONLY_ELIGIBLE_ACTION`
-   `STABLE_TIE_BREAK`

### Explanation requirements

The explanation must answer:

**Why it comes next.**

It should identify:

-   the decisive factor
-   supporting factors
-   what the Action unlocks
-   what Deadline or Obligation influenced placement
-   what Provenance supports route-affecting facts

### AI boundary

A language model may transform reason codes and structured data into
plain language.

The model may not:

-   add new reasons
-   alter ordering
-   omit critical factors
-   invent facts
-   change Provenance
-   imply legal eligibility

If model explanation generation fails, the system must fall back to
deterministic templates.

## 16. Deterministic Explanation Templates

Examples:

### Hard prerequisite

> This comes next because it is required before you can complete
> \[downstream Action\].

### Deadline

> This comes next because the confirmed deadline is \[date\], and
> delaying it could block \[Goal or Action\].

### Unlock value

> This comes next because completing it makes \[number\] additional
> Actions available.

### Conflict avoidance

> This comes next because it avoids a conflict with your confirmed
> \[Obligation\].

Templates must be understandable without exposing internal scoring
mechanics.

## 17. Reroute Triggers

A Reroute occurs when a routing-relevant confirmed state changes.

### Valid triggers

-   Confirmed Fact added
-   Confirmed Fact superseded
-   Action completed
-   Action failed
-   Deadline changed
-   Constraint changed
-   Obligation changed
-   Blocker added or removed
-   Goal priority changed by the user
-   verified Rule changed

Proposed Fact changes do not trigger a Reroute.

## 18. Reroute Process

``` text
Previous Routing Snapshot
          +
Confirmed Change
          ↓
New Routing Snapshot
          ↓
Route Engine Evaluation
          ↓
New Route Version
          ↓
Route Difference
          ↓
Reroute Explanation
```

## 19. Route Difference Model

The engine compares two immutable Route Versions.

### Required output

-   `focus_action_changed`
-   `moved_actions`
-   `newly_blocked_actions`
-   `newly_available_actions`
-   `removed_actions`
-   `completed_actions`
-   `deadline_changes`
-   `trigger_reference`

### Reroute explanation

The system must explain:

-   what changed
-   why it changed
-   what moved
-   what became blocked
-   what became available

The difference engine must compare structured Route data, not generated
prose.

## 20. Blocked Route State

When no eligible Action exists but incomplete Goals remain, the Route
enters a blocked state.

### Required blocked-state output

-   active Blockers
-   unmet Requirements
-   affected Goals
-   next resolvable condition, if known
-   Provenance references
-   safe user-facing explanation

The engine must not fabricate a next Action to avoid an empty Route.

## 21. Empty Route State

An empty Route may occur when:

-   all Goals are achieved
-   all Actions are completed
-   no active Plan exists
-   the Plan has not yet produced Confirmed Facts

The application layer must distinguish between:

-   successful completion
-   incomplete intake
-   fully blocked state
-   system failure

## 22. Rule Versioning

Every published Route Version must record:

-   `engine_version`
-   `rule_set_version`
-   `graph_version`
-   `input_snapshot_hash`

Changes to routing logic require:

-   automated regression tests
-   version increment
-   ADR when architectural behavior changes
-   Product Decision when user-visible prioritization behavior changes

## 23. Reproducibility

For identical:

-   Confirmed Facts
-   Plan version
-   Dependency Graph
-   engine version
-   rule set version

the Route Engine must produce an identical:

-   Focus Action
-   Action order
-   blocked-state classification
-   explanation reason-code set
-   Route difference output

Plain-language explanation wording may vary only if model-assisted
generation is enabled, but structured explanation content must remain
identical.

## 24. Safety Constraints

The Route Engine must never:

-   sequence based on protected-class inference
-   predict recidivism
-   assign personal-risk scores
-   make legal conclusions
-   activate unconfirmed document extraction
-   prioritize institutional monitoring over user goals
-   hide the basis for critical sequencing
-   accept an LLM-generated numeric priority as authoritative

## 25. Failure Modes

### Invalid graph

**Response:** Reject evaluation and preserve the last valid Route.

### Missing Provenance

**Response:** Exclude the affected fact and fail validation when
required for routing.

### Conflicting mandatory Obligations

**Response:** Mark the conflict explicitly and apply documented conflict
rules. If unresolved, enter a blocked state.

### No eligible Actions

**Response:** Return a blocked or completed state; do not invent an
Action.

### Explanation service failure

**Response:** Use deterministic templates.

### Rule-set mismatch

**Response:** Refuse publication and log a version compatibility error.

### Partial persistence failure

**Response:** Publish no new Route Version. Route publication must be
atomic.

## 26. Performance Requirements

Release 1 targets:

-   Route evaluation completes within 500 ms for seeded demonstration
    scenarios under normal local conditions.
-   Reroute comparison completes within 250 ms after Route generation.
-   The engine supports at least 500 graph nodes and 2,000 edges per
    user Plan without correctness degradation.
-   Performance optimization must not weaken determinism or
    explainability.

These targets are engineering objectives, not product identity.

## 27. Observability

The engine should emit structured events for:

-   evaluation started
-   validation failed
-   evaluation completed
-   Route Version published
-   Reroute completed
-   blocked Route returned
-   explanation fallback used

Logs must not expose unnecessary sensitive user data.

## 28. Testing Strategy

### 28.1 Unit tests

-   eligibility rules
-   hard versus soft conditions
-   ranking factor calculations
-   lexicographic ordering
-   tie-breaking
-   blocked-state classification
-   reason-code generation
-   Route difference logic

### 28.2 Golden fixture tests

Each fixture contains:

-   Confirmed Facts
-   Plan
-   Dependency Graph
-   expected Focus Action
-   expected Route order
-   expected reason codes
-   expected blocked states

Golden fixtures must fail when routing behavior changes unexpectedly.

### 28.3 Metamorphic tests

Examples:

-   Adding an unrelated Confirmed Fact does not change the Route.
-   Reordering input records does not change the Route.
-   Re-running the same snapshot produces the same Route.
-   A Proposed Fact never changes the Route.
-   Completing the Focus Action produces an expected Reroute.

### 28.4 Adversarial tests

-   cyclic dependencies
-   contradictory deadlines
-   missing Provenance
-   cross-user node references
-   LLM-supplied priority injection
-   extreme graph size
-   duplicate Actions
-   timestamp ties
-   invalid rule-set version

### 28.5 Scenario tests

At minimum:

1.  Identification prerequisite unlocks employment onboarding.
2.  Transportation loss changes an employment Route.
3.  Supervision Obligation conflicts with a work schedule.
4.  Housing denial creates a new Blocker.
5.  Completed Action changes the Focus Action.
6.  Unconfirmed document extraction has no routing effect.
7.  Changed Deadline causes a meaningful Reroute.

## 29. Acceptance Criteria

The Route Engine is complete for Release 1 when:

1.  Identical routing snapshots produce identical Routes.
2.  Proposed Facts never affect routing.
3.  All eligible Actions are ranked deterministically.
4.  Hard prerequisites are enforced.
5.  The Focus Action is uniquely selected.
6.  Every active Route Step has structured reason codes.
7.  Plain-language explanations answer "Why it comes next."
8.  Meaningful changes produce a structured Route difference.
9.  Blocked and completed states are distinguishable.
10. Route publication is atomic and versioned.
11. Golden, metamorphic, integration, and adversarial tests pass.
12. No AI component can override sequence or priority.

## 30. Traceability

This specification implements:

-   `vision-lock.md`
-   `glossary.md`
-   `product-principles.md`
-   `release-1.md`
-   `prd.md`
-   `system-overview.md`
-   `domain-model.md`

Companion specifications:

-   `dependency-graph.md`
-   `ai-boundaries.md`
-   `provenance.md`

## 31. Definition of Done

The Route Engine is done when:

-   the ranking model is implemented exactly as documented
-   rule versions are recorded
-   deterministic fixtures pass
-   Route Versions are reproducible
-   Reroute differences are correct
-   explanation reason codes are complete
-   deterministic explanation fallbacks exist
-   failure modes preserve the last valid Route
-   security and user-isolation tests pass
-   no competing sequencing mechanism exists
