import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db, verificationTokens } from '@pathfinder/core';
import { eq, lt, sql } from 'drizzle-orm';

// Every column in the schema is `timestamp` without time zone, read and written
// through drizzle's postgres-js adapter. That adapter replaces the driver's
// date parsers and serializers on the client it is given, so the round trip
// depends on a contract between two packages, not on either alone. postgres 4
// rewrote the driver beneath that contract and changed how untyped Date
// parameters are sent. These cases pin the behaviour sign-in depends on:
// verification tokens and sessions expire by comparing these columns.
const integration = describe.skipIf(!process.env.POSTGRES_URL);

// Inside the 2026 US daylight-saving switch hour, with milliseconds, so a
// local-time reading or a dropped fraction cannot pass by coincidence.
const INSTANT = new Date('2026-03-08T07:30:15.123Z');
const TOKEN = 'timestamp-roundtrip-probe';

integration('timestamp round trip through drizzle and postgres-js', () => {
  // A local-time reading of a `timestamp` column is invisible on a UTC host,
  // and CI runners and Vercel are both UTC. Run this file in a zone eight hours
  // off (vitest's forks pool gives each file its own process) so that reading
  // fails here instead of passing everywhere it would be checked.
  const originalTZ = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'America/Los_Angeles';
    expect(new Date(INSTANT).getTimezoneOffset()).toBe(480);
  });

  afterAll(async () => {
    await db.delete(verificationTokens).where(eq(verificationTokens.token, TOKEN));
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  });

  it('stores UTC wall time and reads back the exact instant', async () => {
    await db.delete(verificationTokens).where(eq(verificationTokens.token, TOKEN));
    await db
      .insert(verificationTokens)
      .values({ identifier: 'roundtrip@example.invalid', token: TOKEN, expires: INSTANT });

    const [row] = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, TOKEN));
    expect(row.expires).toBeInstanceOf(Date);
    expect(row.expires.toISOString()).toBe(INSTANT.toISOString());

    const [{ stored }] = await db.execute<{ stored: string }>(
      sql`select "expires"::text as stored from "verificationToken" where token = ${TOKEN}`,
    );
    expect(stored).toBe('2026-03-08 07:30:15.123');
  });

  it('compares a Date parameter against the column as the same instant', async () => {
    const justAfter = new Date(INSTANT.getTime() + 1);
    const justBefore = new Date(INSTANT.getTime() - 1);

    const viaOperator = await db
      .select()
      .from(verificationTokens)
      .where(lt(verificationTokens.expires, justAfter));
    expect(viaOperator.map(r => r.token)).toContain(TOKEN);

    const notYet = await db
      .select()
      .from(verificationTokens)
      .where(lt(verificationTokens.expires, justBefore));
    expect(notYet.map(r => r.token)).not.toContain(TOKEN);
  });
});
