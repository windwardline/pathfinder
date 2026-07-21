# Demo Day Runbook

**Version:** 1.1  
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

The following 185-word script is synchronized to the five storyboard panels.
The validation script fails if this block drifts from the manifest.

<!-- demo-video-narration:start -->
Reentry is not one checklist. Identification, employment, housing, and transportation can depend on one another. Pathfinder turns Confirmed Facts into a Route. Here, the Focus Action is to obtain a state identification card because it is a hard prerequisite that unlocks three next steps.

When I mark it complete, the deterministic Route Engine recalculates. This Reroute shows a new focus, all three Actions that became available, and the work that moved, so the participant can see exactly why the Route changed.

AI can propose information, but it cannot make a Fact true or sequence the Route. This transit-pass item is still Proposed, and the Focus Action stays unchanged until I review it.

After I confirm it, the engine recomputes from Confirmed Facts and records another structured Reroute. That separation is deliberate: the participant controls the Facts; the Route Engine controls sequencing.

Pathfinder preserves every change in Route History, works on mobile, and is production deployed with automated tests across the engine, APIs, security boundaries, and user journey. I built it as a forward-deployed response to a reentry bottleneck, and I am seeking mission-aligned pilot partners.
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

Use the installed zero-new-subscription stack: OBS Studio for capture, DaVinci
Resolve for the final edit, FFmpeg for technical verification, and the Figma
board plus manifest for editorial control. DaVinci is now preferred over CapCut
because its free desktop edition provides precise keyframes, subtitles, color,
and Fairlight audio without making cloud processing part of the workflow.
CapCut remains an optional convenience editor for non-sensitive material, not
the governed default.

1. Record the real application window with OBS Studio at 1920 by 1080 and 30
   frames per second. Capture two complete silent takes with `Show cursor` on.
   Do not record browser chrome, personal information, or production data.
2. Follow the manifest's four semantic click cues. Move directly with ease-in
   and ease-out, dwell before and after each click, and never circle or shake the
   pointer. Park it at an edge when the viewer should read.
3. In DaVinci Resolve, add a 58-pixel Pathfinder-spruce ring at 45% opacity for
   300 milliseconds on each semantic click. Do not pulse continuously. Use
   105-115% punch-ins only on the Focus Action, Unlocks, and Reroute details.
4. Record a clean 60-90 second voice sample and the final narration in a quiet,
   soft room, six to eight inches from the microphone. Authentic recorded voice
   remains the fallback and should be kept even if cloning is used.
5. If the presenter chooses the cloned-voice path, use MiniMax Speech 2.8 HD
   only with the presenter's explicit consent. Voice cloning requires a direct
   MiniMax workflow because `mmx` 1.0.18 does not expose a clone command. Obtain
   action-time approval immediately before uploading the source recording and
   accepting the metered cloning charge. Use the clone for the approved script
   and small pickup lines, then compare it blind against the real recording.
6. Assemble footage and narration in DaVinci Resolve. Create captions from the
   approved transcript or import an SRT, then manually correct every protected
   term: Fact, Confirmed Fact, Proposed Fact, Route, Focus Action, and Reroute.
7. Use simple cuts and brief cross-dissolves. Do not use avatars, stock footage,
   generated application UI, decorative AI imagery, or template-heavy
   transitions. MiniMax Hailuo and Music are intentionally outside the critical
   path; the product and explanation should carry the pitch.
8. Keep narration near -14 LUFS integrated with peaks below -1 dB. If music is
   added after a voice-only review, keep it near -30 dB and duck it under every
   important line.
9. Export an H.264 MP4 at 1920 by 1080, 30 frames per second, 16-20 Mbps video,
   and AAC audio at 48 kHz. Verify duration, codec, resolution, frame rate, and
   audio streams with `ffprobe`, then watch the export from beginning to end.

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
