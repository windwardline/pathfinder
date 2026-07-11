#!/usr/bin/env python3
"""Validate Pathfinder's canonical documentation structure and invariants."""

from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]

EXPECTED_COUNTS = {
    "docs/00-governance": 6,
    "docs/01-product": 4,
    "docs/02-architecture": 6,
    "docs/03-research": 4,
    "docs/04-risk": 3,
    "docs/05-decisions": 5,
    "docs/06-development": 6,
    "docs/07-api": 5,
    "docs/08-data": 4,
    "docs/09-testing": 5,
    "docs/10-operations": 6,
    "docs/11-implementation": 9,
}

REQUIRED_DIRECTORIES = (
    "apps",
    "services",
    "packages",
    "tests/unit",
    "tests/integration",
    "tests/regression",
    "tests/fixtures",
    "tests/adversarial",
    "tests/performance",
    "scripts",
    "infrastructure",
    "tools",
    ".github/ISSUE_TEMPLATE",
    ".github/workflows",
)

REQUIRED_TEXT = {
    "docs/00-governance/documentation-constitution.md": (
        "Confirmed Facts → Dependency Graph → Route Engine → Route → Adaptive Route View",
        "The Dependency Graph is infrastructure.",
        "The Route is the product.",
        "The Route Engine owns sequencing.",
    ),
    "docs/02-architecture/ai-boundaries.md": (
        "Confirmed Fact",
        "Proposed Fact",
        "Route Engine",
    ),
    "docs/02-architecture/provenance.md": ("Provenance",),
    "docs/05-decisions/ADR-002-deterministic-route-engine.md": (
        "deterministic",
        "Route Engine",
    ),
    "docs/05-decisions/ADR-004-confirmed-fact-trust-model.md": (
        "Confirmed Fact",
        "Proposed Fact",
    ),
    "docs/05-decisions/ADR-005-dependency-graph-as-infrastructure.md": (
        "Dependency Graph",
        "infrastructure",
    ),
    "docs/06-development/repository-structure.md": ("11-implementation/",),
}

MARKDOWN_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
PLACEHOLDER = re.compile(r"\b(?:TODO|TBD|Lorem ipsum)\b", re.IGNORECASE)


def compact(text: str) -> str:
    return " ".join(text.split())


def markdown_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*.md"):
        if ".git" not in path.parts:
            files.append(path)
    return sorted(files)


def local_link_target(source: Path, raw_target: str) -> Path | None:
    target = raw_target.strip()
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1]
    if not target or target.startswith("#"):
        return None

    parsed = urlparse(target)
    if parsed.scheme or parsed.netloc:
        return None

    path_text = unquote(parsed.path)
    if not path_text:
        return None

    return (source.parent / path_text).resolve()


def validate() -> list[str]:
    errors: list[str] = []

    for relative in REQUIRED_DIRECTORIES:
        if not (ROOT / relative).is_dir():
            errors.append(f"missing required directory: {relative}")

    corpus_files: list[Path] = []
    for relative, expected_count in EXPECTED_COUNTS.items():
        directory = ROOT / relative
        files = sorted(directory.glob("*.md")) if directory.is_dir() else []
        corpus_files.extend(files)
        if len(files) != expected_count:
            errors.append(
                f"{relative} contains {len(files)} Markdown files; expected {expected_count}"
            )

    if len(corpus_files) != 63:
        errors.append(f"canonical corpus contains {len(corpus_files)} files; expected 63")

    direct_docs = sorted((ROOT / "docs").glob("*.md"))
    if direct_docs:
        errors.append("Markdown files must be placed in an indexed docs category")

    duplicate_names = [
        name for name, count in Counter(path.name for path in corpus_files).items() if count > 1
    ]
    if duplicate_names:
        errors.append(f"duplicate canonical filenames: {', '.join(sorted(duplicate_names))}")

    for relative, phrases in REQUIRED_TEXT.items():
        path = ROOT / relative
        if not path.is_file():
            errors.append(f"missing invariant source: {relative}")
            continue
        text = compact(path.read_text(encoding="utf-8"))
        for phrase in phrases:
            if phrase not in text:
                errors.append(f"{relative} is missing protected text: {phrase}")

    for path in markdown_files():
        text = path.read_text(encoding="utf-8")
        match = PLACEHOLDER.search(text)
        if match:
            errors.append(
                f"placeholder marker {match.group(0)!r} in {path.relative_to(ROOT)}"
            )

        for raw_target in MARKDOWN_LINK.findall(text):
            target = local_link_target(path, raw_target)
            if target is not None and not target.exists():
                errors.append(
                    f"broken local link in {path.relative_to(ROOT)}: {raw_target}"
                )

    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("Documentation validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Documentation validation passed")
    print("- 63 canonical Markdown files")
    print("- 12 indexed documentation categories")
    print("- protected architecture and trust language present")
    print("- local Markdown links resolve")
    print("- no unfinished placeholder markers found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
