# Demo Day Runbook

**Version:** 1.0  
**Status:** Active Demo Day Procedure  
**Owner:** Product & Engineering

## Purpose

This runbook defines the reliable live demonstration and 90-second product
video for Pathfinder Release 1.2. It derives from the canonical product,
architecture, testing, and operations documentation. It does not change the
product definition.

The demonstration must make one distinction memorable:

> AI may propose information. The participant controls which Facts become
> Confirmed Facts. The deterministic Route Engine controls sequencing.

## Evidence Boundary

The demonstration may state that Pathfinder has:

- deterministic sequencing,
- Confirmed-Fact-only routing,
- a visible Proposed Fact trust boundary,
- structured Route Differences and Route History,
- production deployment and health monitoring,
- automated typecheck, lint, test, security, and build gates,
- responsive desktop and mobile behavior,
- and a documented TDD case study.

The demonstration must not claim:

- validated participant comprehension,
- improved long-term reentry outcomes,
- reduced recidivism,
- proven trust or cognitive-load reduction,
- optimal ranking,
- or superiority established through participant research.

Participant recruitment and facilitation are unavailable before Demo Day.
[The Release 1 Validation Study](../03-research/release-1-validation-study.md)
therefore remains deferred with no recorded participant outcomes.

## 90-Second Story

| Time | Product beat | Presenter action | Point to land |
|---|---|---|---|
| 00-16 seconds | Focus Action | Show SD-001 already loaded and point to `Obtain a state identification card` and its three Unlocks. | Reentry is a sequencing problem, not one checklist. |
| 16-34 seconds | First Reroute | Complete the Focus Action and pause on the structured Reroute. | Pathfinder recalculates and explains what changed. |
| 34-50 seconds | Proposed Fact | Show the Proposed Fact banner and unchanged Focus Action. | AI cannot make a Fact true or change the Route. |
| 50-68 seconds | Confirmation Reroute | Confirm the Fact and pause on the second Reroute. | Participant confirmation triggers deterministic recomputation. |
| 68-90 seconds | Production close | Show the responsive mobile view or return to Today. | The product is deployed, explainable, and ready for a mission-aligned pilot partner. |

## Final Voiceover

Reentry is not one checklist. A housing step can depend on identification;
employment can depend on transportation; every change can reorder what matters
next.

Pathfinder turns Confirmed Facts into a clear Route. Here, the Focus Action is
to obtain a state identification card. It comes first because it is a hard
prerequisite and unlocks three downstream Actions. When I complete it,
Pathfinder recalculates the Route and shows exactly what changed: a new focus,
three newly available Actions, and the work that moved.

AI can help extract candidate information, but it never decides the Route and
it never makes Facts true. This transit-pass item is only Proposed, so the Route
stays unchanged. After I confirm it, a deterministic Route Engine recalculates
and produces another structured Reroute.

That separation is deliberate: the participant controls the Facts, the Route
Engine controls sequencing, and every change remains explainable. Pathfinder is
responsive, production deployed, and tested across its Route Engine, APIs,
security boundaries, and user journey.

I built this as a forward-deployed response to a real operational problem in
reentry: helping people see not everything they could do, but the next thing
that unlocks meaningful progress. I am looking for mission-aligned partners to
pilot and strengthen it.

## Live Demo Preflight

Complete this checklist on the presentation machine:

1. Confirm the production health check and custom domain are green.
2. Sign in before the presentation. Do not depend on receiving a magic link on
   stage.
3. Open Account, choose SD-001, confirm replacement, and select `Load this
   demonstration`.
4. Confirm that the Focus Action is `Obtain a state identification card` and
   that three Unlocks are visible.
5. Silence notifications and close email, messages, terminals, password
   managers, bookmarks, and unrelated browser tabs.
6. Set the browser to 100% zoom and use a 16:9 display mode.
7. Rehearse the exact cursor path twice without narration, then twice with the
   final voiceover.
8. Keep the exported MP4 and the verified screenshots available locally as the
   fallback.

If the live application is unavailable, state that the production health check
was completed before the event and play the local 90-second MP4. Do not debug on
stage.

## No-Cost Video Production Workflow

The recommended single AI-assisted editor is CapCut Desktop because it combines
timeline editing, automatic captions, and text-to-speech in a free desktop
workflow. The preferred voice is the presenter's own voice; it communicates
authenticity and avoids an artificial pitch.

1. Record the application window with OBS Studio at 1920 by 1080, 30 frames per
   second. Capture two complete silent takes. Do not record browser chrome or
   personal information.
2. Record the final voiceover separately in a quiet, soft room. Keep the
   microphone six to eight inches away and speak at a measured conversational
   pace.
3. Process only the narration through Adobe Podcast Enhance Speech. Compare the
   result with the original and reject the enhanced version if it introduces
   artifacts.
4. Assemble the strongest screen take and narration in CapCut Desktop. Use
   automatic captions, then manually correct every word and protected term.
5. Use simple cuts, brief cross-dissolves, and 105-115% punch-ins on the Focus
   Action, Unlocks, and Reroute differences. Do not use avatars, stock footage,
   decorative AI imagery, or template-heavy transitions.
6. Keep narration near -14 LUFS integrated with peaks below -1 dB. Optional
   music should remain near -30 dB and duck under every important line.
7. Export an H.264 MP4 at 1920 by 1080, 30 frames per second, 16-20 Mbps video,
   and AAC audio at 48 kHz. Watch the exported file from beginning to end.

## Judge Drill-Down

Keep these artifacts ready for questions, but do not interrupt the primary
90-second story to show them:

- [ADR-003: AI Trust Boundary](../05-decisions/ADR-003-ai-trust-boundary.md)
- [ADR-004: Confirmed Fact Trust Model](../05-decisions/ADR-004-confirmed-fact-trust-model.md)
- [Route Engine](../02-architecture/route-engine.md)
- [TDD Case Study](../09-testing/tdd-case-study-deadline-urgency.md)
- [Release 1.2 Record](release-1-2-record.md)
- [Requirements Traceability](../11-implementation/requirements-traceability.md)

## Zapier Decision

No new Zapier automation belongs in the Demo Day critical path. The application
journey is deterministic and already repeatable, and an external automation
would add a failure surface without strengthening the core demonstration.

Zapier remains appropriate after Demo Day for privacy-safe scheduling,
facilitator reminders, or follow-up messages under
[PD-001](../05-decisions/PD-001-release-1-2-conformance.md). It must never receive
Routes, Facts, documents, participant responses, or information used to
sequence, confirm, or reject product data.

## Definition of Done

The Demo Day package is ready when:

1. SD-001 can be reset and replayed from Account.
2. The timed journey completes without improvisation.
3. The voiceover fits within 90 seconds at a natural pace.
4. The final MP4 is captioned, locally available, and watched end to end.
5. Production health and the custom domain are green.
6. Every claim stays inside the documented evidence boundary.
