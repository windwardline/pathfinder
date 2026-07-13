import { z } from 'zod';

export const actionPayloadSchema = z.object({
  key: z.literal('ACTION'),
  value: z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).default(''),
    status: z.enum(['OPEN', 'COMPLETED']).default('OPEN'),
  }),
  sourceText: z.string().trim().max(1000).optional(),
});

export const dependencyPayloadSchema = z.object({
  key: z.literal('DEPENDENCY'),
  value: z.object({
    sourceId: z.string().uuid(),
    targetId: z.string().uuid(),
    type: z.enum(['BLOCKS', 'REQUIRES']),
  }),
  sourceText: z.string().trim().max(1000).optional(),
});

export const factPayloadSchema = z.discriminatedUnion('key', [
  actionPayloadSchema,
  dependencyPayloadSchema,
]);

export const provenanceSchema = z.object({
  source: z.string().trim().min(1).max(40),
  confidence: z.number().int().min(1).max(100).optional(),
});

export const proposeFactSchema = z.object({
  action: z.literal('propose'),
  payload: factPayloadSchema,
  provenance: provenanceSchema,
});

export const confirmFactSchema = z.object({
  action: z.literal('confirm'),
  factId: z.string().uuid(),
});

export const rejectFactSchema = z.object({
  action: z.literal('reject'),
  factId: z.string().uuid(),
});

export const factsRequestSchema = z.discriminatedUnion('action', [
  proposeFactSchema,
  confirmFactSchema,
  rejectFactSchema,
]);

export const completeActionSchema = z.object({
  actionId: z.string().uuid(),
});

export const extractRequestSchema = z.object({
  text: z.string().trim().min(1).max(5000),
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
