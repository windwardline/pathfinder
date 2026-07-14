# Independent E2E Review Prompt (Codex)

Paste everything below this line into Codex from the repository root.

---

You are performing an independent, adversarial end-to-end review of the
Pathfinder capstone project on branch `feature/release-1-route-experience`.
Another engineer just completed a major rebuild; your job is to try to break
it and to flag anything that would embarrass the author in a live demo before
hiring managers and investors. Do not assume the rebuild is correct.

## Ground rules

- Work read-only against git: do NOT commit, push, or amend anything.
- NEVER read or print `.env*` files, `*_key.txt`, or any credential values.
- Do NOT connect to any remote/production database or modify Vercel state.
  For runtime checks use a local throwaway Postgres:
  `createdb pathfinder_review && POSTGRES_URL=postgres://localhost:5432/pathfinder_review pnpm --filter @pathfinder/core db:push`
- Run the app with: `POSTGRES_URL=postgres://localhost:5432/pathfinder_review AUTH_SECRET=$(openssl rand -base64 32) pnpm dev`
  (from `apps/web`). To authenticate without email, insert a user + session
  row directly and set the `authjs.session-token` cookie.

## What to verify (in order)

1. **Docs conformance.** `docs/` is the canonical product constitution.
   Read `docs/00-governance/vision-lock.md`, `glossary.md`,
   `docs/01-product/release-1.md`, `docs/02-architecture/route-engine.md`,
   `docs/05-decisions/ADR-001..005`, and
   `docs/11-implementation/frontend-architecture.md`. Then audit the app
   against them: protected terminology drift, AI trust boundary (ADR-003 —
   the LLM must never sequence or confirm), Confirmed-Fact-only routing
   (ADR-004), no dependency-graph exposure in the UI (ADR-005).
2. **Engine correctness.** `packages/core/src/routing/RouteEngine.ts` and
   `RouteDiff.ts`. Try to construct fact sets that produce nondeterministic
   output, wrong Focus Action selection, unreachable steps, or wrong
   Route Differences. Check: completed-action contraction, stable
   tie-breaks, dangling edges, REQUIRES vs BLOCKS, cycles. Extend
   `packages/core/tests/RouteEngine.test.ts` locally to prove any finding.
3. **API security and contracts.** All routes under `apps/web/src/app/api/`.
   Hunt for: IDOR (cross-user reads/writes), missing validation, error-detail
   leaks, unauthenticated access, lifecycle bypasses (confirming a rejected
   fact, completing a proposed fact), rate-limit gaps, and mutations from
   GET requests. Verify the magic-link flow in `apps/web/src/auth.ts`
   (expiry enforcement, replay window, token cleanup).
4. **Full user journey in a real browser.** Sign in (seeded session), load
   the demonstration scenario from the empty state, verify: Focus Action is
   'Obtain a state identification card' with HARD_PREREQUISITE +
   HIGH_UNLOCK_VALUE reason codes; completing it produces a Reroute dialog
   showing three newly available Actions; a Proposed Fact visibly does NOT
   change the Route until confirmed; confirming triggers a Reroute; Route
   History shows structured differences for every event including the first.
5. **Quality floor.** `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
   must all pass. Check keyboard navigation, focus visibility, reduced-motion
   behavior, dark mode, and a 390px viewport. Check for leftover boilerplate,
   silent catch blocks, and copy that violates the docs' tone rules (no
   punitive/alarming language, no risk-scoring framing).

## Output

A prioritized findings list: severity, file:line, concrete failure scenario,
and a suggested fix. Separate "must fix before demo" from "nice to have."
If you find nothing in a category, say what you tried and why you're
confident. End with the exact commands you ran and their results.
