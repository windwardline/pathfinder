# Demo Day Runbook

**Version:** 1.8  
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

The 90-second film and its full production kit live in
[`docs/demo/`](../demo/README.md). The master is
`docs/demo/refactored-90s/exports/Pathfinder-Marcus-90s-MASTER.mp4`.

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

The film is a character story. Marcus leaves a correctional facility, meets
the tangle of reentry requirements, and works Pathfinder's route one step at a
time over real product footage.

| Time | Beat | Point to land |
|---|---|---|
| 0-10 seconds | Gates and the bus ride home | Coming home starts with a box and a bus ticket. |
| 10-19 seconds | The requirement tangle connects, then shatters | Each task is manageable; the order is everything. |
| 19-45 seconds | Marcus opens Pathfinder; real app footage — Today, Focus Action, completion, structured Reroute | One explainable next step, recalculated deterministically. |
| 45-57 seconds | Wins montage: DMV, warehouse job, apartment keys | The route becomes a life: ID, job, keys. |
| 57-76 seconds | Route History and the full Route in the real app; evening stoop | Every change is preserved and explainable. |
| 76-90 seconds | Finale walk along the dashed route line; logo lockup | Pathfinder — the way home. |

The narration is timed by `docs/demo/refactored-90s/build/audio/beatmap-marcus.json`;
the per-beat audio and assembled track sit beside it. The renderer composites
the app footage from real SD-008 captures in
`docs/demo/refactored-90s/build/captures2/`.

## Live Demo Preflight

Complete this checklist on the presentation machine:

1. Confirm the production health check and custom domain are green.
2. Sign in before the presentation. Do not depend on receiving a magic link on
   stage.
3. Open Account, choose SD-008, confirm replacement, and select `Load this
   demonstration`.
4. Confirm that the Focus Action is `Obtain a state identification card` and
   that three Unlocks are visible.
5. Silence notifications and close email, messages, terminals, password
   managers, bookmarks, and unrelated browser tabs.
6. Set the browser to 100% zoom and use a 16:9 display mode.
7. Set the macOS pointer to approximately 160% with a white fill and dark
   outline so the audience can follow it.
8. Rehearse the timed journey twice. Use 600-900 millisecond eased moves,
   pause 300-500 milliseconds before consequential clicks, and hold 600-1000
   milliseconds afterward. The four consequential clicks are: complete the
   Focus Action, open the Proposed Fact review, confirm, and open Route
   History.
9. Keep the film master available locally as the fallback:
   `docs/demo/refactored-90s/exports/Pathfinder-Marcus-90s-MASTER.mp4`.

If the live application is unavailable, state that the production health check
was completed before the event and play the local 90-second MP4. Do not debug on
stage.

## Video Production Record

The film was produced entirely in-repo with a deterministic pipeline; the kit
is documented in [`docs/demo/README.md`](../demo/README.md).

1. Picture: `docs/demo/refactored-90s/build/render_marcus.py` draws every
   frame with Pillow — hand-drawn ink-and-wash linework with seeded jitter and
   8 fps line boil — and pipes 2,700 frames to FFmpeg (H.264 crf 17,
   1920 by 1080, 30 frames per second, exactly 90.000 seconds).
2. Application footage: Playwright (`build/capture.mjs`) captured the real
   SD-008 application full-screen with a visible cursor and click ripples.
   The UI scenes composite these frames uncropped. No product UI is generated
   or reconstructed, and every protected term — Fact, Confirmed Fact,
   Proposed Fact, Route, Focus Action, Reroute — appears only as the real
   product renders it.
3. Narration: the ElevenLabs Voice Library voice `Liam` with eleven_v3
   (stability 0.6, style 0.05). The presenter's voice is not recorded,
   uploaded, or cloned. No captions.
4. Music and foley: an original composed score (ElevenLabs music) ducked under
   narration by sidechain compression, plus five subtle diegetic effects —
   dawn birds, bus hum, one click, keys, crickets.
5. Master verification: exact 90.000-second duration, complete clean decode,
   −13.8 LUFS integrated, −0.9 dBTP true peak, spot frames across all scenes.

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

1. SD-008 can be reset and replayed from Account.
2. The timed journey completes without improvisation.
3. The film master is exactly 90.000 seconds, locally available, and watched
   end to end.
4. Production health and the custom domain are green.
5. Every claim stays inside the documented evidence boundary.
6. The app-footage clicks have a visible cursor, eased movement, dwell, and a
   brief click ripple.
7. The export contains no watermark, no stock footage, no stock music, and no
   generated product UI.
