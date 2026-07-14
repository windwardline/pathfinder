import { z } from 'zod';

export const actionPayloadSchema = z.object({
  key: z.literal('ACTION'),
  value: z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).default(''),
    // Lifecycle state is server-owned. New Actions always start open and may
    // become completed only through /api/actions/complete.
    status: z.literal('OPEN').default('OPEN'),
    goalId: z.string().uuid().optional(),
    routing: z
      .object({
        criticalDeadline: z.boolean().optional(),
        deadline: z.string().datetime().optional(),
        mandatoryObligation: z.boolean().optional(),
        blockerReduction: z.number().int().min(0).max(10_000).optional(),
        goalAlignment: z.number().int().min(0).max(100).optional(),
        userPriority: z.number().int().min(0).max(100).optional(),
        conflictAvoidance: z.number().int().min(0).max(10_000).optional(),
        effortCost: z.number().min(0).max(10_000).optional(),
      })
      .optional(),
  }),
  sourceText: z.string().trim().max(1000).optional(),
});

export const dependencyPayloadSchema = z.object({
  key: z.literal('DEPENDENCY'),
  value: z.object({
    sourceId: z.string().uuid(),
    targetId: z.string().uuid(),
    type: z.enum(['BLOCKS', 'REQUIRES', 'UNLOCKS', 'SUPPORTS', 'CONFLICTS_WITH', 'SATISFIES']),
  }),
  sourceText: z.string().trim().max(1000).optional(),
});

export const goalPayloadSchema = z.object({
  key: z.literal('GOAL'),
  value: z.object({
    title: z.string().trim().min(1).max(120),
    status: z.enum(['ACTIVE', 'ACHIEVED', 'PAUSED', 'ABANDONED']),
    priority: z.number().int().min(0).max(100),
  }),
});

export const requirementPayloadSchema = z.object({
  key: z.literal('REQUIREMENT'),
  value: z.object({
    description: z.string().trim().min(1).max(500),
    status: z.enum(['UNSATISFIED', 'SATISFIED', 'WAIVED', 'UNKNOWN']),
    hardness: z.enum(['HARD', 'SOFT']),
    targetActionId: z.string().uuid(),
    resolutionActionId: z.string().uuid().optional(),
  }),
});

export const constraintPayloadSchema = z.object({
  key: z.literal('CONSTRAINT'),
  value: z.object({
    constraintType: z.enum(['TIME', 'TRANSPORTATION', 'FINANCIAL', 'LOCATION', 'AVAILABILITY', 'ACCESSIBILITY', 'POLICY']),
    description: z.string().trim().min(1).max(500),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUPERSEDED']),
    targetActionIds: z.array(z.string().uuid()).min(1).max(100),
    resolutionActionId: z.string().uuid().optional(),
  }),
});

export const obligationPayloadSchema = z.object({
  key: z.literal('OBLIGATION'),
  value: z.object({
    title: z.string().trim().min(1).max(120),
    status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']),
    startAt: z.string().datetime(),
    endAt: z.string().datetime().optional(),
    conflictActionIds: z.array(z.string().uuid()).max(100).optional(),
    resolutionActionId: z.string().uuid().optional(),
  }),
});

export const deadlinePayloadSchema = z.object({
  key: z.literal('DEADLINE'),
  value: z.object({
    title: z.string().trim().min(1).max(120),
    dueAt: z.string().datetime(),
    severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
    targetActionId: z.string().uuid(),
  }),
});

export const blockerPayloadSchema = z.object({
  key: z.literal('BLOCKER'),
  value: z.object({
    targetActionId: z.string().uuid(),
    reasonCode: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(500),
    active: z.boolean(),
    resolutionActionId: z.string().uuid().optional(),
  }),
});

export const factPayloadSchema = z.discriminatedUnion('key', [
  actionPayloadSchema,
  dependencyPayloadSchema,
  goalPayloadSchema,
  requirementPayloadSchema,
  constraintPayloadSchema,
  obligationPayloadSchema,
  deadlinePayloadSchema,
  blockerPayloadSchema,
]);

export const provenanceSchema = z.object({
  source: z.string().trim().min(1).max(40),
  confidence: z.number().int().min(1).max(100).optional(),
});

export const proposeFactSchema = z.object({
  action: z.literal('propose'),
  payload: factPayloadSchema,
  provenance: provenanceSchema,
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const confirmFactSchema = z.object({
  action: z.literal('confirm'),
  factId: z.string().uuid(),
  confirmationMethod: z.enum(['USER_REVIEW']).default('USER_REVIEW'),
  confirmationNote: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const rejectFactSchema = z.object({
  action: z.literal('reject'),
  factId: z.string().uuid(),
  reasonCode: z.string().trim().min(1).max(80).optional(),
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const supersedeFactSchema = z.object({
  action: z.literal('supersede'),
  factId: z.string().uuid(),
  replacementPayload: factPayloadSchema,
  provenance: provenanceSchema,
  provenanceId: z.string().uuid().optional(),
  reasonCode: z.string().trim().min(1).max(80),
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const expireFactSchema = z.object({
  action: z.literal('expire'),
  factId: z.string().uuid(),
  reasonCode: z.string().trim().min(1).max(80),
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const factsRequestSchema = z.discriminatedUnion('action', [
  proposeFactSchema,
  confirmFactSchema,
  rejectFactSchema,
  supersedeFactSchema,
  expireFactSchema,
]);

export const completeActionSchema = z.object({
  actionId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const extractRequestSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const accountDeletionSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
});

export const accountExportSchema = z.object({
  confirmation: z.literal(true),
});

export const provenanceSourceTypeSchema = z.enum([
  'USER_ENTRY',
  'DOCUMENT_EXTRACTION',
  'VERIFIED_RULE',
  'USER_CORRECTION',
  'SYSTEM_DERIVATION',
]);

export const createProvenanceSchema = z.object({
  source_type: provenanceSourceTypeSchema,
  source_reference: z.string().trim().min(1).max(1_000),
  document_id: z.string().uuid().optional(),
  page_reference: z.string().trim().max(120).optional(),
  section_reference: z.string().trim().max(120).optional(),
  rule_id: z.string().uuid().optional(),
  extraction_metadata: z.record(z.string(), z.unknown()).optional(),
  retention_policy: z.string().trim().max(120).optional(),
  idempotency_key: z.string().trim().min(1).max(200),
});

export const createV1FactSchema = z.object({
  fact_type: z.enum(['ACTION', 'DEPENDENCY', 'GOAL', 'REQUIREMENT', 'OBLIGATION', 'CONSTRAINT', 'DEADLINE', 'BLOCKER']),
  value: z.unknown(),
  provenance_id: z.string().uuid(),
  effective_from: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
  notes: z.string().trim().max(500).optional(),
  source_context: z.string().trim().max(1_000).optional(),
  idempotency_key: z.string().trim().min(1).max(200),
});

/** Shape the AI extraction must return; anything else is rejected. */
export const extractedCandidateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).catch(''),
  sourceText: z.string().trim().max(1000).catch(''),
  confidence: z.number().int().min(1).max(100).catch(50),
});

export const extractedCandidatesSchema = z
  .array(extractedCandidateSchema)
  .max(10);
