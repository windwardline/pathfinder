#!/usr/bin/env python3
"""Enumerate and reap orphaned Neon preview branches.

Neon's Vercel integration creates a `preview/<git-branch>` database for each
preview deployment and deletes it only when the *Vercel deployment* is removed.
Vercel retains preview deployments for six months by default, so a merged and
deleted git branch leaves its database running for half a year. Each extra
branch past the plan allowance bills at roughly $1.50/month, so the cost grows
by one branch per pull request and does not come back down on its own.

This reaps them on the pull request's clock instead of the deployment's.

Safety model, in order of precedence:
  1. The default branch and any protected branch are never candidates.
  2. Only branches named `preview/*` are ever candidates.
  3. A branch whose pull request is still open is never a candidate.
  4. A branch younger than --min-age-hours is never a candidate, so a preview
     built before its PR is opened is not reaped out from under the author.
  5. Anything that matches none of the above is reported as UNCLASSIFIED and
     left alone. Unrecognised input is surfaced, never silently skipped.

Dry run is the default. Deleting requires --execute.

Usage:
  wl-secret neon-api-key=NEON_API_KEY -- python3 scripts/neon_branches.py --list
  wl-secret neon-api-key=NEON_API_KEY -- python3 scripts/neon_branches.py --repo owner/name
  wl-secret neon-api-key=NEON_API_KEY -- python3 scripts/neon_branches.py --repo owner/name --execute
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

API = "https://console.neon.tech/api/v2"
PREVIEW_PREFIX = "preview/"


def die(msg: str, code: int = 1) -> None:
    print(f"neon_branches: {msg}", file=sys.stderr)
    sys.exit(code)


def api(path: str, token: str, method: str = "GET", params: dict | None = None) -> dict:
    url = f"{API}{path}"
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    # Pin every request to the Neon control plane. `path` is assembled from
    # module constants and provider-issued ids, never from user input, and this
    # makes that a runtime invariant rather than a property you have to confirm
    # by reading all the call sites: a traversal, an absolute URL, or a scheme
    # swap in an id cannot redirect the request or leak the bearer token.
    if not url.startswith(API + "/"):
        raise RuntimeError(f"refusing to call a non-Neon URL: {url[:60]}")
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/json")
    try:
        # The rule this suppresses warns that urllib honours `file://`, so a
        # dynamic URL could read local files. The assertion above makes that
        # impossible: the URL must already start with the constant https Neon
        # base, so no scheme or host substitution can survive it. Suppressed
        # bare because the registry reports this rule id doubled
        # (`...dynamic-urllib-use-detected.dynamic-urllib-use-detected`) and a
        # targeted id that does not match binds to nothing and reads as fixed.
        # nosemgrep
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode()
            return json.loads(body) if body.strip() else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:300]
        raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {detail}") from None
    except urllib.error.URLError as e:
        raise RuntimeError(f"{method} {path} -> {e.reason}") from None


def visible_projects(token: str) -> list[dict]:
    """Every project this key can see.

    A Vercel-managed key is org-scoped, and a bare /projects call fails with
    `org_id is required` rather than returning an empty list. Falling back to
    per-organization listing keeps the tool usable with either key shape.
    """
    try:
        return api("/projects", token).get("projects", [])
    except RuntimeError as e:
        if "org_id" not in str(e):
            raise
    orgs = api("/users/me/organizations", token).get("organizations", [])
    found: list[dict] = []
    for org in orgs:
        found.extend(api("/projects", token, params={"org_id": org["id"]}).get("projects", []))
    return found


def resolve_project(token: str, explicit: str | None) -> str:
    if explicit:
        return explicit
    env = os.environ.get("NEON_PROJECT_ID")
    if env:
        return env
    projects = visible_projects(token)
    if len(projects) == 1:
        return projects[0]["id"]
    names = ", ".join(f'{p["id"]} ({p["name"]})' for p in projects) or "none"
    die(f"cannot infer project: {len(projects)} projects visible: {names}. Pass --project-id.")


def all_branches(token: str, project: str) -> list[dict]:
    """Page through every branch. A single page is not a result set."""
    out: list[dict] = []
    cursor: str | None = None
    seen_pages = 0
    while True:
        params = {"limit": 500}
        if cursor:
            params["cursor"] = cursor
        page = api(f"/projects/{project}/branches", token, params=params)
        batch = page.get("branches", [])
        out.extend(batch)
        seen_pages += 1
        nxt = (page.get("pagination") or {}).get("next")
        # Stop only when the server stops handing back a distinct cursor.
        if not nxt or not batch or nxt == cursor:
            break
        cursor = nxt
        if seen_pages > 200:
            die("pagination exceeded 200 pages; refusing to loop")
    return out


def open_pr_heads(repo: str | None) -> set[str] | None:
    """Head branch names of open PRs, or None when we could not determine them.

    None is not an empty set. An empty set would green-light deleting every
    preview branch, so a failure here must block rather than widen the blast
    radius.
    """
    if not repo:
        return None
    try:
        raw = subprocess.run(
            ["gh", "pr", "list", "--repo", repo, "--state", "open",
             "--limit", "500", "--json", "headRefName"],
            capture_output=True, text=True, timeout=90, check=True,
        ).stdout
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"warning: could not list open PRs for {repo}: {e}", file=sys.stderr)
        return None
    return {p["headRefName"] for p in json.loads(raw or "[]")}


def age_hours(branch: dict, now: dt.datetime) -> float:
    created = branch.get("created_at")
    if not created:
        return 0.0
    ts = dt.datetime.fromisoformat(created.replace("Z", "+00:00"))
    return (now - ts).total_seconds() / 3600.0


def classify(branches: list[dict], open_heads: set[str] | None, min_age: float) -> dict:
    now = dt.datetime.now(dt.timezone.utc)
    buckets = {"protected": [], "candidate": [], "held": [], "unclassified": []}
    for b in branches:
        name = b.get("name", "")
        if b.get("default") or b.get("protected"):
            buckets["protected"].append((b, "default/protected branch"))
        elif not name.startswith(PREVIEW_PREFIX):
            buckets["unclassified"].append((b, "not a preview/* branch"))
        elif (hrs := age_hours(b, now)) < min_age:
            buckets["held"].append((b, f"younger than {min_age:g}h ({hrs:.1f}h)"))
        elif open_heads is not None and name[len(PREVIEW_PREFIX):] in open_heads:
            buckets["held"].append((b, "pull request still open"))
        elif open_heads is None:
            buckets["held"].append((b, "open-PR state unknown; refusing to guess"))
        else:
            buckets["candidate"].append((b, "PR closed or absent"))
    return buckets


def render(buckets: dict) -> None:
    for key, label in (
        ("protected", "PROTECTED — never deleted"),
        ("held", "HELD — deletable pattern, but withheld"),
        ("unclassified", "UNCLASSIFIED — reported, not deleted"),
        ("candidate", "CANDIDATE — will be deleted with --execute"),
    ):
        rows = buckets[key]
        print(f"\n{label}  [{len(rows)}]")
        for b, why in sorted(rows, key=lambda r: r[0].get("created_at") or ""):
            print(f"  {b.get('id',''):24s} {b.get('created_at','')[:19]:20s} {b.get('name','')}  — {why}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project-id", help="Neon project id (else $NEON_PROJECT_ID, else inferred)")
    ap.add_argument("--repo", help="owner/name, to hold branches whose PR is still open")
    ap.add_argument("--min-age-hours", type=float, default=24.0,
                    help="never reap a branch younger than this (default 24)")
    ap.add_argument("--list", action="store_true", help="inventory only; classify nothing as candidate")
    ap.add_argument("--execute", action="store_true", help="actually delete candidates")
    args = ap.parse_args()

    token = os.environ.get("NEON_API_KEY", "").strip()
    if not token:
        die("NEON_API_KEY is empty or unset. Deliver it with: "
            "wl-secret neon-api-key=NEON_API_KEY -- <this command>", code=78)

    try:
        project = resolve_project(token, args.project_id)
        branches = all_branches(token, project)
    except RuntimeError as e:
        die(str(e))

    print(f"project {project}: {len(branches)} branches total")
    if not branches:
        die("listed zero branches; refusing to report a clean result from an empty read")

    open_heads = None if args.list else open_pr_heads(args.repo)
    buckets = classify(branches, open_heads, args.min_age_hours)
    if args.list:
        buckets["candidate"], buckets["held"] = [], buckets["held"] + buckets["candidate"]
    render(buckets)

    candidates = [b for b, _ in buckets["candidate"]]
    extra = max(0, len(branches) - 10)  # Launch plan includes 10 branches
    print(f"\nsummary: {len(branches)} total, ~{extra} past the 10-branch allowance, "
          f"{len(candidates)} reapable, est. ${extra * 1.50:.2f}/mo now -> "
          f"${max(0, len(branches) - len(candidates) - 10) * 1.50:.2f}/mo after")

    if not args.execute:
        print("\nDRY RUN — nothing deleted. Re-run with --execute to delete the candidates.")
        return 0

    if not candidates:
        print("\nnothing to delete.")
        return 0

    print(f"\ndeleting {len(candidates)} branches…")
    failed = []
    for b in candidates:
        try:
            api(f"/projects/{project}/branches/{b['id']}", token, method="DELETE")
            print(f"  deleted {b['id']}  {b['name']}")
        except RuntimeError as e:
            failed.append((b, str(e)))
            print(f"  FAILED  {b['id']}  {b['name']}: {e}", file=sys.stderr)

    # Verify against the provider rather than trusting our own success count.
    remaining = {b["id"] for b in all_branches(token, project)}
    survivors = [b for b in candidates if b["id"] in remaining]
    print(f"\nverified: {len(candidates) - len(survivors)}/{len(candidates)} gone; "
          f"{len(remaining)} branches remain")
    if failed or survivors:
        print(f"{len(failed)} delete calls failed, {len(survivors)} still present", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
