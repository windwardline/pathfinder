
# Backend Architecture

**Version:** 1.0
**Status:** Canonical Implementation Specification

## Purpose

This document defines the logical backend architecture for Pathfinder Release 1. It specifies responsibilities, boundaries, and interactions without changing the Version 2 Design Freeze.

## Architectural Principles

- The backend enforces the Route-first architecture.
- Only Confirmed Facts influence routing.
- Domain logic is independent of delivery mechanisms.
- APIs expose capabilities, not implementation details.
- Published Route Versions and GraphVersions are immutable.

## Logical Layers

### Presentation Layer
- API endpoints
- Authentication
- Authorization
- Request validation
- Response serialization

### Application Layer
- Use cases
- Command orchestration
- Query orchestration
- Transaction coordination

### Domain Layer
- Route Engine
- Fact lifecycle
- Provenance
- Dependency Graph
- Plan logic
- Reroute logic

### Infrastructure Layer
- Persistence
- Messaging
- Background jobs
- Logging
- Monitoring
- External integrations

## Core Services

- Identity Service
- Fact Service
- Provenance Service
- Route Service
- Reroute Service
- Explanation Service
- Rule Service
- Audit Service

## Transaction Boundaries

Atomic operations include:

- Fact confirmation
- Route publication
- GraphVersion publication
- Reroute publication

Partial publication is prohibited.

## Background Processing

Background work may include:

- Document processing
- Candidate Fact extraction
- Explanation generation
- Maintenance tasks

Background services must never bypass the Confirmed Fact trust boundary.

## Security

The backend shall enforce:

- Authentication
- Authorization
- Ownership validation
- Input validation
- Audit logging
- Least privilege

## Observability

Capture:

- Request tracing
- Route latency
- Reroute latency
- Error rates
- Background job outcomes

## Quality Gates

Implementation must preserve:

- Deterministic routing
- Immutable published artifacts
- Provenance integrity
- API compatibility
- Canonical terminology

## Traceability

Supports:

- implementation-roadmap.md
- technology-stack.md
- route-engine.md
- route-api.md
- facts-api.md
- provenance-api.md
- reroute-api.md
- data-architecture.md

## Definition of Done

The backend architecture is complete when responsibilities, service boundaries, transactions, and operational requirements are fully defined and remain consistent with the Version 2 Design Freeze.
