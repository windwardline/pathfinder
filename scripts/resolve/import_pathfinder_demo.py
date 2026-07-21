#!/usr/bin/env python3
"""Import and conform the verified Pathfinder Demo Day master in Resolve.

Run from DaVinci Resolve via Workspace > Scripts. The script preserves the
original media and creates a dedicated final timeline from the released master.
"""

from pathlib import Path

import DaVinciResolveScript as dvr


MEDIA_ROOT = (
    Path.home()
    / "Library"
    / "Containers"
    / "com.blackmagic-design.DaVinciResolveLite"
    / "Data"
    / "DaVinci Resolve Media"
    / "Pathfinder Demo Day"
)
MASTER_NAME = "Pathfinder-Demo-Day-90s-Master.mp4"
TIMELINE_NAME = "Pathfinder Demo Day 90s Final"


def main() -> None:
    resolve = dvr.scriptapp("Resolve")
    if not resolve:
        raise RuntimeError("Resolve scripting API is unavailable")

    project_manager = resolve.GetProjectManager()
    project = project_manager.GetCurrentProject()
    if not project:
        raise RuntimeError("No Resolve project is open")

    media_pool = project.GetMediaPool()
    master_path = MEDIA_ROOT / MASTER_NAME
    if not master_path.is_file():
        raise FileNotFoundError(f"Missing Pathfinder final master: {master_path}")

    imported = media_pool.ImportMedia([str(master_path)])
    if not imported:
        raise RuntimeError("Resolve did not import the verified final master")

    master = next((clip for clip in imported if clip.GetName() == MASTER_NAME), None)
    if not master:
        raise RuntimeError("Resolve could not identify the final master")

    timeline = next(
        (
            project.GetTimelineByIndex(index)
            for index in range(1, project.GetTimelineCount() + 1)
            if project.GetTimelineByIndex(index).GetName() == TIMELINE_NAME
        ),
        None,
    )
    if not timeline:
        timeline = media_pool.CreateTimelineFromClips(TIMELINE_NAME, [master])
        if not timeline:
            raise RuntimeError("Resolve could not create the final timeline")
    project.SetCurrentTimeline(timeline)
    project_manager.SaveProject()
    resolve.OpenPage("edit")

    print(f"Conformed {MASTER_NAME} in {project.GetName()} as {TIMELINE_NAME}.")


if __name__ == "__main__":
    main()
