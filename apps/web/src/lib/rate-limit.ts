import { apiRateLimits, db } from '@pathfinder/core';
import { sql } from 'drizzle-orm';
import type { DatabaseExecutor } from './route-service';

/** Atomic fixed-window limiter shared by every application instance. */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  executor: DatabaseExecutor = db
): Promise<boolean> {
  const now = Date.now();
  const cutoff = new Date(now - windowMs);
  const windowStart = new Date(now);
  const cutoffIso = cutoff.toISOString();
  const windowStartIso = windowStart.toISOString();
  const [row] = await executor
    .insert(apiRateLimits)
    .values({ key, windowStart, count: 1, updatedAt: windowStart })
    .onConflictDoUpdate({
      target: apiRateLimits.key,
      set: {
        count: sql<number>`case when ${apiRateLimits.windowStart} <= ${cutoffIso}::timestamp then 1 else ${apiRateLimits.count} + 1 end`,
        windowStart: sql<Date>`case when ${apiRateLimits.windowStart} <= ${cutoffIso}::timestamp then ${windowStartIso}::timestamp else ${apiRateLimits.windowStart} end`,
        updatedAt: windowStart,
      },
    })
    .returning({ count: apiRateLimits.count });

  return row.count <= limit;
}
