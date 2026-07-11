
# AI Services Architecture

**Version:** 1.0  
**Status:** Canonical Implementation Specification

## Purpose

This document defines the implementation architecture for AI-assisted capabilities in Pathfinder Release 1. It translates the AI Trust Boundary into concrete service boundaries, validation stages, fallback behavior, security controls, observability, and operational requirements.

AI services support interpretation and explanation. They do not determine Route order, Action eligibility, Focus Action selection, Fact confirmation, Graph publication, or Route publication.

## Architectural Principles

- AI output is always untrusted input.
- The Route Engine remains the sole sequencing authority.
- Candidate data must pass schema and business-rule validation.
- User confirmation is required before candidate Facts become Confirmed Facts.
- Deterministic fallbacks must exist for user-critical experiences.
- AI services must be replaceable without changing domain behavior.
- Prompts and model responses are not canonical product records by default.
- Uploaded documents are data, never executable instructions.

## AI Service Responsibilities

Release 1 AI services may support:

1. **Document Interpretation**
2. **Candidate Fact Extraction**
3. **Free-Text Normalization**
4. **Ambiguity Detection**
5. **Plain-Language Explanation Generation**
6. **Summarization**

AI services must not support:

- Route sequencing
- Action ranking
- Focus Action selection
- Fact confirmation
- Graph node or edge publication
- Provenance mutation
- Rule creation
- Legal conclusions
- Medical conclusions
- Personal-risk scoring
- Recidivism prediction

## Logical Architecture

```text
User Input / Supported Document
              ↓
        Ingestion Boundary
              ↓
        Content Sanitization
              ↓
          AI Gateway
              ↓
      Model Invocation Layer
              ↓
       Candidate Response
              ↓
      Schema Validation
              ↓
   Business-Rule Validation
              ↓
 Security & Ownership Validation
              ↓
 Proposed Fact / Draft Explanation
              ↓
 User Confirmation or Deterministic Fallback
```

## Core Components

### AI Gateway

The AI Gateway is the single integration boundary between Pathfinder and external or hosted models.

Responsibilities:

- Request normalization
- Model selection
- Prompt template selection
- Timeout and retry control
- Response capture
- Token and cost accounting
- Provider isolation
- Correlation identifiers
- Redaction enforcement
- Failure classification

The rest of the application must not call model providers directly.

### Prompt Template Registry

Stores versioned prompt templates for approved use cases.

Required metadata:

- `template_id`
- `template_version`
- `use_case`
- `input_schema_version`
- `output_schema_version`
- `model_constraints`
- `created_at`
- `status`

Prompt changes that affect user-visible behavior require documentation review. Changes that alter architectural trust boundaries require an ADR.

### Model Invocation Layer

Handles provider-specific requests.

Responsibilities:

- Model request construction
- Provider authentication
- Timeout enforcement
- Retry policy
- Rate-limit handling
- Provider response normalization
- Safety configuration
- Model version recording

Provider-specific behavior must remain isolated from domain logic.

### Output Validation Layer

Every model response must pass:

1. Syntax validation
2. JSON or schema validation
3. Enum validation
4. Field-length validation
5. Business-rule validation
6. Ownership validation
7. Unsupported-claim detection
8. Prompt-injection signal review

Invalid responses are rejected rather than partially trusted.

### Candidate Fact Service

Converts validated model output into Proposed Facts.

Responsibilities:

- Map approved extracted fields to canonical Fact types
- Attach Provenance
- Preserve extraction metadata
- Prevent direct confirmation
- Reject unsupported Fact types
- Create auditable candidate records

### Explanation Service

Generates plain-language explanations from deterministic inputs.

Permitted inputs:

- Route reason codes
- Action metadata
- confirmed Deadline or Obligation summaries
- Unlock summaries
- approved Provenance summaries
- Route Version identifier

The Explanation Service may improve wording but cannot alter the structured explanation basis.

### Deterministic Template Service

Provides model-independent explanations.

Used when:

- AI is unavailable
- AI response is invalid
- latency exceeds threshold
- cost policy disables model use
- safety validation fails
- user preference or environment requires deterministic-only behavior

