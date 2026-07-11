## Purpose

Describe the problem and the bounded outcome of this pull request.

## Scope

List the files, components, or behaviors intentionally changed.

## Non-goals

State what this pull request intentionally does not change.

## Authority and Traceability

- Issue or governed work item:
- Canonical documents reviewed:
- Product Decision, if required:
- ADR, if required:

## Verification Evidence

- Tests added or updated:
- Commands executed:
- Relevant results:
- Manual verification, if applicable:

## Documentation and Operational Impact

- Canonical documentation changed:
- Migration or compatibility impact:
- Security, privacy, or safety impact:
- Deployment, monitoring, rollback, or recovery impact:

## Protected-Invariant Review

- [ ] The Route remains the primary product artifact.
- [ ] Reroute is triggered only by confirmed, routing-relevant change.
- [ ] The Route Engine remains the sole sequencing authority.
- [ ] The Dependency Graph remains infrastructure.
- [ ] Proposed Facts have zero routing effect until confirmation.
- [ ] Provenance and user ownership are preserved.
- [ ] AI does not confirm Facts, sequence Actions, publish Routes, or alter protected state.
- [ ] Protected terminology remains unchanged.
- [ ] The change remains within Release 1 scope or includes required approval.

## Completion Checklist

- [ ] The change is focused and contains no unrelated redesign.
- [ ] Formatting, linting, static analysis, build, and applicable tests pass.
- [ ] Expected-output changes are intentional and governed.
- [ ] Documentation and traceability are synchronized.
- [ ] No credentials, secrets, private data, or generated artifacts are included.
- [ ] Applicable Definition of Done criteria are satisfied.
