# Demo assets

The Demo Day film and the production kit that builds it, versioned alongside
the code it demonstrates.

## The film

`refactored-90s/exports/Pathfinder-Marcus-90s-MASTER.mp4` — the 90.000-second
Demo Day master. A hand-drawn ink-and-wash character story: Marcus leaves a
correctional facility, meets the tangle of reentry requirements, and works
Pathfinder's route one step at a time — state ID, warehouse job, apartment
keys — over real product footage.

H.264, 1920×1080, 30 fps, AAC 256 kbps. −13.8 LUFS integrated, −0.9 dBTP.
Narration is the ElevenLabs Voice Library voice "Liam" (eleven_v3). No
captions. All application footage is the real product running the seeded
SD-008 scenario with fictional demo data; no UI is generated or reconstructed.

## Production kit — `refactored-90s/build/`

| Path | What it is |
|---|---|
| `render_marcus.py` | The film renderer: Pillow frames piped to FFmpeg — seeded-jitter ink linework with 8 fps line boil, cached watercolor washes, character rig, dashed route-line motif, scene compositor |
| `render_lib.py` | Brand toolkit: paper field, marks, wordmark morph, font loaders |
| `capture.mjs` | Playwright harness for full-screen app capture with a visible cursor and click ripples |
| `audio/soundtrack-marcus5.wav` | Final 90.0 s mix: narration, composed score (ducked), foley |
| `audio/beatmap-marcus.json` | Narration beat map the renderer is timed against |
| `audio/liam-*.wav`, `audio/narration-liam.wav` | Cleaned per-beat narration and the assembled track |
| `audio/vo-liam/` | Raw ElevenLabs narration takes |
| `audio/music__20260722_163059.mp3` | Composed score (ElevenLabs music) |
| `audio/foley/` | Five sound effects: dawn birds, bus hum, click, keys, crickets |
| `captures2/` | 679 real product frames (SD-008, fictional data) the UI scenes composite from, plus the source recording |
| `fonts/` | Newsreader statics and Geist Mono used by the renderers |

Rebuild the master with:

```sh
python3 refactored-90s/build/render_marcus.py
```

The renderer is deterministic: same inputs, pixel-identical frames. It writes
`refactored-90s/exports/Pathfinder-Marcus-90s-MASTER.mp4` and requires Pillow
and FFmpeg.