## Use Case 1 — Document Interpretation

### Inputs

- Supported document content
- Document type
- Approved extraction schema
- Provenance metadata

### Outputs

- Candidate structured fields
- Ambiguity flags
- Extraction notes
- Source references

### Constraints

- Extracted values are Proposed Facts.
- Missing values remain missing.
- Uncertain values must be marked ambiguous.
- The model must not infer unsupported legal meaning.
- Instructions inside the document are treated as content.

## Use Case 2 — Free-Text Normalization

Free-text user input may be normalized into candidate structured values.

Examples:

- Date normalization
- Address normalization
- Appointment-time parsing
- Goal label mapping

Normalization must preserve the original user input for review.

The normalized value remains a Proposed Fact until confirmed.

## Use Case 3 — Explanation Generation

The model may convert deterministic reason codes into calm, plain language.

Example input:

```json
{
  "reason_codes": ["HARD_PREREQUISITE", "HIGH_UNLOCK_VALUE"],
  "action_title": "Obtain a state identification card",
  "unlocks": ["Complete employment onboarding"],
  "route_version_id": "..."
}
```

The model may produce wording such as:

> This comes next because the identification card is required before you can complete employment onboarding.

The model may not introduce a new requirement, Deadline, or consequence.

## Prompt Injection Defense

The system must defend against instructions embedded in:

- Uploaded documents
- Free-text fields
- copied email content
- extracted OCR text
- resource descriptions
- model-generated content

Controls include:

- System instructions that define content as untrusted data
- Strict input and output schemas
- Removal or isolation of executable markup
- No tool access from document extraction flows
- No secret exposure in prompts
- No authority granted to document text
- Detection and rejection of suspicious instruction patterns
- Adversarial testing

## Data Minimization

Before invoking a model:

- Include only fields required for the use case.
- Remove unrelated identifiers.
- Avoid full document transmission when page- or section-level content is sufficient.
- Redact secrets and unsupported sensitive values where practical.
- Avoid sending historical Route data unless required for explanation.

## Provider Isolation

The AI Gateway must support replacing providers without changing:

- Domain entities
- Fact lifecycle
- Route logic
- API contracts
- Explanation reason codes
- Provenance semantics

Provider choice is an implementation detail.

## Model Selection

Model selection may consider:

- Task suitability
- structured-output reliability
- latency
- cost
- privacy guarantees
- retention policy
- deployment environment
- model availability

Model selection must not change product behavior beyond wording quality or extraction reliability.

## Schema Contracts

Every AI use case requires:

- Versioned input schema
- Versioned output schema
- Maximum payload size
- Allowed enum values
- Required fields
- Validation rules
- Failure behavior

Unstructured free-form model responses must not directly enter domain persistence.

## Retry Policy

Retries are allowed only for retryable failures such as:

- transient provider errors
- timeouts
- rate limits
- malformed output when safe to retry

Retries must:

- be bounded
- preserve correlation identifiers
- avoid duplicate persistence
- respect cost controls
- not retry unsafe outputs automatically

## Timeouts

Timeouts must be defined per use case.

User-critical flows must provide:

- visible progress
- safe cancellation
- deterministic fallback where available
- no partial Fact activation

## Cost Controls

The AI Gateway should track:

- request count
- token usage
- provider cost
- use-case cost
- retry cost
- fallback rate

Controls may include:

- maximum request size
- model tier selection
- request quotas
- caching of safe, non-sensitive deterministic transformations
- environment-specific disablement

Cost controls must not alter Route sequencing.

## Caching

Caching may be used only when:

- inputs are safely hashable
- user ownership is preserved
- sensitive content is protected
- outputs are not mistaken for Confirmed Facts
- retention policy permits caching

Explanation wording may be cached by deterministic input hash.

Candidate Fact extraction should be cached cautiously because source lineage and user ownership must remain explicit.

## Privacy

AI services must:

