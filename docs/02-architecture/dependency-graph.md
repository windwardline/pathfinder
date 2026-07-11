# Pathfinder Dependency Graph Specification

**Version:** 1.0\
**Status:** Canonical Architecture Specification\
**Owner:** Architecture\
**Applies To:** Pathfinder Release 1

## 1. Purpose

This document defines the canonical Dependency Graph used by Pathfinder.
It specifies graph structure, node and edge contracts, derivation rules,
validation, lifecycle, versioning, failure handling, and testing.

The Dependency Graph is implementation infrastructure.

The Route is the product.

The graph exists to support deterministic Route generation and
meaningful Reroute behavior. It must not become a competing user-facing
product model or an alternate sequencing authority.

## 2. Architectural Position

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

The graph converts trusted domain state into a deterministic
representation of dependencies, blockers, constraints, obligations,
deadlines, and unlocks.

## 3. Responsibilities

The Dependency Graph must:

1.  Represent route-relevant domain relationships.
2.  Be derived from Confirmed Facts and verified Rules.
3.  Preserve traceability to source entities and Provenance.
4.  Validate structural correctness.
5.  Detect invalid hard-dependency cycles.
6.  Provide stable input to the Route Engine.
7.  Support graph versioning and diffing.
8.  Remain deterministic for identical inputs.

The Dependency Graph must not:

-   determine Route order
-   assign priority
-   select the Focus Action
-   activate Proposed Facts
-   infer unsupported legal conclusions
-   expose hidden institutional monitoring logic
-   depend on model-generated prose
-   become the primary user-facing artifact

## 4. Graph Model

The Release 1 graph is a directed, typed, attributed multigraph.

### Directed

Edges have a source and target.

### Typed

Every node and edge has a documented type.

### Attributed

Nodes and edges may include structured metadata required for routing and
explanation.

### Multigraph

Multiple typed relationships may exist between the same pair of nodes
when semantically valid.

## 5. Graph Identity

Each graph instance is a `GraphVersion`.

### Required fields

-   `graph_version_id`
-   `user_id`
-   `plan_version`
-   `version_number`
-   `input_snapshot_hash`
-   `schema_version`
-   `rule_set_version`
-   `created_at`
-   `status`

### Allowed statuses

-   `BUILDING`
-   `VALID`
-   `INVALID`
-   `SUPERSEDED`

### Invariants

-   A published `VALID` GraphVersion is immutable.
-   Each GraphVersion belongs to exactly one user.
-   The input snapshot hash must represent all Confirmed Facts, Plan
    data, and verified Rules used to derive the graph.
-   The Route Engine may consume only `VALID` GraphVersions.
-   Graph Versions are append-only for audit and Reroute comparison.

## 6. Node Types

Supported node types are:

-   `CONFIRMED_FACT`
-   `GOAL`
-   `ACTION`
-   `REQUIREMENT`
-   `OBLIGATION`
-   `CONSTRAINT`
-   `DEADLINE`
-   `BLOCKER`
-   `VERIFIED_RULE`

Proposed Facts are never graph nodes.

## 7. Common Node Contract

Every node must include:

-   `node_id`
-   `graph_version_id`
-   `user_id`
-   `node_type`
-   `domain_entity_id`
-   `status`
-   `active`
-   `provenance_references`
-   `created_at`

### Common invariants

-   `domain_entity_id` must reference an existing entity in the current
    Plan or trust layer.
-   `user_id` must match the GraphVersion owner.
-   Route-relevant nodes must preserve Provenance.
-   Inactive or superseded nodes cannot affect current routing.
-   Node labels must use canonical Glossary terminology.

## 8. Confirmed Fact Nodes

A Confirmed Fact node represents trusted user state.

### Required attributes

-   `fact_type`
-   `normalized_value`
-   `confirmed_at`
-   `provenance_id`

### Invariants

-   Source FactRecord status must be `CONFIRMED`.
-   A Confirmed Fact node cannot be created from model output alone.
-   Superseded or expired facts are excluded from the active graph
    unless retained for historical comparison.

## 9. Goal Nodes

A Goal node represents a desired outcome.

### Required attributes

-   `title`
-   `goal_status`
-   `user_priority`

### Invariants

