
# Frontend Architecture

**Version:** 1.0  
**Status:** Canonical Implementation Specification

## Purpose

This document defines the frontend architecture for Pathfinder Release 1. It specifies how the user experience presents the Route, Today, Focus Action, fact confirmation, explanations, and Reroute while preserving the locked Route-first architecture.

The frontend is a presentation and interaction layer. It does not own sequencing, eligibility, prioritization, or graph derivation.

## Architectural Principles

- The Route is the primary user-facing artifact.
- The Route View is adaptive.
- Today reduces cognitive load without redefining the complete Route.
- The client never determines Route order.
- The client never confirms a Fact without the approved API workflow.
- Dependency Graph topology remains internal infrastructure.
- Explanations consistently answer: **Why it comes next.**
- All user-facing states must be calm, accessible, and explicit.

## Frontend Responsibilities

The frontend is responsible for:

- Rendering the current Route.
- Presenting the Focus Action.
- Displaying upcoming, blocked, and completed Route Steps.
- Supporting Proposed Fact review and confirmation.
- Presenting Provenance summaries.
- Explaining why an Action comes next.
- Showing meaningful Reroute changes.
- Handling loading, empty, blocked, completed, and error states.
- Preserving accessibility and responsive behavior.

The frontend is not responsible for:

- Sequencing Actions.
- Calculating ranking factors.
- Selecting the Focus Action.
- Deriving graph relationships.
- Activating Proposed Facts directly.
- Generating authoritative Provenance.
- Overriding the Route Engine.
- Making legal, medical, or predictive conclusions.

## Experience Architecture

Release 1 organizes the experience into five primary surfaces:

1. **Today**
2. **Route View**
3. **Fact Confirmation**
4. **Explanation**
5. **Reroute**

## Today

Today is the focused presentation of the current Route.

### Responsibilities

- Present the Focus Action.
- Show immediate blockers or deadlines.
- Provide a concise explanation.
- Offer appropriate next interaction.
- Link to broader Route context.

### Invariants

- Today does not imply the Route contains a fixed number of Actions.
- Today must not reorder the Route locally.
- Today reflects the latest published Route Version.
- The Focus Action shown must match the Route API.

## Route View

The Route View presents the complete Route adaptively.

### Route Step states

- `FOCUS`
- `UPCOMING`
- `BLOCKED`
- `COMPLETED`

### Presentation requirements

- Preserve Route order.
- Use progressive disclosure.
- Distinguish blocked state from inactive state.
- Show Deadline and Obligation context when relevant.
- Avoid exposing raw graph topology as the default interface.
- Support accessible list-based navigation.

## Focus Action Component

The Focus Action is the highest-priority eligible Action selected by the Route Engine.

### Required content

- Action title
- Current state
- Why it comes next
- What it unlocks
- Relevant Deadline or Obligation
- Provenance summary
- Primary call to action

### Invariants

- The client must not calculate or substitute a Focus Action.
- The displayed Action must reference the current Route Version.
- Stale Focus Action data must be rejected or refreshed.

## Fact Confirmation Experience

The Fact Confirmation experience manages Proposed Facts.

### Required capabilities

- View Proposed Fact
- Review source and Provenance
- Confirm
- Reject
- Correct through supersession workflow
- View confirmation status

### Safety requirements

- Proposed Facts must be visually distinct from Confirmed Facts.
- Confidence indicators must not imply confirmation.
- Confirming a Fact must use the Facts API.
- The interface must explain when confirmation may trigger a Reroute.

## Explanation Experience

Explanations communicate the deterministic basis for sequence.

### Required question

**Why it comes next.**

### Explanation content may include

- Hard prerequisite
- Deadline urgency
- Mandatory Obligation
- Unlock value
- Blocker removal
- User-priority Goal
- Conflict avoidance
- Stable tie-break

### Requirements

- Plain-language text must align with structured reason codes.
- The client must not invent or reinterpret reasons.
- Provenance links should be available where useful.
- Deterministic fallback text must be supported.

## Reroute Experience

The Reroute experience explains the difference between two immutable Route Versions.

### Required sections

- What changed
- Why it changed
- What moved
- What became blocked
- What became available

### Requirements

- Use the structured Reroute API payload.
- Do not infer Route differences in the client.
- Distinguish completed, removed, moved, newly blocked, and newly available Actions.
- Provide a clear path back to the current Route.
- Avoid punitive or alarming language.

## Navigation Model

Recommended Release 1 navigation:

- Today
- Route
- Facts
- Route History
- Account / Privacy

Navigation labels must use canonical terminology.

## State Management

Client state is divided into:

### Server state

Examples:

- Current Route
- Route Versions
- Proposed Facts
- Confirmed Facts
- Provenance summaries
- Reroute Events

Server state should be retrieved and synchronized through documented APIs.

### Local UI state

Examples:

- Expanded sections
- Dialog visibility
- Draft corrections
- Temporary filters

Local state must never become authoritative routing state.

## Data Freshness

The frontend must:

- Identify the current Route Version.
- Refresh after successful confirmation or update.
- Reject stale mutations using API concurrency contracts.
- Display a safe refresh state when Route data changes.
- Avoid optimistic updates that imply a new Route before publication.

## Component Boundaries

Recommended component groups:

### Route components

- RouteSummary
- FocusActionCard
- RouteStepList
- RouteStep
- BlockedState
- CompletedRouteState

### Fact components

- ProposedFactCard
- FactConfirmationDialog
- ProvenanceSummary
- FactHistory

### Reroute components

