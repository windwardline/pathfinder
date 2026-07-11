
# Technology Stack

**Version:** 1.0
**Status:** Canonical Implementation Specification

## Purpose

This document defines the approved technology stack for Pathfinder Release 1 and the governance for introducing, replacing, or upgrading implementation technologies.

## Principles

- Technology supports the architecture; it does not redefine it.
- Favor mature, well-supported, widely adopted technologies.
- Minimize unnecessary dependencies.
- Prioritize maintainability, determinism, security, and testability.
- Significant technology changes require architectural governance.

## Selection Criteria

Approved technologies should provide:

- Long-term support
- Strong security posture
- Active maintenance
- Comprehensive documentation
- Automated testing support
- Compatibility with the canonical architecture

## Technology Categories

### Backend

Responsibilities:

- Domain model
- Route Engine
- APIs
- Persistence
- Authentication
- Authorization
- Background processing

### Frontend

Responsibilities:

- Route View
- Focus Action
- Fact confirmation
- Explanation presentation
- Reroute visualization

### Data

Responsibilities:

- Relational system of record
- Versioned persistence
- Deterministic replay
- Provenance storage

### AI Services

Responsibilities:

- Explanation assistance
- Structured extraction
- Candidate fact generation

AI services must never bypass the Confirmed Fact trust boundary.

### Infrastructure

Responsibilities:

- Hosting
- Networking
- Secret management
- Monitoring
- Backup
- Recovery

### Development Tooling

Should include:

- Version control
- Formatter
- Linter
- Static analysis
- Test framework
- Documentation tooling
- CI automation

## Dependency Governance

Before introducing a new dependency, evaluate:

- Maintenance activity
- Security history
- License compatibility
- Community adoption
- Repository impact
- Long-term support

Unused dependencies should be removed promptly.

## Version Management

- Pin production dependencies.
- Review dependency updates regularly.
- Validate upgrades through regression testing.
- Breaking upgrades require compatibility review.

## Security Requirements

Approved technologies must support:

- Encryption in transit
- Secure secret management
- Authentication
- Authorization
- Audit logging
- Vulnerability remediation

## Change Control

Technology changes require:

- Documentation updates
- Testing impact assessment
- Architecture review when applicable
- ADR for architectural changes

## Traceability

Supports:

- implementation-roadmap.md
- repository-bootstrap.md
- data-architecture.md
- deployment-strategy.md
- coding-standards.md
- testing-strategy.md

## Definition of Done

The technology stack is complete when every implementation layer has an approved technology category, dependency governance exists, security and maintenance expectations are defined, and future technology changes follow documented governance.
