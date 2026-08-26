# Pathfinder Security Policy

## Reporting a Vulnerability

Do not disclose suspected vulnerabilities, credentials, personal data, or exploit details in a public issue or pull request.

After the GitHub repository is created, use its private vulnerability-reporting or Security Advisory workflow. If private reporting is not available, contact the repository owner through an approved private channel before sharing technical details.

Include only the information needed to reproduce and assess the issue:

- affected component and version or commit;
- prerequisites and reproduction steps;
- observed and expected behavior;
- potential security, privacy, safety, or integrity impact; and
- any known mitigation.

Do not include real user data, active credentials, tokens, private keys, or production secrets.

## Priority Boundaries

The following are security-critical Pathfinder boundaries:

- cross-user data isolation and ownership;
- authentication and authorization;
- Confirmed Fact and Proposed Fact separation;
- Provenance integrity;
- Route and GraphVersion publication integrity;
- Route Engine sequencing authority;
- AI trust-boundary enforcement;
- export, deletion, retention, backup, and recovery behavior; and
- secret handling in applications, automation, and infrastructure.

## Canonical Requirements

This policy supports, and does not replace, the canonical [Privacy and Security Specification](docs/04-risk/privacy-security-specification.md), [Safety Specification](docs/04-risk/safety.md), [Data Lifecycle](docs/08-data/data-lifecycle.md), and [Incident Response](docs/10-operations/incident-response.md).

The production security scope is `https://pathfinder.windwardline.com`.

Security changes must follow repository governance, include appropriate tests, and update canonical documentation when requirements or behavior change.