-   Priority reflects explicit user choice or approved deterministic
    defaults.
-   AI cannot set Goal priority.
-   Achieved, abandoned, or paused Goals must be represented
    consistently with Plan state.

## 10. Action Nodes

An Action node represents a Route-eligible unit of work.

### Required attributes

-   `title`
-   `action_status`
-   `action_type`
-   `effort_estimate`

### Optional attributes

-   `estimated_duration`
-   `cost_estimate`
-   `location`
-   `availability_window`

### Invariants

-   Actions must be concrete and executable.
-   Actions cannot encode hidden scoring.
-   Action status must match the canonical domain model.
-   Completed or cancelled Actions are not eligible for Focus Action
    selection.

## 11. Requirement Nodes

A Requirement node represents a prerequisite.

### Required attributes

-   `description`
-   `requirement_type`
-   `requirement_status`
-   `hardness`

### Hardness values

-   `HARD`
-   `SOFT`

### Invariants

-   Hard Requirements determine eligibility.
-   Soft Requirements may inform explanation but cannot silently become
    hard conditions.
-   Requirement satisfaction must be traceable.

## 12. Obligation Nodes

An Obligation node represents a mandatory commitment.

### Required attributes

-   `title`
-   `start_at`
-   `end_at`
-   `obligation_status`
-   `source_fact_id`

### Invariants

-   Obligations derive from Confirmed Facts.
-   Mandatory obligations must identify their source.
-   Scheduling conflicts must be represented explicitly.

## 13. Constraint Nodes

A Constraint node represents a limiting condition.

### Required attributes

-   `constraint_type`
-   `normalized_value`
-   `constraint_status`
-   `source_fact_id`

### Invariants

-   Active Constraints influence feasibility.
-   Superseded Constraints are excluded from the active graph.
-   Constraints must not be inferred from stereotypes or protected
    characteristics.

## 14. Deadline Nodes

A Deadline node represents a time-sensitive boundary.

### Required attributes

-   `title`
-   `due_at`
-   `severity`
-   `source_fact_id`

### Invariants

-   High-impact deadlines require Confirmed Facts and Provenance.
-   Deadline severity must come from verified Rules or explicit product
    configuration.
-   The graph represents the Deadline; the Route Engine determines
    sequencing impact.

## 15. Blocker Nodes

A Blocker node represents a condition preventing progress.

### Required attributes

-   `reason_code`
-   `description`
-   `active`
-   `source_reference`

### Invariants

-   Every active Blocker identifies at least one blocked target.
-   Blockers must be explainable.
-   Blockers cannot be created solely to force a preferred Route order.

## 16. Verified Rule Nodes

A Verified Rule node represents a trusted rule used to derive graph
relationships.

### Required attributes

-   `rule_id`
-   `rule_set_version`
-   `jurisdiction`
-   `effective_from`
-   `effective_to`
-   `source_reference`

### Invariants

-   Rules must have documented ownership and source.
-   Expired Rules cannot affect current graph derivation.
-   Rule changes create a new rule-set version and GraphVersion.
-   Verified Rules cannot encode unsupported personalized legal
    conclusions.

## 17. Edge Types

Supported edge types are:

-   `REQUIRES`
-   `BLOCKS`
-   `UNLOCKS`
-   `SUPPORTS`
-   `CONFLICTS_WITH`
-   `SATISFIES`

## 18. Common Edge Contract

Every edge must include:

-   `edge_id`
-   `graph_version_id`
-   `user_id`
-   `source_node_id`
-   `target_node_id`
-   `edge_type`
-   `hardness`
-   `active`
-   `derivation_type`
-   `derivation_reference`
-   `provenance_references`

### Derivation types

-   `DOMAIN_STATE`
-   `VERIFIED_RULE`
-   `USER_CONFIRMED_RELATIONSHIP`
-   `SYSTEM_DERIVATION`

### Invariants

-   Source and target nodes must exist in the same GraphVersion.
-   Source and target must belong to the same user.
-   Edge type must be valid for the source and target node types.
-   Hard edges must have deterministic derivation.
-   LLM prose cannot serve as an edge contract.

## 19. REQUIRES Edge

Represents a prerequisite relationship.

### Valid examples

-   Action `REQUIRES` Requirement
-   Goal `REQUIRES` Action
-   Action `REQUIRES` Action, when one Action must precede another

