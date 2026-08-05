# Pathfinder — operating contract

Operating contract for AI work in this repo; the global `~/AGENTS.md` still applies. Pathfinder builds and continuously updates a user's Reentry Route — what comes next, why, and what it unlocks. Live at pathfinder.windwardline.com. Private and proprietary.

## Workspace

pnpm + turbo monorepo: `apps/web` (Next.js 16 + Auth.js) and `packages/core` (`@pathfinder/core`: db, domain, graph, history, routing). Postgres is hosted on Neon but the client is `drizzle-orm/postgres-js` with `{ prepare: false }` — not Neon serverless. Migrations want the unpooled URL (`POSTGRES_URL_NON_POOLING`). `apps/web` carries its own AGENTS.md (the Next.js version stanza).

## Commands

Root: `pnpm dev` · `build` · `lint` · `typecheck` · `test` (scripts tests, then turbo fan-out). Scoped: `pnpm --filter web <script>` and `pnpm --filter @pathfinder/core <script>`. E2E: `pnpm --filter web exec playwright install --with-deps chromium webkit`, then `pnpm --filter web test:e2e`. Docs gate: `python3 scripts/validate_documentation.py`.

## Gates — seven workflows

`ci.yml`: docs validation → db:migrate (Postgres service) → lint → typecheck → test → e2e → build. `security.yml` (PRs + weekly; a daily cron runs only the Headers live probe): Semgrep, CodeQL, gitleaks, OSV, license policy, plus a Headers live job asserting the seven production headers (push + daily, never PRs) — platform-applied from `apps/web/vercel.json`, contract-tested by `apps/web/tests/security-headers.test.ts`. `documentation.yml`: the docs validator on every PR — a required check with no path filter, deliberately. `production-health.yml`: prod `/api/health` every 15 minutes. `recovery-drill.yml`: weekly backup/restore/deletion-ledger drill. `production-alert.yml`: opens an issue when health or drill fails. `claude-review.yml`: an advisory Claude review on every same-repo PR — deliberately calls the fleet reusable at `@main` (one merge updates every repo) and activates only with the `ANTHROPIC_API_KEY` secret, which fork PRs never receive by security design.

## Laws

- The magic-link flow is scanner-hardened: `apps/web/src/lib/magic-link.ts` rewrites emailed URLs to an inert `/verify` landing page and tokens consume atomically. `sendVerificationRequest` must live inside the `Resend({...})` call in `apps/web/src/auth.ts` — assigned afterward it is silently discarded.
- `AUTH_URL` must be origin-only; a path segment moves every auth route.
- `pnpm-workspace.yaml` is a policy file: 7-day dependency quarantine (`minimumReleaseAge`), no-downgrade trust policy, pinned overrides plus `patches/`. A new dependency can legitimately fail install on age — wait or justify an exclude; don't fight it.
- Tests live in `apps/web/tests` and `packages/core/tests`. The root `/tests` subdirs are `.gitkeep` placeholders the docs validator asserts — leave them.
- Vercel runs `db:migrate` on production deploys only (`apps/web/vercel.json` gates on `VERCEL_ENV`).
- `docs/` (twelve numbered dirs) is canonical and CI-enforced: a change touching documented behavior updates docs in the same PR or `documentation.yml` fails.