- RerouteSummary
- ChangedFocusAction
- MovedActions
- NewlyBlockedActions
- NewlyAvailableActions

### Shared components

- StatusBadge
- DeadlineDisplay
- ErrorState
- EmptyState
- LoadingState
- ConfirmationPrompt
- AccessibleDialog

Component names should remain implementation-specific while user-facing labels use canonical terminology.

## API Integration

The frontend consumes:

- Route API
- Facts API
- Provenance API
- Reroute API

### API rules

- Use typed client contracts.
- Validate response schemas where practical.
- Preserve correlation identifiers for support.
- Handle standard error objects consistently.
- Never call internal graph endpoints.
- Never construct Route Versions client-side.

## Error Handling

### Recoverable errors

Examples:

- temporary network failure
- explanation service failure
- stale Route Version

Response:

- preserve the last valid rendered Route
- explain the issue calmly
- provide retry or refresh
- use deterministic fallback explanations when supplied

### Non-recoverable errors

Examples:

- authorization failure
- invalid ownership
- corrupted response contract

Response:

- stop the affected interaction
- avoid exposing sensitive details
- direct the user to a safe recovery path
- preserve audit correlation information

## Loading States

Loading states must:

- communicate progress
- avoid implying Route order before data arrives
- preserve layout stability
- support assistive technologies
- avoid indefinite blocking without feedback

## Empty States

Differentiate:

- intake not complete
- no Confirmed Facts
- no active Plan
- all Goals completed
- no Route yet published

Do not use one generic empty state for all conditions.

## Blocked State

When no Action is currently eligible, the frontend must display:

- the blocked Route status
- active Blockers
- unmet Requirements
- relevant Provenance
- next resolvable condition when provided

The client must not invent a substitute next Action.

## Accessibility Requirements

Release 1 must support:

- keyboard navigation
- semantic landmarks
- logical heading structure
- screen-reader labels
- visible focus indicators
- appropriate announcements after Reroute
- color-independent meaning
- accessible forms and validation
- responsive layouts
- reduced-motion preferences where applicable

## Responsive Behavior

The experience must function across:

- mobile
- tablet
- desktop

Mobile is a primary Release 1 consideration due to likely usage context.

Responsive behavior must not remove essential Route, explanation, confirmation, or Reroute information.

## Privacy

The frontend must:

- minimize sensitive data in browser storage
- avoid persistent storage of raw documents unless explicitly required
- prevent sensitive values from entering analytics
- clear sensitive transient state after use
- use secure, time-limited document access
- respect account deletion and logout behavior

## Security

- Use secure authentication flows.
- Protect against cross-site scripting and request forgery as applicable.
- Avoid rendering untrusted model or document content without sanitization.
- Do not expose secrets in client bundles.
- Enforce authorization on the server even when UI controls are hidden.
- Avoid using client-side checks as the security boundary.

## Analytics Boundaries

Allowed analytics:

- page or surface viewed
- interaction completed
- confirmation flow completed
- Reroute explanation viewed
- non-sensitive error category

Prohibited analytics:

- raw Fact values
- raw document content
- legal or supervision details
- hidden risk profiling
- cross-user comparisons
- recidivism-related scoring

## Performance Targets

Release 1 objectives:

- Render cached or returned Route promptly.
- Avoid blocking Today on non-essential secondary content.
- Lazy-load Route History where appropriate.
- Keep primary confirmation and Route interactions responsive.
- Preserve correctness and accessibility before micro-optimization.

## Testing Strategy

### Unit tests

- Component state behavior
- Canonical label rendering
- Error and empty states
- Explanation fallback rendering
- Route Step state presentation

### Integration tests

- Route API to Route View
- Fact confirmation flow
- Stale Route refresh
- Reroute presentation
- Provenance summary display

### End-to-end tests

- First-time Route generation
- Proposed Fact confirmation
- Transportation-loss Reroute
- Blocked Route
- Completed Route
- Unauthorized access handling

### Accessibility tests

- Keyboard-only Route flow
- Screen-reader announcements
- Focus management after confirmation and Reroute
- Form validation
- Contrast and semantic structure

## Acceptance Criteria

The frontend architecture is complete when:

1. The Route is the primary user-facing artifact.
2. Today presents the Focus Action without redefining the complete Route.
3. The client never sequences or prioritizes Actions.
4. Proposed Facts remain visually and behaviorally distinct from Confirmed Facts.
5. Explanations answer “Why it comes next.”
6. Reroute presents structured before-and-after changes.
7. Loading, empty, blocked, completed, and error states are distinct.
8. Accessibility requirements are testable.
9. API concurrency and stale-data behavior are handled safely.
10. Dependency Graph topology is not required for normal use.
11. Security and privacy boundaries are preserved.
12. Seeded Demonstration Scenarios can be completed through the frontend.

## Traceability

Supports:

- vision-lock.md
- product-philosophy.md
- prd.md
- release-1.md
- system-overview.md
- route-engine.md
- ai-boundaries.md
- route-api.md
- facts-api.md
- provenance-api.md
- reroute-api.md
- testing-strategy.md
- seeded-demonstration-scenarios.md
- ADR-001
- ADR-002
- ADR-003
- ADR-004
- ADR-005

## Definition of Done

The frontend architecture is complete when the implementation can present, explain, and update the user's Route through an accessible, calm, adaptive experience; all authoritative sequencing remains server-side; the Confirmed Fact trust boundary is preserved; and meaningful Reroute behavior is rendered directly from canonical API contracts without introducing competing terminology or product logic.
