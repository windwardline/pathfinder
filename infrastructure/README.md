# Release 1 Infrastructure Contract

Pathfinder uses managed infrastructure with configuration stored in provider
control planes and non-secret policy recorded here.

| Capability | Release 1 implementation |
|---|---|
| Application build and deployment | Vercel Git integration, repository root, production from `main` |
| Staging | Vercel Preview deployment for each pull request |
| Production database | Neon Postgres with seven-day point-in-time restore |
| Authentication email | Resend through Auth.js |
| Candidate Fact extraction | Groq gateway; optional and outside routing authority |
| Release verification | GitHub Actions plus `/api/health` deterministic canary |
| Failure notification | Privacy-safe GitHub issue; optional Zapier subscription to the issue label |

Secrets and connection strings are never stored in this directory. The
provider project identifiers, domain binding, Git production branch, rollback
procedure, and recovery evidence are recorded in the canonical operations
documentation and release record.

Vercel Preview is the Release 1 staging boundary. It validates the exact pull
request commit, but it is not an immutable artifact promotion system: Vercel
rebuilds each deployment. Canonical documentation must describe that limitation
instead of claiming byte-for-byte artifact promotion.

## Preview database lifecycle

Neon's Vercel integration creates a `preview/<git-branch>` database for each
preview deployment. It deletes that database when the Vercel *deployment* is
removed, which under Vercel's default retention is six months later. Closing a
pull request and deleting the git branch does not remove the database.

That coupling is the whole of the August 2026 bill: 39,484 surplus branch-hours,
$79.60 of an $81.78 invoice, against $2.18 of actual compute and storage. One
merged pull request added roughly $1.50 per month and nothing gave it back.

`.github/workflows/neon-branch-cleanup.yml` puts the database on the pull
request's clock. It reaps the branch when the pull request closes and sweeps
weekly for anything that reap missed. `scripts/neon_branches.py` is the same
logic as a local tool; it dry-runs by default and needs `--execute` to delete.

The reaper never deletes the default branch, a protected branch, a branch
outside `preview/*`, a branch whose pull request is still open, or a branch
younger than 24 hours. If it cannot determine pull request state it holds
everything rather than guessing. `scripts/test_neon_branches.py` asserts each of
those refusals.

## Deployment cost

Vercel bills Build CPU Minutes per deployment, and the charge is fixed per-deploy
overhead — container provision, install, artifact upload — rather than build
duration. This project's build step runs in 21-31s, yet Aug 3 - Sep 2 billed
roughly 8 CPU-minutes per deploy. Optimising the build step would save almost
nothing; not deploying a commit that changes nothing deployable saves the whole
deploy.

`apps/web/vercel.json` therefore carries an `ignoreCommand` running
`scripts/vercel-ignore-build.sh`. It skips only when every changed path is
`docs/`, `.github/`, `infrastructure/`, `artifacts/`, `tools/`, or `*.md`, and
builds on anything else — including an unreadable diff, a missing parent commit,
and an empty file list. A wrong skip ships stale code invisibly; a wrong build
costs a fraction of a cent.

This change is itself the acceptance test: it touches only this file, so the
deployment it triggers should be skipped rather than built.

Required configuration: repository secret `NEON_API_KEY` and repository
variable `NEON_PROJECT_ID`. The workflow distinguishes three states: no
`NEON_PROJECT_ID` means the repo is not a Neon project and it skips green;
`NEON_PROJECT_ID` without `NEON_API_KEY` fails with exit 78, because a
half-configured reaper deletes nothing while appearing healthy; both present
reaps. The file is byte-identical to `templates/neon-branch-cleanup.yml` in
windwardline, and `scripts/fleet-conformance.sh` compares the blobs.
