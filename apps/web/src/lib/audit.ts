import { auditEvents, db } from '@pathfinder/core';
import type { DatabaseExecutor } from './route-service';

export interface AuditEventInput {
  userId?: string;
  actorId: string;
  eventType: string;
  resourceType: string;
  resourceId: string;
  correlationId: string;
  metadata?: Record<string, string | number | boolean | null>;
}

/** Stores identifiers and categorical metadata only; never Fact or document values. */
export async function recordAuditEvent(
  input: AuditEventInput,
  executor: DatabaseExecutor = db
) {
  await executor.insert(auditEvents).values({
    userId: input.userId ?? null,
    actorId: input.actorId,
    eventType: input.eventType,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    correlationId: input.correlationId,
    metadata: input.metadata ?? null,
  });
}
