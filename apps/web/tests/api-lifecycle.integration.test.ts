import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  apiRateLimits,
  db,
  facts,
  graphVersions,
  provenance,
  rerouteEvents,
  routingSnapshots,
  sessions,
  users,
  verificationTokens,
} from '@pathfinder/core';
import { eq } from 'drizzle-orm';

const USER_ID = 'integration-user';

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({
    user: { id: USER_ID, email: 'integration@example.invalid' },
  })),
}));

import { POST as seedDemo } from '../src/app/api/demo/seed/route';
import { POST as mutateFact } from '../src/app/api/facts/route';
import { POST as completeAction } from '../src/app/api/actions/complete/route';
import { GET as getRoute } from '../src/app/api/route/route';
import { GET as getHistory } from '../src/app/api/history/route';
import { consumeVerificationToken } from '../src/lib/verification-token';

const integration = describe.skipIf(!process.env.POSTGRES_URL);

function jsonRequest(url: string, body: unknown) {
  return new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

integration('API lifecycle and history integration', () => {
  beforeAll(async () => {
    await db.delete(apiRateLimits);
    await db.delete(rerouteEvents);
    await db.delete(routingSnapshots);
    await db.delete(graphVersions);
    await db.delete(provenance);
    await db.delete(facts);
    await db.delete(sessions);
    await db.delete(verificationTokens);
    await db.delete(users).where(eq(users.id, USER_ID));
    await db.insert(users).values({
      id: USER_ID,
      email: 'integration@example.invalid',
      emailVerified: new Date(),
    });
  });

  it('rejects an Action proposed directly in the completed state', async () => {
    const response = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'propose',
        payload: {
          key: 'ACTION',
          value: { title: 'Bypassed completion', description: '', status: 'COMPLETED' },
        },
        provenance: { source: 'user_input' },
      })
    );
    expect(response.status).toBe(400);
  });

  it('allows exactly one concurrent Proposed Fact transition', async () => {
    const proposed = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'propose',
        payload: {
          key: 'ACTION',
          value: { title: 'Concurrent transition', description: '', status: 'OPEN' },
        },
        provenance: { source: 'user_input' },
      })
    );
    const proposedBody = await proposed.json();
    const factId = proposedBody.fact.id as string;

    const responses = await Promise.all([
      mutateFact(jsonRequest('/api/facts', { action: 'confirm', factId })),
      mutateFact(jsonRequest('/api/facts', { action: 'reject', factId })),
    ]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
  });

  it('records each Reroute against its exact before-state', async () => {
    expect((await seedDemo()).status).toBe(200);
    const routeResponse = await getRoute();
    const routeBody = await routeResponse.json();
    const stateId = routeBody.route.focusActionId as string;

    const completion = await completeAction(
      jsonRequest('/api/actions/complete', { actionId: stateId })
    );
    expect(completion.status).toBe(200);

    const proposed = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'propose',
        payload: {
          key: 'ACTION',
          value: { title: 'Apply for a transit pass', description: '', status: 'OPEN' },
        },
        provenance: { source: 'user_input' },
      })
    );
    const proposedBody = await proposed.json();
    expect(
      (
        await mutateFact(
          jsonRequest('/api/facts', {
            action: 'confirm',
            factId: proposedBody.fact.id,
          })
        )
      ).status
    ).toBe(200);

    const historyBody = await (await getHistory()).json();
    const completionEvent = historyBody.history.find(
      (event: { triggerReason: string }) => event.triggerReason === 'ACTION_COMPLETED'
    );
    const confirmationEvent = historyBody.history.find(
      (event: { triggerReason: string }) => event.triggerReason === 'FACT_CONFIRMED'
    );

    expect(completionEvent.difference.completed.map((item: { actionId: string }) => item.actionId))
      .toContain(stateId);
    expect(completionEvent.difference.newlyAvailable).toHaveLength(3);
    expect(confirmationEvent.difference.completed).toEqual([]);
    expect(
      confirmationEvent.difference.newlyAvailable.map((item: { title: string }) => item.title)
    ).toContain('Apply for a transit pass');
  });

  it('consumes a magic-link token exactly once', async () => {
    await db.insert(verificationTokens).values({
      identifier: 'integration@example.invalid',
      token: 'hashed-token',
      expires: new Date(Date.now() + 60_000),
    });

    expect(
      await consumeVerificationToken('integration@example.invalid', 'hashed-token')
    ).not.toBeNull();
    expect(
      await consumeVerificationToken('integration@example.invalid', 'hashed-token')
    ).toBeNull();
  });
});
