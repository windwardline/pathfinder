import { and, eq, sql } from 'drizzle-orm';
import { idempotencyRecords } from '@pathfinder/core';
import type { DatabaseExecutor } from './route-service';
import { sha256 } from './integrity';

export class IdempotencyConflictError extends Error {
  constructor() {
    super('This idempotency key was already used for a different request.');
    this.name = 'IdempotencyConflictError';
  }
}

/**
 * Serializes a mutation by user/operation/key and replays the original response.
 * Call inside the same database transaction as the protected mutation.
 */
export async function withIdempotency<T>(
  executor: DatabaseExecutor,
  input: {
    userId: string;
    operationType: string;
    idempotencyKey: string;
    request: unknown;
  },
  operation: () => Promise<T>
): Promise<{ value: T; replayed: boolean }> {
  const requestHash = sha256(input.request);
  const scope = `${input.userId}:${input.operationType}:${input.idempotencyKey}`;
  await executor.execute(sql`select pg_advisory_xact_lock(hashtext(${scope}))`);

  const [existing] = await executor
    .select()
    .from(idempotencyRecords)
    .where(
      and(
        eq(idempotencyRecords.userId, input.userId),
        eq(idempotencyRecords.operationType, input.operationType),
        eq(idempotencyRecords.idempotencyKey, input.idempotencyKey)
      )
    )
    .limit(1);

  if (existing) {
    if (existing.requestHash !== requestHash) throw new IdempotencyConflictError();
    return { value: existing.responseData as T, replayed: true };
  }

  const value = await operation();
  const stored = JSON.parse(JSON.stringify(value)) as T;
  await executor.insert(idempotencyRecords).values({
    userId: input.userId,
    operationType: input.operationType,
    idempotencyKey: input.idempotencyKey,
    requestHash,
    responseData: stored as object,
  });
  return { value, replayed: false };
}

export { sha256 };