### Invariants

-   Hard `REQUIRES` edges participate in cycle validation.
-   The Route Engine treats unmet hard Requirements as ineligibility.
-   Soft `REQUIRES` edges cannot block Action eligibility.

## 20. BLOCKS Edge

Represents a condition preventing progress.

### Valid examples

-   Blocker `BLOCKS` Action
-   Constraint `BLOCKS` Action
-   Unsatisfied Requirement `BLOCKS` Action

### Invariants

-   Active hard `BLOCKS` edges make the target Action ineligible.
-   Removing or deactivating a Blocker may trigger Reroute.
-   Block reasons must remain visible to explanation services.

## 21. UNLOCKS Edge

Represents progress made possible by completion.

### Valid examples

-   Action `UNLOCKS` Action
-   Action `UNLOCKS` Goal progress
-   Requirement satisfaction `UNLOCKS` Action

### Invariants

-   Unlock value is measured by the Route Engine.
-   The graph must not assign rank from Unlock relationships.
-   Unsupported eligibility claims are prohibited.

## 22. SUPPORTS Edge

Represents a non-exclusive positive relationship.

### Valid examples

-   Action `SUPPORTS` Goal
-   Confirmed Fact `SUPPORTS` Requirement evaluation
-   Verified Rule `SUPPORTS` a derived relationship

### Invariants

-   `SUPPORTS` does not imply hard dependency.
-   It cannot be used to block an Action.
-   It may contribute to explanation and Goal alignment.

## 23. CONFLICTS_WITH Edge

Represents incompatibility or scheduling conflict.

### Valid examples

-   Obligation `CONFLICTS_WITH` Action
-   Action `CONFLICTS_WITH` Action
-   Constraint `CONFLICTS_WITH` Action

### Invariants

-   Conflict evaluation must be symmetric even if stored as one directed
    edge.
-   The Route Engine determines sequencing consequences.
-   Conflicts must identify the underlying condition.

## 24. SATISFIES Edge

Represents fulfillment of a Requirement.

### Valid examples

-   Confirmed Fact `SATISFIES` Requirement
-   Completed Action `SATISFIES` Requirement
-   Verified Rule plus Confirmed Fact `SATISFIES` Requirement

### Invariants

-   Only trusted state may satisfy a hard Requirement.
-   Proposed Facts cannot create `SATISFIES` edges.
-   Satisfaction must be reversible when the supporting Fact is
    superseded or expires.

## 25. Edge Compatibility Matrix

  Source Node      Edge             Target Node   Release 1
  ---------------- ---------------- ------------- ------------
  Action           REQUIRES         Requirement   Allowed
  Action           REQUIRES         Action        Allowed
  Goal             REQUIRES         Action        Allowed
  Blocker          BLOCKS           Action        Allowed
  Constraint       BLOCKS           Action        Allowed
  Requirement      BLOCKS           Action        Allowed
  Action           UNLOCKS          Action        Allowed
  Action           UNLOCKS          Goal          Allowed
  Action           SUPPORTS         Goal          Allowed
  Confirmed Fact   SUPPORTS         Requirement   Allowed
  Obligation       CONFLICTS_WITH   Action        Allowed
  Action           CONFLICTS_WITH   Action        Allowed
  Confirmed Fact   SATISFIES        Requirement   Allowed
  Action           SATISFIES        Requirement   Allowed
  Proposed Fact    Any              Any           Prohibited

Any unlisted combination requires an ADR before implementation.

## 26. Graph Derivation

Graph derivation converts canonical domain state into a GraphVersion.

### Derivation sequence

``` text
Load Immutable Plan Snapshot
          ↓
Load Confirmed Facts
          ↓
Load Applicable Verified Rules
          ↓
Normalize Domain Entities
          ↓
Create Nodes
          ↓
Derive Typed Edges
          ↓
Validate Structure
          ↓
Compute Graph Hash
          ↓
Publish Valid GraphVersion
```

## 27. Derivation Rules

Derivation must be:

-   deterministic
-   versioned
-   testable
-   explainable
-   independent of model prose

### Rule examples

-   A Confirmed Fact for valid identification may `SATISFY` an
    identification Requirement.