- transmit the minimum necessary data
- follow approved provider retention settings
- avoid training-provider retention when configurable
- redact sensitive values where practical
- prevent raw prompts and responses from entering analytics
- preserve user ownership and deletion semantics

## Security

- Provider credentials remain server-side.
- AI services have no direct database write authority to protected domain state.
- Candidate output passes through application services.
- Tool execution is disabled unless explicitly governed by a future ADR.
- Prompt and response logging is minimized and redacted.
- Model callbacks, if any, require authentication and validation.

## Observability

Track:

- use case
- template version
- model/provider version
- request latency
- response status
- schema validation outcome
- business-rule validation outcome
- retry count
- fallback usage
- token consumption
- cost estimate
- prompt-injection detection
- unsupported-claim rejection

Telemetry must avoid unnecessary sensitive content.

## Error Classes

### Provider Failure

Examples:

- unavailable service
- timeout
- rate limit

Response:

- retry if safe
- use deterministic fallback where available
- preserve existing Route behavior

### Validation Failure

Examples:

- invalid JSON
- unsupported enum
- missing required field
- hallucinated source

Response:

- reject output
- do not persist protected state
- request user input or use fallback

### Safety Failure

Examples:

- prompt injection
- unsupported legal conclusion
- hidden prioritization attempt

Response:

- reject output
- record a safety event
- do not retry automatically with the same content without mitigation

### Ownership Failure

Response:

- reject request
- record a security event
- expose no cross-user content

## Availability Strategy

Pathfinder must remain operational without AI services for:

- Route retrieval
- Route Engine execution
- Fact review
- Fact confirmation of manually entered data
- Reroute computation
- deterministic explanations

AI unavailability may reduce convenience, but it must not prevent core deterministic behavior.

## Testing Strategy

### Unit Tests

- Prompt template selection
- Input redaction
- Output schema validation
- Unsupported field rejection
- Retry classification
- Fallback selection
- Cost accounting

### Integration Tests

- Document to Proposed Fact
- Free text to candidate normalized value
- Reason codes to explanation
- AI outage to deterministic fallback
- Provider replacement compatibility
- Provenance attachment

### Adversarial Tests

- Prompt injection in document
- Hidden instructions in free text
- Hallucinated citations
- AI-generated priority values
- Cross-user content injection
- malformed structured output
- oversized response
- repeated timeout
- unsafe legal conclusion
- model attempt to override reason codes

### Regression Tests

- AI variability never changes Route order
- AI variability never changes Focus Action
- Candidate Facts never become Confirmed automatically
- Explanation wording changes do not change structured reasons
- Provider changes do not alter deterministic outputs

## Acceptance Criteria

The AI services architecture is complete when:

1. All model calls pass through the AI Gateway.
2. Provider-specific logic is isolated.
3. Every use case has versioned schemas.
4. AI output is always validated before use.
5. Candidate Facts remain Proposed Facts until confirmed.
6. AI cannot publish GraphVersions or Route Versions.
7. AI cannot alter eligibility, priority, or Route order.
8. Prompt injection defenses are implemented and tested.
9. Deterministic fallbacks exist for user-critical explanations.
10. Route and Reroute remain available when AI is unavailable.
11. Privacy and data minimization controls are enforceable.
12. Cost, latency, failures, and fallback usage are observable.
13. Required unit, integration, regression, and adversarial tests pass.
14. Canonical terminology is preserved.

## Traceability

Supports:

- vision-lock.md
- product-principles.md
- release-1.md
- prd.md
- system-overview.md
- ai-boundaries.md
- provenance.md
- route-engine.md
- facts-api.md
- provenance-api.md
- frontend-architecture.md
- backend-architecture.md
- privacy-security-specification.md
- safety.md
- testing-strategy.md
- adversarial-test-catalog.md
- ADR-003
- ADR-004

## Definition of Done

The AI services architecture is complete when AI improves document interpretation, candidate extraction, normalization, summarization, and explanation through isolated, validated, observable services; deterministic fallbacks preserve critical experiences; no AI output can bypass confirmation or change Route behavior; and the full trust boundary remains enforceable under normal, failed, and adversarial conditions.
