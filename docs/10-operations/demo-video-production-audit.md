# Demo Video Production Audit

**Version:** 1.1  
**Status:** Approved Demo Day Production Decision  
**Audit date:** July 20, 2026  
**Owner:** Product, Engineering & Presentation

## Decision

Pathfinder's best current 90-second production stack is:

1. Figma for the governed storyboard.
2. The checked-in Demo Video Manifest for timing, copy, claims, and cursor cues.
3. OBS Studio for real application capture.
4. DaVinci Resolve for local editing, cursor treatment, captions, color, and
   audio finishing.
5. ElevenLabs Starter with Instant Voice Cloning for an explicitly consented
   clone of the presenter's own voice, with the authentic recording retained as
   the fallback and audio-only export into DaVinci.
6. DaVinci's native effects plus Mixkit Free License music, sound effects, and
   DaVinci templates as the no-watermark Artlist Max alternative.
7. FFmpeg and `ffprobe` for deterministic media verification.

The planned cost is one $6 ElevenLabs Starter month. The visual and audio asset
layer costs $0. If Mixkit fails an editorial review, one month of Uppbeat
Creator is the approval-gated fallback; its published monthly price was $9.99
at the audit date, but checkout remains authoritative. Artlist Max is not
needed for this 90-second product proof.

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
| Pitch presentation | The Figma-timed story, 185-word narration, readable cursor, captions, restrained motion, and explicit pilot-partner close make the product understandable without a technical walkthrough. |

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

The final narration is 185 words and occupies the same five time ranges as the
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

### 6. Artlist Max is unnecessary for this cut

Artlist Max bundles far more footage, templates, AI generation, and stock media
than this product demonstration should use. Pathfinder needs one score, at most
two restrained sound effects, a branded opener and close, clean transitions,
captions, and color consistency. DaVinci Resolve Free already supplies more
than 100 transitions, more than 100 customizable Fusion titles, keyframing,
subtitles, color, and Fairlight audio tools. Mixkit adds free music, sound
effects, and DaVinci templates without required attribution; its Free License
assets and stock footage downloads are watermark-free.

The professional result comes from restraint and system coherence, not asset
volume. The final cut uses one musical idea, one motion language, real product
footage, and Pathfinder's existing brand. Mixkit is therefore the primary asset
source. Uppbeat Creator is the closest economical all-in-one fallback because
it adds music, sound effects, motion graphics, stock video, and LUTs, but it is
not purchased unless a specific free asset fails editorial review.

## Tool Fit and Security

| Tool | Audited local version | Governed role | Decision |
|---|---:|---|---|
| OBS Studio | 32.1.2 | Capture the real app and cursor | Keep; official macOS capture exposes `Show cursor` and defaults it on. |
| DaVinci Resolve | 21.0.2 free | Primary edit, captions, cursor ring, color, and Fairlight audio | Use as the final editor; its free edition supports the required 1080p30 workflow. |
| ElevenLabs | Starter | Presenter's consented Instant Voice Clone | Use for audio-only narration; keep the authentic recording and reject any less-credible clone. |
| Mixkit | Free License assets | Music, no more than two SFX, and optional DaVinci template | Primary asset library; record each item URL and license, and accept only watermark-free assets. |
| Uppbeat | Creator, optional | Paid music, motion graphics, or LUT fallback | Do not buy by default; one month requires approval and a named asset that Mixkit cannot replace. |
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

## Voice Clone Boundary

The source recording is personal voice data. It may be uploaded only after the
presenter identifies the exact file and explicitly approves sending it to
ElevenLabs. No participant audio, app data, credentials, browser sessions, or
private documents may accompany it.

ElevenLabs says Instant Voice Cloning is available immediately and can produce
a usable clone from less than two minutes of audio, while the reference
recording determines the quality ceiling. A clean, varied 60-90 second WAV is
the recommended input. Starter includes Instant Voice Cloning, a commercial
license, 30,000 monthly credits, and roughly 30 minutes of speech. Generate and
export narration as audio-only paragraph segments. Preserve the authentic take,
compare both versions for artifacts and authenticity, and publish the real
recording if the clone is less convincing.

Professional Voice Cloning is deliberately not the default. ElevenLabs places
it on Creator and recommends approximately 30 minutes of high-quality source
audio. Upgrade only if Instant Voice Cloning fails the voice review and the
additional recording and training time are justified.

## External Sources

- [OBS macOS Screen Capture](https://obsproject.com/kb/macos-screen-capture-source)
- [Apple: Make the pointer easier to see](https://support.apple.com/guide/mac-help/make-the-pointer-easier-to-see-mchlp2920/mac)
- [Blackmagic Design: DaVinci Resolve Edit](https://www.blackmagicdesign.com/products/davinciresolve/edit)
- [Blackmagic Design: DaVinci Resolve editions](https://www.blackmagicdesign.com/products/davinciresolve)
- [ElevenLabs pricing](https://elevenlabs.io/pricing)
- [ElevenLabs voice cloning](https://elevenlabs.io/docs/eleven-api/concepts/voice-cloning)
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

The final video is ready only when:

1. `node scripts/validate_demo_video_manifest.mjs` passes.
2. Every storyboard panel is visible for its governed time range.
3. All four semantic clicks are visible and readable.
4. Captions match the approved narration and protected terminology.
5. The export is exactly 1920 by 1080, 30 frames per second, H.264 with AAC,
   and no longer than 90 seconds.
6. The final file is watched end to end with headphones and speakers.
7. No production data, personal information, secrets, unsupported claims, or
   generated product UI appears.
8. The export contains no watermark, and the source URL plus applicable license
   record is saved for every third-party asset.
