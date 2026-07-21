# Demo Video Production Audit

**Version:** 1.4  
**Status:** Final Demo Day Production Record  
**Audit date:** July 21, 2026  
**Owner:** Product, Engineering & Presentation

## Decision

Pathfinder's best current 90-second production stack is:

1. Figma for the governed storyboard.
2. The checked-in Demo Video Manifest for timing, copy, claims, and cursor cues.
3. OBS Studio footage plus Playwright captures of the real SD-008 application.
4. Pillow and FFmpeg for deterministic picture, caption, motion, and audio
   assembly, followed by DaVinci Resolve conformance.
5. The ElevenLabs Voice Library voice `Michael C. Vincent - Confident,
   Expressive` with Eleven v3 and Natural stability, exported as audio-only
   segments into DaVinci. No personal voice recording or cloning is used.
6. An original tonal underscore, two restrained click cues, native typography,
   and native transitions. No stock or generated asset is used.
7. FFmpeg, `ffprobe`, full-stream decoding, contact-sheet review, and DaVinci
   timeline verification as the release gates.

The ElevenLabs Creator plan is already available in the production environment;
no new ElevenLabs purchase is assigned to this cut. The visual and audio asset
layer costs $0. Artlist Max, Mixkit, Uppbeat, MiniMax, stock footage, and
generated Pathfinder UI are not used in the final master.

## Final Master Verification

The release master is
`docs/demo/exports/Pathfinder-Demo-Day-90s-Master.mp4`.

| Check | Final result |
|---|---|
| Duration | Exactly 90.000 seconds |
| Picture | H.264, 1920 by 1080, 30 frames per second, progressive |
| Audio | AAC, 48 kHz, stereo |
| Program loudness | -14.5 LUFS integrated, 6.2 LU range |
| True peak | -1.0 dBFS |
| Decode | Full 2,700-frame video and audio decode completed without error |
| SHA-256 | `055d84d3e3c319a0d4d7383260c46c15bebba922ece705a1886e8d23d867b1ec` |
| Resolve | Imported into `Pathfinder Demo Day 90s Final`; video and stereo audio verified; project saved |

The visual QA sampled the opening tension card, both consequential click
treatments, Proposed Fact and Reroute states, Route History, responsive close,
production domain, caption safe area, and final fade. Every application image
comes from the running Pathfinder product. The renderer adds only typography,
cursor emphasis, fades, framing, and color treatment; it does not create or
reconstruct application UI.

## Evidence Reviewed

The audit compared:

- the canonical Pathfinder vision, glossary, Release 1 contract, Route Engine,
  ADR-001 through ADR-005, frontend architecture, release record, testing
  evidence, and Demo Day runbook;
- the production components and SD-008 implementation that display the Focus
  Action, Proposed Fact banner and card, Reroute dialogs, and Route History;
- the Release 1 browser tests that assert the same visible strings and lifecycle
  boundary;