-   A job onboarding Action may `REQUIRE` valid identification.
-   A confirmed supervision appointment may `CONFLICT_WITH` an Action
    scheduled at the same time.
-   A transportation Constraint may `BLOCK` an Action requiring travel
    outside the feasible area.

## 28. AI Boundary

LLMs may assist with:

-   document interpretation
-   candidate fact extraction
-   ambiguity identification
-   plain-language summaries

LLMs may not:

-   publish nodes
-   publish edges
-   determine edge hardness
-   activate Facts
-   resolve cycles
-   assign graph priority
-   create unsupported Rules

All model-derived candidates must pass through schema validation and
user confirmation where applicable.

## 29. Graph Validation

A GraphVersion must pass all validation stages before publication.

### 29.1 Referential validation

-   all node references exist
-   all edges reference existing nodes
-   all domain entity references exist
-   all Provenance references resolve

### 29.2 Ownership validation

-   all nodes and edges belong to the GraphVersion user
-   no cross-user references exist

### 29.3 Type validation

-   node types are recognized
-   edge types are recognized
-   edge compatibility matrix is satisfied
-   attributes conform to schema

### 29.4 State validation

-   Proposed Facts are absent
-   expired or superseded Facts are inactive
-   completed and cancelled Actions are consistent
-   active Blockers have active targets

### 29.5 Structural validation

-   no hard prerequisite cycles
-   no self-referential hard dependency
-   no duplicate active edge with identical semantics
-   no orphan route-relevant node without a valid derivation path

### 29.6 Rule validation

-   applicable Rules are active
-   rule-set version is recorded
-   expired Rules do not derive active edges
-   jurisdiction and effective dates are respected

## 30. Cycle Handling

### Hard prerequisite cycles

A cycle composed entirely of hard `REQUIRES` relationships is invalid.

Example:

``` text
Action A REQUIRES Action B
Action B REQUIRES Action A
```

### Response

-   mark GraphVersion `INVALID`
-   prevent Route Engine evaluation
-   preserve the last valid GraphVersion and Route Version
-   record the cycle path
-   surface a safe administrative error
-   never break the cycle through arbitrary ordering

### Soft cycles

Soft supportive relationships may form cycles when they do not determine
eligibility.

Soft cycles must be documented and excluded from hard prerequisite
traversal.

## 31. Duplicate and Conflicting Edges

### Duplicate edges

Exact duplicate active edges must be deduplicated during derivation or
rejected during validation.

### Conflicting edges

Examples:

-   Action A both `UNLOCKS` and hard `BLOCKS` Action B
-   Requirement marked both satisfied and unsatisfied from equally
    active sources

### Response

-   retain source evidence
-   mark conflict explicitly
-   prevent publication when deterministic resolution is unavailable
-   do not ask an LLM to choose a relationship

## 32. Graph Versioning

A new GraphVersion is required when any route-relevant input changes:

-   Confirmed Fact added
-   Confirmed Fact superseded
-   Action status changed
-   Goal priority changed
-   Constraint changed
-   Obligation changed
-   Deadline changed
-   Blocker added or removed
-   verified Rule changed
-   graph schema changed
-   derivation logic changed

## 33. Graph Diff

Graph diffing supports Reroute explanation and diagnostics.

### Required graph-diff output

-   nodes added
-   nodes removed
-   nodes changed
-   edges added
-   edges removed
-   edge hardness changed
-   changed Provenance references
-   changed Rule references

The Route difference remains the user-facing change model. Graph diff is
infrastructure and diagnostic support.

## 34. Graph Storage

Release 1 may use relational persistence, graph persistence, or an
in-memory graph representation, provided all invariants are preserved.

Technology choice must not change domain semantics.

### Storage requirements

-   immutable published GraphVersions
-   user isolation
-   indexed node and edge lookup
-   efficient prerequisite traversal
-   atomic publication
-   reproducible export for tests
-   schema versioning

A technology-specific storage decision requires an ADR.

## 35. Query Contracts

The Route Engine requires at minimum:

-   get all active Actions
-   get unmet hard Requirements for Action
-   get active Blockers for Action
-   get Conflicts for Action
-   get downstream Unlocks
-   get Goals supported by Action
-   get Deadlines affecting Action
-   get Provenance for route-affecting relationships
-   traverse hard prerequisite ancestry
-   traverse reachable downstream Actions

