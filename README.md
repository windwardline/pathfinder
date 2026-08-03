# Pathfinder

Pathfinder builds and continuously updates a user's Reentry Route. It shows what comes next, why it comes next, and what it unlocks.

An independent product, built end-to-end and run in production.

## Repository Status

- Product baseline: Version 2 Design Freeze
- Implementation scope: Release 1
- Current phase: Release 1.2 production release
- Live product: [pathfinder.windwardline.com](https://pathfinder.windwardline.com)
- Canonical source: Markdown documentation in [`docs/`](docs/)
- Demo Day film: [`docs/demo/`](docs/demo/)

[![CI](https://github.com/windwardline/pathfinder/actions/workflows/ci.yml/badge.svg)](https://github.com/windwardline/pathfinder/actions/workflows/ci.yml)
[![Security analysis](https://github.com/windwardline/pathfinder/actions/workflows/security.yml/badge.svg)](https://github.com/windwardline/pathfinder/actions/workflows/security.yml)
[![Documentation validation](https://github.com/windwardline/pathfinder/actions/workflows/documentation.yml/badge.svg)](https://github.com/windwardline/pathfinder/actions/workflows/documentation.yml)
[![Production health](https://github.com/windwardline/pathfinder/actions/workflows/production-health.yml/badge.svg)](https://github.com/windwardline/pathfinder/actions/workflows/production-health.yml)

Instructor publications are derived artifacts. They do not supersede the canonical Markdown corpus.

## Product and Architecture Invariants

Pathfinder follows this canonical authority flow:

```text
Confirmed Facts → Dependency Graph → Route Engine → Route → Adaptive Route View
```

- The Route is the primary product artifact.
- Reroute is the governed response to confirmed change.
- The Route Engine is the sole sequencing authority.
- The Dependency Graph is infrastructure.
- Only Confirmed Facts may affect routing.
- Proposed Facts have no routing effect until explicitly confirmed.
- Provenance is required for route-affecting Facts.
- AI may interpret, extract, summarize, and explain; it may not sequence or prioritize Actions.

## Start Here

Read these documents before implementation:

1. [Documentation Constitution](docs/00-governance/documentation-constitution.md)
2. [Documentation Index](docs/00-governance/documentation-index.md)
3. [Vision Lock](docs/00-governance/vision-lock.md)
4. [Glossary](docs/00-governance/glossary.md)
5. [Product Principles](docs/00-governance/product-principles.md)
6. [Version 2 Design Freeze](docs/00-governance/version-2-design-freeze.md)
7. [Release 1](docs/01-product/release-1.md)
8. [System Overview](docs/02-architecture/system-overview.md)
9. [Architecture Decision Records and Product Decisions](docs/05-decisions/)
10. [Definition of Done](docs/06-development/definition-of-done.md)
11. [Requirements Traceability](docs/11-implementation/requirements-traceability.md)
12. [Release 1 Validation Study](docs/03-research/release-1-validation-study.md)

## Local Development

```bash
pnpm install
pnpm dev        # starts apps/web on http://localhost:3000
pnpm typecheck  # tsc --noEmit across packages
pnpm test       # unit, adversarial, integration, and performance suites
pnpm lint
pnpm build
```

Required environment variables (set in `apps/web`'s environment or a root
`.env.local`; production values live in Vercel project settings, never in
the repository):

| Variable | Purpose |
|---|---|
| `POSTGRES_URL` (or `DATABASE_URL`) | Postgres connection string |
| `AUTH_SECRET` | NextAuth session encryption (`openssl rand -base64 32`) |
| `AUTH_URL` | Canonical origin the sign-in email links to. Origin only — a path segment moves every auth route. Production: `https://pathfinder.windwardline.com` |
| `RESEND_API_KEY` | Magic-link sign-in email delivery |
| `AUTH_RESEND_FROM` | Verified sender address for sign-in email |
| `GROQ_API_KEY` | AI fact extraction (optional — the app degrades gracefully) |
| `GROQ_MODEL` | Optional model override (default `openai/gpt-oss-120b`) |

Apply versioned database migrations with
`pnpm --filter @pathfinder/core db:migrate`. A signed-in user can load the
seeded demonstration scenario (SD-001) from the empty state on Today.

## Repository Layout

```text
docs/            Canonical product and engineering documentation
apps/            User-facing applications; no routing authority
services/        Backend business capabilities and Route Engine ownership
packages/        Shared domain models, validation, types, and utilities
tests/           Unit, integration, regression, fixture, adversarial, and performance tests
scripts/         Developer automation without business logic
infrastructure/  Deployment and environment automation
tools/           Internal engineering utilities
.github/         Repository automation and contribution support
```

## Contribution Governance

Documentation leads implementation. Product changes require an approved Product Decision, architectural changes require an ADR, and all contributions must preserve protected terminology and the Version 2 Design Freeze.

See the canonical [Contributing Guide](docs/06-development/contributing.md) and [Repository Governance](docs/00-governance/repository-governance.md).

## License

Copyright © 2026 Michael Lynn Peacock. All rights reserved. Pathfinder is proprietary; no permission to use, copy, modify, or distribute the repository is granted without prior written permission. See [LICENSE](LICENSE).