- the five-panel [Figma storyboard](https://www.figma.com/board/hlrY9M2zrlWVgA9NFAT4GA);
- the local real-application capture takes and their 89.97-second technical
  rough cut; and
- official documentation for OBS, Apple pointer accessibility, DaVinci Resolve,
  ElevenLabs voice cloning and pricing, Mixkit licenses and assets, Uppbeat
  pricing and licensing, CapCut privacy, and Camtasia cursor tools.

## Findings and Corrections

### Demo Day scoring alignment

The production plan deliberately balances the three equally weighted Judges'
Choice dimensions in the supplied Demo Day guidance:

| Dimension | Evidence in the 90-second story |
|---|---|
| Technical skill | The real application executes deterministic completion and confirmation Reroutes, shows structured Route Differences and History, and closes with bounded automated-test claims. |
| Impact on justice | The opening frames reentry as an interdependent sequencing problem and show identification unlocking employment, housing, and banking Actions. No unvalidated outcome claim is made. |
| Pitch presentation | The Figma-timed story, 186-word narration, readable cursor, captions, restrained motion, and explicit pilot-partner close make the product understandable without a technical walkthrough. |

This also serves the mixed audience described in the guidance. Nonprofit and
reentry leaders see an operational workflow; employers see forward-deployed
problem framing and verified engineering; funders and collaborators hear a
specific, evidence-bounded invitation to pilot. The production domain remains
on screen at the close so the project can continue working as a portfolio and
conversation starter after the presentation.

### 1. The technical rough cut is not the final Demo Day video

The current 89.97-second rough cut proves that the live application can be
navigated and exported as H.264 at 1920 by 1080 and 30 frames per second. It is
silent, does not contain a visible cursor, and does not visibly complete the
Proposed Fact review, Route History, and mobile closing panels. It must not be
submitted as the final video.

The next capture must follow
[demo-video-manifest.json](demo-video-manifest.json). The manifest makes all
five Figma beats contiguous, requires the exact product copy, and protects the
evidence boundary.

### 2. SD-008 is the reproducible recording scenario

The previous runbook named SD-001 even though the story later depended on a
pre-existing `Apply for a transit pass` Proposed Fact. SD-008 contains that Fact
while preserving the same opening Focus Action and dependencies. The governed
workflow now uses SD-008, eliminating an improvised mutation during recording.

### 3. The script is now screen-locked

The final narration is 186 words and occupies the same five time ranges as the
Figma panels: 0-16, 16-34, 34-50, 50-68, and 68-90 seconds. The validator checks
the exact ranges, protected screen copy, trust-boundary statement, evidence
claims, and natural click narration. It also rejects claims about validated
participant understanding, improved outcomes, reduced recidivism, optimality,
or visible graph infrastructure.

### 4. Cursor treatment uses both visibility and narration

The final recording uses a 160% pointer, high-contrast fill and outline, and a
brief 58-pixel brand-spruce ring at 45% opacity for 300 milliseconds. Movement
takes 600-900 milliseconds with ease-in and ease-out. The pointer dwells 300-500
milliseconds before a consequential click and 600-1000 milliseconds after it.

Only four semantic clicks remain visible: completing the Focus Action, opening
the Proposed Fact review, confirming the Fact, and opening Route History. The
script naturally says “When I mark it complete,” “This transit-pass item is
still Proposed,” “After I confirm it,” and “Route History.” Mechanical
navigation is removed with clean cuts. The ring does not pulse continuously,
and the cursor parks away from text while the viewer reads.

### 5. Real footage is non-negotiable

MiniMax Hailuo must not generate or reconstruct Pathfinder UI. The judges need
to see working software, and generated interfaces could imply behavior that was
not actually demonstrated. Hailuo remains useful for unrelated creative work,
not this product proof. MiniMax Music is also outside the critical path; a
voice-first mix is clearer and safer in a 90-second pitch.

### 6. Third-party asset libraries are unnecessary for this cut

Artlist Max bundles far more footage, templates, AI generation, and stock media
than this product demonstration should use. Pathfinder needs one score, at most
two restrained sound effects, a branded opener and close, clean transitions,
captions, and color consistency. DaVinci Resolve Free already supplies more
than 100 transitions, more than 100 customizable Fusion titles, keyframing,
subtitles, color, and Fairlight audio tools. Mixkit adds free music, sound
effects, and DaVinci templates without required attribution; its Free License
assets and stock footage downloads are watermark-free.

The professional result comes from restraint and system coherence, not asset
volume. The final cut uses one original musical idea, one motion language, real
product footage, and Pathfinder's existing brand. No Mixkit, Uppbeat, or Artlist
asset appears in the released file.

## Tool Fit and Security

| Tool | Audited local version | Governed role | Decision |
|---|---:|---|---|
| OBS Studio | 32.1.2 | Capture the real app and cursor | Keep; official macOS capture exposes `Show cursor` and defaults it on. |
| DaVinci Resolve | 21.0.2 free | Primary edit, captions, cursor ring, color, and Fairlight audio | Use as the final editor; its free edition supports the required 1080p30 workflow. |
| ElevenLabs | Creator | Michael C. Vincent - Confident, Expressive Voice Library narration with Eleven v3 and Natural stability | Use for audio-only narration; verify and preserve the voice record and license evidence before final export. |
| Original production assets | Local | Tonal underscore, two click cues, native typography, and transitions | Used; no external stock license or attribution dependency. |
| Mixkit / Uppbeat / Artlist | Not used | Evaluated asset libraries | Excluded from the final master. |
| FFmpeg | 8.1.2 | Inspect and verify final media | Keep as the non-creative verification gate. |
| CapCut Desktop | 3.3.0 | Optional convenience edit only | Do not use for sensitive voice or participant material; its policy permits collection and analysis of imported video and audio, including pre-upload for features such as captions. |
| MiniMax CLI | 1.0.18 | Optional multimodal generation outside the governed video | Keep available for other work; do not use Speech, Hailuo, Music, or generated Pathfinder UI in the final cut. |
| Figma | Connected board | Storyboard and shot authority | Keep; the board and manifest use the same five timed panels. |
| Zapier | Connected | Post-event, privacy-safe follow-up | Exclude from capture and playback; it adds no value to the deterministic product proof. |

Paid cursor-specialist applications are unnecessary. Screen Studio and Camtasia
offer automatic cursor smoothing and click effects, but OBS plus DaVinci already
provides the needed result without another purchase. If schedule risk becomes
more expensive than software cost, Camtasia is the clearest specialist fallback
because it explicitly supports cursor scaling, path editing, glow, zoom, and
captions.

## MiniMax Skill Risk Finding

The public `MiniMax-AI/cli` skill audit reported mixed results: Gen Agent Trust
Hub marked it safe, Socket and ZeroLeaks passed, while Snyk assigned High risk.
The Snyk result was driven by two prompt-level issues:

1. **High — insecure credential handling:** upstream examples encouraged API
   keys in CLI arguments and shell environment commands, which could place a
   secret in an agent transcript or process history.
2. **Medium — untrusted third-party content:** upstream examples accepted
   arbitrary URLs, web results, uploaded files, and transcribed audio without a
   strong indirect-prompt-injection boundary.

The locally shared skill used by Codex, Claude Code, Gemini/Antigravity, and
Copilot has been replaced with a hardened OAuth-first guide. It now requires
explicit upload and URL approval, treats external content as untrusted data,
previews supported side effects, forbids shell interpolation of model output,
keeps stderr visible, and prevents credential, environment, key, and SSH files
from being inspected or uploaded. Its automatic upstream lock entry was removed
so an unattended skill update cannot restore the unsafe instructions.

This fixes the installed local guidance; it does not change the public Snyk
rating. The public rating can change only after MiniMax revises the upstream
skill and the scanner reruns. Future updates to this skill are review-before-
adopt rather than automatic.

The installed `mmx` binary is the official npm package from
`MiniMax-AI/cli`. At audit time its version is 1.0.18 and its local SHA-256 is
`a92b4465887c3b1b7d9aff3c8830d2ab5ef3a23461e133fc4c2f540b5c709b05`.
The audit found no npm install or postinstall lifecycle script. These facts
reduce supply-chain ambiguity but do not substitute for future package and
skill review.

## Narration Voice Boundary

No personal voice data is used or uploaded. The production uses the male Voice
Library voice `Michael C. Vincent - Confident, Expressive` so the narration
and the presenter's live Q&A do not create a jarring gender mismatch. The public
voice description emphasizes warm bass, crisp clarity, and an articulate,
intelligent delivery suited to explainers and storytelling. That combination
supports the opening tension without turning the project into a movie trailer.

ElevenLabs identifies Eleven v3 as its highest-fidelity, most expressive model
and recommends it for professional video narration. Natural stability retains
controlled urgency without the unpredictability of Creative mode. Generate the
five governed paragraphs separately and review at least two takes per segment.
Use punctuation, take selection, and DaVinci pause edits for timing because
Eleven v3 does not expose a speed setting.

The voice is a third-party production asset. Before final generation, verify
the account can use it under the applicable Voice Library terms and preserve
the public source URL, voice name, access date, and license evidence with the
Resolve project. If the voice is unavailable or the license cannot be preserved,
stop and select another male, neutral-American, professional narration voice
with the same grounded authority and a durable use record.

## External Sources

- [OBS macOS Screen Capture](https://obsproject.com/kb/macos-screen-capture-source)
- [Apple: Make the pointer easier to see](https://support.apple.com/guide/mac-help/make-the-pointer-easier-to-see-mchlp2920/mac)
- [Blackmagic Design: DaVinci Resolve Edit](https://www.blackmagicdesign.com/products/davinciresolve/edit)
- [Blackmagic Design: DaVinci Resolve editions](https://www.blackmagicdesign.com/products/davinciresolve)
- [ElevenLabs pricing](https://elevenlabs.io/pricing)
- [ElevenLabs model selection](https://elevenlabs.io/docs/eleven-api/choosing-the-right-model)
- [Eleven v3 best practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices)
- [Michael C. Vincent public Voice Library record](https://elevenlabs.io/voice-library/adult-male-voices)
- [Mixkit licenses](https://mixkit.co/license/)
- [Mixkit music](https://mixkit.co/free-stock-music/)
- [Mixkit sound effects](https://mixkit.co/free-sound-effects/)
- [Mixkit DaVinci templates](https://mixkit.co/free-video-templates/davinci-resolve/)
- [Uppbeat pricing](https://uppbeat.io/pricing)
- [Uppbeat user agreement](https://uppbeat.io/user-agreement)
- [CapCut Privacy Policy](https://www.capcut.com/clause/privacy-policy?enter_from=footer&from_page=landing_page&lang=en&store_region=US)
- [TechSmith Camtasia cursor features](https://www.techsmith.com/camtasia/features/)
- [Public MiniMax skill audit](https://skills.sh/api/v1/skills/audit/minimax-ai/cli/mmx-cli)
- [Public MiniMax Snyk detail](https://skills.sh/minimax-ai/cli/mmx-cli/security/snyk)

## Release Gate

1. `node scripts/validate_demo_video_manifest.mjs` passes.
2. The five governed story beats are present and visually reviewed.
3. Consequential clicks are readable through cursor emphasis and sound cues.
4. Captions match the approved narration and protected terminology.
5. The export is exactly 1920 by 1080, 30 frames per second, H.264 with AAC,
   and exactly 90.000 seconds.
6. Audio measures -14.5 LUFS integrated with a -1.0 dBFS true peak.
7. Full-stream decoding completes without error.
8. No production data, personal information, secrets, unsupported claims,
   watermark, third-party stock, or generated product UI appears.
9. The master is conformed and saved in DaVinci Resolve.
