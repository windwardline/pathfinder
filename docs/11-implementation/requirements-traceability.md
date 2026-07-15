# Release 1 Requirements Traceability

**Version:** 1.0  
**Status:** Canonical Implementation Evidence

## Purpose

This matrix distinguishes implemented behavior from partial or externally
dependent work. A passing documentation validator proves document integrity; it
does not by itself prove semantic implementation conformance.

| Capability | Status | Primary evidence | Remaining boundary |
|---|---|---|---|
| Governance baseline and decisions | Implemented | Design Freeze, PD-001, ADR-001–006 | New behavior still requires governed decisions |
| Protected `main` and required checks | Implemented operationally | GitHub ruleset and CI workflows | Repository setting is verified at release time |
| Identity, ownership, migrations | Implemented | Auth.js, Drizzle migrations, cross-user tests | Organization administration is out of scope |
| Proposed and Confirmed Fact lifecycle | Implemented | Facts APIs and lifecycle integration suite | Participant comprehension remains unvalidated |
| Provenance and integrity | Implemented | Provenance API, hashes, UI evidence details | Raw document storage remains out of scope |
| Domain Facts and Dependency Graph | Implemented | GraphVersion, domain Fact schemas, golden fixtures | Physical persistence follows ADR-006 compact projection |
| Deterministic Route Engine | Implemented | RouteEngine unit, metamorphic, performance, and health-canary tests | Rule changes require versioning and regression |
| Reroute and Route History | Implemented | RouteDiff, immutable snapshots, browser journey | Human Reroute comprehension remains unvalidated |
| Bounded AI extraction | Implemented | Prompt registry, strict schemas, Proposed-only persistence | Service is optional and provider-dependent |
| Adaptive frontend and guided intake | Implemented | Today, Route, Facts, History, Account, E2E and accessibility tests | Longitudinal usability remains unvalidated |
| Security and abuse resistance | Implemented for Release 1 | IDOR, lifecycle, injection, rate-limit, secret and dependency scans | External penetration testing is not claimed |
| Deployment and monitoring | Implemented for pilot | Vercel, production health, alerts, release identity | Vercel rebuilds rather than promotes one immutable artifact |
| Backup, restore, deletion propagation | Implemented and rehearsed synthetically | Weekly recovery drill and pseudonymous deletion reapplication | Provider-level restore exercise requires Neon control-plane execution |
| Human product validation | In progress | Release 1 Validation Study | Real participant sessions are required |

## Release Truth Rule

Marketing, demonstrations, and repository documentation may describe an item as
validated only when its evidence row is complete. Technical verification and
human product validation are reported separately.

