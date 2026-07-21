# Demo assets

Finished demo artifacts for Pathfinder, versioned alongside the code they
demonstrate.

| File | What it is |
|---|---|
| `exports/Pathfinder-Demo-Day-90s-Master.mp4` | Final 90.000-second Demo Day master |
| `exports/Pathfinder-Demo-Day-90s-QA-contact-sheet.jpg` | Final visual QA contact sheet |
| `audio/pathfinder-final-mix.wav` | Final 48 kHz stereo narration and underscore mix |
| `pathfinder-demo-day-90s.srt` | Governed narration captions |
| `captures/route-history-authentic-dark.png` | Authentic SD-008 Route History capture |
| `captures/today-mobile-authentic.png` | Authentic 390-pixel responsive Today capture |
| `pathfinder-90s-ai-navigated-rough-cut.mp4` | 90-second rough cut |
| `pathfinder-ai-navigation-take.mp4` | AI navigation take |
| `pathfinder-route-history-take.mp4` | Route history take |
| `*-contact-sheet.jpg` | Frame contact sheets for each take |

The final uses only real Pathfinder application footage and captures. It adds
captions, native typography, restrained cursor emphasis, an original tonal
underscore, two click cues, and transitions. It does not generate or
reconstruct application UI and contains no stock footage or stock music.

Rebuild the final master with:

```sh
/Users/peacock/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/render_demo_video.py
```

The released file is H.264 at 1920 by 1080 and 30 frames per second with AAC
48 kHz stereo audio. It measures -14.5 LUFS integrated and -1.0 dBFS true peak.
Its SHA-256 is
`055d84d3e3c319a0d4d7383260c46c15bebba922ece705a1886e8d23d867b1ec`.

## What is deliberately not here

The capture pipeline produces intermediate frame sequences — roughly **1,955
JPGs across `capture/` and `capture-history/`, about 161 MB** — which were used
to assemble the takes above.

Those frames are **not committed**. Git stores every version of every binary
forever, so 161 MB of intermediates would be paid for by every clone, every CI
run, and every checkout from here on, permanently. The finished takes are the
artifact worth versioning; the frames are scaffolding.

They are retained outside the repository. If a take needs re-cutting, work from
the frame sequences directly rather than adding them here.
