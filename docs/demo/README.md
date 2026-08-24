# Demo assets

The Demo Day film, the presenter backdrops, and the production kits that build
them, versioned alongside the code they demonstrate.

## The film

`pathfinder-90s/exports/Pathfinder-Marcus-90s-FINAL-CUT.mp4` — the
90.000-second Demo Day final cut. A hand-drawn ink-and-wash character story: Marcus leaves a
correctional facility, meets the tangle of reentry requirements, and works
Pathfinder's route one step at a time — state ID, warehouse job, apartment
keys — over real product footage.

H.264, 1920×1080, 30 fps, AAC 256 kbps. −13.8 LUFS integrated, −0.9 dBTP.
Narration uses a licensed stock synthetic voice. No captions. All application
footage is the real product running the seeded SD-008 scenario with fictional
demo data; no UI is generated or reconstructed.

## Production kit — `pathfinder-90s/build/`

| Path | What it is |
|---|---|
| `render_marcus.py` | The film renderer: Pillow frames piped to FFmpeg — seeded-jitter ink linework with 8 fps line boil, cached watercolor washes, character rig, dashed route-line motif, scene compositor |
| `render_lib.py` | Brand toolkit: paper field, marks, wordmark morph, font loaders |
| `capture.mjs` | Playwright harness for full-screen app capture with a visible cursor and click ripples |
| `audio/soundtrack-marcus5.wav` | Final 90.0 s mix: narration, composed score (ducked), foley |
| `audio/beatmap-marcus.json` | Narration beat map the renderer is timed against |
| `audio/liam-*.wav`, `audio/narration-liam.wav` | Cleaned per-beat narration and the assembled track |
| `audio/vo-liam/` | Raw narration takes |
| `audio/music__20260722_163059.mp3` | Licensed original score |
| `audio/foley/` | Five sound effects: dawn birds, bus hum, click, keys, crickets |
| `captures2/` | 679 real product frames (SD-008, fictional data) the UI scenes composite from, plus the source recording |
| `fonts/` | Newsreader statics and Geist Mono used by the renderers |

Rebuild the final cut with:

```sh
python3 pathfinder-90s/build/render_marcus.py
```

The renderer is deterministic: same inputs, pixel-identical frames. It writes
`pathfinder-90s/exports/Pathfinder-Marcus-90s-FINAL-CUT.mp4` and requires Pillow
and FFmpeg.

## Presenter backdrops — `backdrops/`

Three 3840×2160 backgrounds for presenting over video. The presenter sits
centred in frame, so each composition keeps the middle clear and works the
brand into the corners and edges. All three draw on the application's own
design tokens — paper, spruce, Newsreader, Geist Mono — so a call matches the
product on screen.

| File | The idea |
|---|---|
| `Pathfinder-Backdrop-Field-Guide.png` | Daylight paper with contour whispers; the dashed Route climbs the left edge and crosses the top to a star. Carries the value proposition. |
| `Pathfinder-Backdrop-The-Way-Home.png` | The film's closing mood: night sky, a route rising to a lit window, a constellation of waypoints. |
| `Pathfinder-Backdrop-Same-Facts-Same-Route.png` | The claim, drawn: a Dependency Graph on the left resolving into an ordered Route on the right. |

Rebuild them with:

```sh
python3 backdrops/render_backdrops.py
```

Deterministic in the same way as the film renderer — same inputs, pixel-identical
output, verified by checksum against the committed images. Requires Pillow, and
reuses the brand fonts in `pathfinder-90s/build/fonts/`.
