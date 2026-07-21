# Demo assets

Finished demo artifacts for Pathfinder, versioned alongside the code they
demonstrate.

| File | What it is |
|---|---|
| `pathfinder-90s-ai-navigated-rough-cut.mp4` | 90-second rough cut |
| `pathfinder-ai-navigation-take.mp4` | AI navigation take |
| `pathfinder-route-history-take.mp4` | Route history take |
| `*-contact-sheet.jpg` | Frame contact sheets for each take |

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
