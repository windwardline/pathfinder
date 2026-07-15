# Release 1.2 Record

**Version:** 1.2.0  
**Release Date:** 2026-07-15  
**Status:** Approved release candidate; tag records the immutable commit

## Identity

- Application: `1.2.0`
- Engine: `release-1.0`
- Rule set: `release-1.0`
- Schema migration: `0005_sloppy_tag`
- Production domain: `pathfinder.windwardline.com`
- Commit: the commit referenced by annotated repository tag `v1.2.0`

## User-Visible Changes

- Guided first-use Fact intake
- Multi-type Proposed Fact extraction with unchanged AI trust boundary
- Correction through Proposed supersession for every user-facing Fact type
- Server-derived deadline urgency
- Provenance evidence details
- Complete moved-Action presentation in Route History
- Actionable blocked Route state

## Operational Changes

- Real Route Engine health canary
- Pseudonymous account-deletion ledger and recovery reapplication
- Dependency update automation
- Vercel Preview documented as the staging boundary
- Requirements traceability and validation-study artifacts
- A repository-visible TDD case study for deterministic deadline urgency
- SHA-pinned automation, Semgrep, license policy, and dependency alerts

## Release Gates

The release requires documentation validation, lint, typecheck, unit and
integration tests, browser acceptance, security analysis, production build,
Vercel deployment, and post-deployment health verification.

## Known Limitations

- H1 through H4 remain hypotheses until participant results are entered.
- The AI extraction provider is optional; manual Fact capture preserves full routing functionality.
- Provider-level point-in-time restore evidence is operational rather than repository-automated.
- Vercel rebuilds each environment rather than promoting one byte-identical artifact.
