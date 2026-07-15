# PD-001: Release 1.2 Conformance and Pilot Readiness

**Status:** Approved  
**Date:** 2026-07-15  
**Scope:** Release 1 user experience, evidence, and operations

## Decision

Release 1.2 closes documented conformance gaps without expanding Pathfinder
into case management, a resource directory, risk scoring, or a general-purpose
chatbot.

Approved behavior:

- First-use Fact capture is presented as guided intake.
- AI may extract multiple candidate Fact types directly supported by document
  text, but every result remains Proposed and may not contain routing priority,
  rank, or sequence instructions.
- Relationships from extracted domain Facts are accepted only when the target
  is an explicitly matched extracted Action; unresolved relationships are not
  invented.
- Users may correct every user-facing Fact type through Proposed supersession.
- Deadline severity is derived from the confirmed due date by deterministic
  policy, not selected by a user or model.
- Blocked Route states expose the confirmed condition that must change next.
- Route History displays structured movement already computed by the server.
- Provenance details remain inspectable without exposing other users or raw
  internal graph structure.

## Rationale

These changes make existing Release 1 capabilities understandable and
truthful. They reinforce rather than weaken the Confirmed Fact boundary and
Route Engine authority.

## Validation

Engineering behavior is protected by unit, integration, browser, adversarial,
accessibility, and production-health tests. Human comprehension remains a
product hypothesis until de-identified participant sessions are recorded in
[Release 1 Validation Study](../03-research/release-1-validation-study.md).

## Explicit Non-Decisions

- No claim of reduced recidivism or improved reentry outcomes is approved.
- No participant result may be fabricated, inferred from automated testing, or
  recorded without an actual session.
- Zapier may deliver privacy-safe operational notifications or study scheduling
  messages, but it may not receive Route, Fact, document, or participant data.

