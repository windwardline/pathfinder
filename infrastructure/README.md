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
