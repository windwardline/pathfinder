import { db, verificationTokens } from '@pathfinder/core';
import { and, eq } from 'drizzle-orm';
import type { DatabaseExecutor } from './route-service';

/** Atomically consumes a magic-link token so every token is single-use. */
export async function consumeVerificationToken(
  identifier: string,
  token: string,
  executor: DatabaseExecutor = db
) {
  const [found] = await executor
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, token)
      )
    )
    .returning();

  if (!found || found.expires < new Date()) return null;
  return found;
}
