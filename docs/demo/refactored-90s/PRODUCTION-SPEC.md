# Refactored — Demo Day 90s Film · Production Spec

**Status:** Approved creative, in production
**Date:** 2026-07-21 (demo: Fri 2026-07-24 AM)
**Owner:** Founder (Michael) · Build: Claude Code

## Thesis
Refactored is the product; Pathfinder is the proof. A 90-second first-person
founder film. Lived-experience hook → the sequencing trap → Pathfinder (real
working software, the Reroute wow) → a typographic morph → Refactored, a software
company that hires formerly incarcerated engineers and competes on excellence.
Tone: strong, confident, warm. Never bitter, never charity. "Mission follows mastery."

## Non-negotiable honesty invariants (keep us credible to sharp judges)
- Real product footage only. No generated/reconstructed UI.
- Fictional demo data (SD-008 state-ID scenario). No real participant data.
- No fabricated traction: Refactored is "launching." No revenue/headcount/client claims.
- Refactored external language limited to the repo's **approved-verbatim** list.
- Protected Pathfinder terms shown correctly on screen (Route, Focus Action, Reroute).

## Final script (approved) — first person, founder VO
1. "For a lot of us, the day you come home, the world hands you a list. Nobody hands you the order."
2. "You need an ID to get a job, an address to get the ID, a job to keep the address. One wrong step, and it all falls apart. Reentry isn't a paperwork problem — it's a sequencing problem."
3. "So we built the map we wish we'd had. We call it Pathfinder."
4. "It turns the facts of your life into one clear Route — one step at a time. Start with a state ID: the one move that unlocks the next three. Mark it done, and the Route rebuilds itself, showing exactly what changed, and why. Real, working software."
5. "But Pathfinder isn't just a product. It's proof."
6. "Proof of what we can build. I'm launching Refactored — a software company that hires formerly incarcerated engineers and competes on one thing: excellence. We don't lower the bar. We raise people to meet it."
7. "Hire us because we're among the best — the impact comes free. Because talent is everywhere; the chance to prove it isn't. Refactored. Mission follows mastery."

## Edit philosophy
Audio-led: cut picture to the founder's real read; do NOT force the VO into fixed
time slots. Target 88–92s; trim picture, not meaning.

## Shot list (picture → founder VO segment)
| # | Picture | Source |
|---|---|---|
| A | Cold open: black → deep-green landing hero fades up | Real: live landing screen |
| B | "The trap": requirement words stack + connect (motion type, paper/spruce) | Motion graphics |
| C | Landing hero resolves on "This is Pathfinder" | Real: landing screen |
| D | Today view, Focus Action = "Obtain a state identification card" + reason codes | Real capture |
| E | Mark complete → Reroute dialog, 3 newly-unlocked Actions (money shot) | Real capture |
| F | Route History showing the structured change | Real capture (route-history-authentic-dark.png / fresh) |
| G | THE MORPH: "Pathfinder" wordmark + compass restructure into "Refactored" | Custom (Morph A) |
| H | Refactored section: wordmark hold, founder | Custom + founder |
| I | Close card: Refactored · "Mission follows mastery" · wearerefactored.com | Custom |

**Domain (decided):** wearerefactored.com — purchased via Cloudflare, active 2026-07-21.
Close card + landing page point here. Legal entity / trademark uses a descriptor
("Refactored Software/Engineering") — post-demo, with counsel.

## Morph A spec (transformational branding)
Shared Newsreader serif. On segment 5 ("It's proof"), the Pathfinder compass mark
resolves/rotates and the wordmark letters restructure into "Refactored" — same
type DNA, rebuilt. Refactored is text-only today (no committed logo); this is its
first visual expression, in Pathfinder's paper/spruce family, drafted for the film
only. Palette: deep green #07110E, paper #F7F5EF, spruce/teal #79C8BB, amber #D9A441.

**Mark (decided): Keystone** — an arch with a locked spruce keystone, in the
compass's circle family (navigation ↔ architecture). Morph mechanic: the ring is
constant; the compass spins/fades out and the keystone settles in **upright**
(no inversion). This mark carries the film's close card and the wearerefactored.com
landing page.

## Audio
- **Narration:** founder records himself (see voice-takes/README.md). Cleaned,
  de-noised, leveled to ~-16 LUFS VO, ducked under music.
- **Music:** one original warm underscore (generate fresh; Codex track was built
  for a flat script). Bed ~ -23 LUFS, lifts at morph and close. Program -14 LUFS.
- Two restrained UI click cues on consequential clicks only.

## Deliverable spec
1920×1080, 30fps, H.264 + AAC 48kHz stereo, ~90s, burned-in captions matching VO,
program loudness -14 LUFS integrated, true peak ≤ -1.0 dBFS.

## QA gates
Real footage only · protected terms correct on screen · captions == VO ·
no personal/secret data · no unsupported claims · loudness/peak in spec ·
full-stream decode clean · founder final approval.

## Assembly toolchain (Claude-side; founder does not touch these)
Playwright/browser captures + existing real rough-cut · Pillow/FFmpeg render
(adapt scripts/render_demo_video.py) · DaVinci Resolve conform optional ·
ffprobe verification. ElevenLabs used only to clean the founder's own recording
(isolate/level) and to compose the original underscore — no voice cloning.
