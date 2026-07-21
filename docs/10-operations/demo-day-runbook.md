# Demo Day Runbook

**Version:** 1.7  
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

The [Figma storyboard](https://www.figma.com/board/hlrY9M2zrlWVgA9NFAT4GA)
defines the five visual panels. The machine-readable
[Demo Video Manifest](demo-video-manifest.json) is the canonical source for
their timing, exact screen copy, narration, and cursor choreography. Run
`node scripts/validate_demo_video_manifest.mjs` whenever either artifact
changes.

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
| 00-16 seconds | Focus Action | Show SD-008 already loaded and point to `Obtain a state identification card` and its three Unlocks. | Reentry is a sequencing problem, not one checklist. |
| 16-34 seconds | First Reroute | Complete the Focus Action and pause on the structured Reroute. | Pathfinder recalculates and explains what changed. |
| 34-50 seconds | Proposed Fact | Show the Proposed Fact banner and unchanged Focus Action. | AI cannot make a Fact true or change the Route. |
| 50-68 seconds | Confirmation Reroute | Confirm the Fact and pause on the second Reroute. | Participant confirmation triggers deterministic recomputation. |
| 68-90 seconds | Production close | Show Route History, cut to the responsive mobile Today view, and finish on the production domain. | The product is deployed, explainable, and ready for a mission-aligned pilot partner. |

## Final Voiceover

The following 186-word script is synchronized to the five storyboard panels.
The validation script fails if this block drifts from the manifest.

<!-- demo-video-narration:start -->
Coming home, one missing state ID can stall a job, banking, and housing at the same time. Each task is manageable. The order can derail everything. Pathfinder turns Confirmed Facts into one explainable Route, starting with the Action unlocking the rest.

When I mark it complete, the deterministic Route Engine recalculates. A new Focus Action appears with three Actions and moved work. The participant sees what changed and why, without yielding control to an opaque recommendation.

AI can propose information, but it cannot make a Fact true or sequence the Route. This transit-pass item is still Proposed, so the Focus Action stays unchanged until the participant reviews it.

After I confirm it, the engine recomputes only from Confirmed Facts and records a structured Reroute. That boundary is deliberate: the participant controls the Facts; the Route Engine controls sequencing consistently and visibly.

I built Pathfinder end to end: deterministic engine, API endpoints, security boundaries, responsive experience, and deployment. Route History preserves every change. This is how I work: close to the problem, accountable to the people using it, and ready to turn Pathfinder into a mission-aligned pilot.
<!-- demo-video-narration:end -->

The first-person click language is intentional but restrained. It tells the
viewer what consequential action is occurring without narrating every piece of
mouse mechanics.

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
7. In OBS's macOS Screen Capture source, verify `Show cursor` is on. Set the
   macOS pointer to approximately 160% with a white fill and dark outline.
8. Rehearse the exact cursor path twice without narration, then twice with the
   final voiceover. Use 600-900 millisecond eased moves, pause 300-500
   milliseconds before consequential clicks, and hold 600-1000 milliseconds
   afterward.
9. Record the four consequential clicks in the manifest: complete, open the
   Proposed Fact review, confirm, and open Route History. Cut around purely
   mechanical navigation.
10. Keep the exported MP4 and the verified screenshots available locally as the
    fallback.

If the live application is unavailable, state that the production health check
was completed before the event and play the local 90-second MP4. Do not debug on
stage.

## Recommended Video Production Workflow

Use the locked production stack: the ElevenLabs Voice Library voice
`Michael C. Vincent - Confident, Expressive` with Eleven v3 and Natural
stability for narration; OBS Studio for real application capture; DaVinci
Resolve Free for final conformance; Playwright for reproducible captures of the
real SD-008 application state; Pillow and FFmpeg for deterministic picture,
caption, and audio assembly; and the Figma board plus manifest for editorial
control. DaVinci
is preferred over CapCut because its free desktop edition provides precise
keyframes, professional titles and transitions, Fusion motion graphics,
subtitles, color, and Fairlight audio without making cloud processing part of
the workflow. CapCut remains outside the governed final-video path.

1. Record the real application window with OBS Studio at 1920 by 1080 and 30
   frames per second. Capture two complete silent takes with `Show cursor` on.
   Do not record browser chrome, personal information, or production data.
2. Follow the manifest's four semantic click cues. Move directly with ease-in
   and ease-out, dwell before and after each click, and never circle or shake the
   pointer. Park it at an edge when the viewer should read.
3. In DaVinci Resolve, add a 58-pixel Pathfinder-spruce ring at 45% opacity for
   300 milliseconds on each semantic click. Do not pulse continuously. Use
   105-115% punch-ins only on the Focus Action, Unlocks, and Reroute details.
4. Use the ElevenLabs Creator plan and the Voice Library voice
   `Michael C. Vincent - Confident, Expressive`. Do not record, upload, or
   clone the presenter's voice. Before final generation, verify the voice's
   library record and applicable license, then save the source URL, access date,
   voice name, and license evidence with the project.
5. Render the approved narration with Eleven v3 and Natural stability. Export
   audio only; do not use ElevenLabs video or dubbing export. Generate the five
   paragraph-sized segments separately, review at least two performance takes
   per segment, and select delivery through take choice and pause edits in
   DaVinci; Eleven v3 does not expose the speed control used by earlier models.
   Prefer 48 kHz PCM/WAV output when the interface makes it available; otherwise
   use the highest available MP3 quality and conform to 48 kHz in DaVinci.
6. Assemble the real footage, authentic application captures, narration,
   original tonal underscore, click cues, and governed SRT with
   `scripts/render_demo_video.py`. The renderer preserves every protected
   term: Fact, Confirmed Fact, Proposed Fact, Route, Focus Action, and Reroute.
7. Build the opener and close from real Pathfinder imagery, the Pathfinder
   wordmark, spruce accent, and production domain. Use native typography,
   restrained fades, and slow push-ins. Do not generate or reconstruct product
   UI.
8. Use the original in-project tonal underscore and two restrained click cues.
   No stock footage, stock music, generated imagery, or third-party template is
   used in the final cut.
9. Keep narration near -14 LUFS integrated with peaks below -1 dB. Keep music
   near -30 dB under narration, raise it only for the short intro and close, and
   duck it under every important line. Use a subtle click sound only when it
   reinforces one of the four semantic clicks.
10. Import the rendered master into the dedicated DaVinci Resolve timeline
    `Pathfinder Demo Day 90s Final`, verify video and stereo audio, and save the
    project.
11. Export an H.264 MP4 at 1920 by 1080 and 30 frames per second with AAC audio
    at 48 kHz. Verify duration, codec, resolution, frame rate, audio streams,
    loudness, true peak, and complete decode with FFmpeg and `ffprobe`.

The full tool and security analysis is recorded in
[Demo Video Production Audit](demo-video-production-audit.md).

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
3. The voiceover fits within 90 seconds at a natural pace.
4. The final MP4 is captioned, locally available, and watched end to end.
5. Production health and the custom domain are green.
6. Every claim stays inside the documented evidence boundary.
7. `node scripts/validate_demo_video_manifest.mjs` passes.
8. The four semantic clicks have a visible cursor, eased movement, dwell, and a
   brief click ring.
9. The export contains no watermark, and every third-party asset has a saved
   source URL and license record.