Queries must return structured data, not generated prose.

## 36. Performance Requirements

Release 1 engineering targets:

-   build and validate a graph of 500 nodes and 2,000 edges within 500
    ms under normal local demonstration conditions
-   retrieve prerequisite ancestry for an Action within 100 ms
-   retrieve downstream Unlocks within 100 ms
-   compute graph diff within 250 ms

Correctness, explainability, and determinism take precedence over
performance optimization.

## 37. Failure Modes

### Missing Provenance

**Response:** Reject the affected node or edge and fail publication if
route-relevant.

### Proposed Fact detected

**Response:** Reject GraphVersion publication.

### Cross-user reference

**Response:** Reject publication, log a security event, and block
request completion.

### Hard cycle

**Response:** Mark GraphVersion invalid and preserve the last valid
Route.

### Unsupported node or edge type

**Response:** Reject schema validation.

### Rule version mismatch

**Response:** Reject publication and require compatible derivation.

### Partial persistence failure

**Response:** Publish no GraphVersion. Publication must be atomic.

## 38. Observability

Emit structured events for:

-   graph build started
-   graph build completed
-   validation passed
-   validation failed
-   hard cycle detected
-   cross-user reference detected
-   GraphVersion published
-   graph diff generated

Logs must minimize sensitive information.

## 39. Security and Privacy

-   Every graph operation enforces user ownership.
-   No graph query may expose another user's nodes or edges.
-   Graph exports must be authorized.
-   Sensitive values should be minimized or referenced rather than
    duplicated.
-   Debug output must redact unnecessary personal information.
-   Organization access remains out of scope for Release 1.

## 40. Testing Strategy

### 40.1 Unit tests

-   node schema validation
-   edge schema validation
-   compatibility matrix
-   derivation rules
-   cycle detection
-   duplicate detection
-   graph hashing
-   graph diff

### 40.2 Integration tests

-   Confirmed Facts to GraphVersion
-   Action completion to new GraphVersion
-   changed Constraint to changed edge set
-   Rule change to new GraphVersion
-   GraphVersion to Route Engine snapshot
-   user isolation

### 40.3 Property tests

-   input ordering does not change graph output
-   identical inputs produce identical graph hash
-   Proposed Facts never appear
-   every route-affecting edge has Provenance
-   all active edges reference active nodes
-   no valid graph contains a hard prerequisite cycle

### 40.4 Adversarial tests

-   cross-user edge injection
-   malformed node attributes
-   unsupported edge type
-   model-generated edge injection
-   duplicate hard dependencies
-   self-loop
-   expired Rule activation
-   conflicting Requirement satisfaction
-   oversized graph

## 41. Acceptance Criteria

The Dependency Graph is complete for Release 1 when:

1.  It is derived exclusively from Confirmed Facts, Plan state, and
    verified Rules.
2.  Identical inputs produce identical GraphVersions.
3.  Proposed Facts cannot enter the graph.
4.  All nodes and edges satisfy canonical schemas.
5.  Hard prerequisite cycles are rejected.
6.  Every route-affecting relationship is traceable.
7.  Graph publication is atomic and versioned.
8.  The Route Engine can query required relationships efficiently.
9.  Graph changes can be diffed.
10. User isolation tests pass.
11. AI cannot directly publish graph state.
12. The graph remains infrastructure rather than a competing product
    surface.

## 42. Traceability

This specification implements:

-   `vision-lock.md`
-   `glossary.md`
-   `product-principles.md`
-   `release-1.md`
-   `prd.md`
-   `system-overview.md`
-   `domain-model.md`
-   `route-engine.md`

Companion specifications:

-   `ai-boundaries.md`
-   `provenance.md`

## 43. Definition of Done

The Dependency Graph implementation is done when:

-   canonical node and edge schemas exist
-   derivation is deterministic and versioned
-   GraphVersions are immutable
-   cycle detection is enforced
-   compatibility validation is enforced
-   Provenance is preserved
-   graph diff is implemented
-   required Route Engine queries are available
-   failure modes preserve the last valid Route
-   security and adversarial tests pass
-   no user-facing design treats the graph as the primary product
    artifact
