import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  auditEvents,
  accountDeletionReceipts,
  apiRateLimits,
  db,
  factEvents,
  facts,
  graphVersions,
  idempotencyRecords,
  provenance,
  rerouteEvents,
  routingSnapshots,
  sessions,
  users,
  verificationTokens,
} from '@pathfinder/core';
import { eq } from 'drizzle-orm';
import { sha256 } from '../src/lib/integrity';

const USER_ID = 'integration-user';
let authenticatedUserId = USER_ID;

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({
    user: { id: authenticatedUserId, email: `${authenticatedUserId}@example.invalid` },
  })),
}));

import { POST as seedDemo } from '../src/app/api/demo/seed/route';
import { POST as mutateFact } from '../src/app/api/facts/route';
import { POST as completeAction } from '../src/app/api/actions/complete/route';
import { GET as getRoute } from '../src/app/api/route/route';
import { GET as getHistory } from '../src/app/api/history/route';
import { consumeVerificationToken } from '../src/lib/verification-token';
import { POST as exportAccount } from '../src/app/api/account/export/route';
import { POST as deleteAccount } from '../src/app/api/account/delete/route';
import { GET as getV1Fact } from '../src/app/v1/facts/[factId]/route';
import { POST as requestReroute } from '../src/app/v1/reroutes/route';
import { POST as createV1Provenance } from '../src/app/v1/provenance/route';
import { POST as validateV1Provenance } from '../src/app/v1/provenance/[provenanceId]/validate/route';
import { POST as supersedeV1Fact } from '../src/app/v1/facts/[factId]/supersede/route';
import { GET as getV1CurrentRoute } from '../src/app/v1/routes/current/route';
import { POST as createV1Fact } from '../src/app/v1/facts/route';
import { POST as extractCandidateFacts } from '../src/app/api/ai/extract/route';
import { AIGateway } from '../src/services/ai/Gateway';

const integration = describe.skipIf(!process.env.POSTGRES_URL);
const DEMONSTRATION_SCENARIO_IDS = [
  'SD-001',
  'SD-002',
  'SD-003',
  'SD-004',
  'SD-005',
  'SD-006',
  'SD-007',
  'SD-008',
  'SD-009',
  'SD-010',
] as const;

function jsonRequest(url: string, body: unknown) {
  return new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function seedRequest(scenarioId: (typeof DEMONSTRATION_SCENARIO_IDS)[number]) {
  return jsonRequest('/api/demo/seed', { scenarioId, confirmReplaceExisting: true });
}

integration('API lifecycle and history integration', () => {
  beforeAll(async () => {
    await db.delete(auditEvents);
    await db.delete(accountDeletionReceipts);
    await db.delete(apiRateLimits);
    await db.delete(idempotencyRecords);
    await db.delete(factEvents);
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
          idempotencyKey: 'bypassed-completion',
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
        idempotencyKey: 'concurrent-proposal',
      })
    );
    const proposedBody = await proposed.json();
    const factId = proposedBody.fact.id as string;

    const responses = await Promise.all([
      mutateFact(jsonRequest('/api/facts', {
        action: 'confirm',
        factId,
        idempotencyKey: 'concurrent-confirm',
      })),
      mutateFact(jsonRequest('/api/facts', {
        action: 'reject',
        factId,
        idempotencyKey: 'concurrent-reject',
      })),
    ]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
  });

  it('records each Reroute against its exact before-state', async () => {
    expect((await seedDemo()).status).toBe(200);
    const routeResponse = await getRoute();
    const routeBody = await routeResponse.json();
    const stateId = routeBody.route.focusActionId as string;

    const completion = await completeAction(
      jsonRequest('/api/actions/complete', {
        actionId: stateId,
        idempotencyKey: 'complete-state-id',
      })
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
        idempotencyKey: 'transit-proposal',
      })
    );
    const proposedBody = await proposed.json();
    expect(
      (
        await mutateFact(
          jsonRequest('/api/facts', {
            action: 'confirm',
            factId: proposedBody.fact.id,
            idempotencyKey: 'transit-confirmation',
          })
        )
      ).status
    ).toBe(200);

    const historyBody = await (await getHistory()).json();
    const initialEvent = historyBody.history.find(
      (event: { triggerReference: string | null }) =>
        event.triggerReference === 'seed-demonstration'
    );
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
    expect(initialEvent.difference.added.length).toBeGreaterThan(0);
    expect(initialEvent.difference).not.toBeNull();
  });

  it('selects every canonical seeded demonstration scenario by ID', async () => {
    for (const scenarioId of DEMONSTRATION_SCENARIO_IDS) {
      const response = await seedDemo(
        seedRequest(scenarioId)
      );
      expect(response.status).toBe(200);
      expect((await response.json()).scenarioId).toBe(scenarioId);
    }
  });

  it('seeds canonical domain Facts and the expected Focus Action for every demonstration', async () => {
    const expectations = [
      ['SD-001', 'Obtain a state identification card', [], null],
      ['SD-002', 'Complete employment onboarding at Harbor Light Logistics', [], null],
      ['SD-003', 'Call your supervision officer', ['CONSTRAINT'], 'Restore transportation access'],
      ['SD-004', 'Complete the housing application', ['BLOCKER'], 'Request a housing denial review'],
      ['SD-005', 'Complete an optional worksheet', ['OBLIGATION'], 'Resolve the work schedule conflict'],
      ['SD-006', 'Attend orientation', ['DEADLINE'], 'Submit time-sensitive paperwork'],
      ['SD-007', 'Obtain a state identification card', [], null],
      ['SD-008', 'Obtain a state identification card', [], null],
      ['SD-009', 'Obtain a state identification card', [], null],
      ['SD-010', null, ['GOAL'], null],
    ] as const;

    for (const [scenarioId, expectedFocusTitle, expectedDomainTypes, expectedConfirmedFocus] of expectations) {
      const response = await seedDemo(seedRequest(scenarioId));
      expect(response.status).toBe(200);

      const routeBody = await (await getRoute()).json();
      const focus = routeBody.route.steps.find(
        (step: { actionId: string }) => step.actionId === routeBody.route.focusActionId
      );
      expect(focus?.title ?? null).toBe(expectedFocusTitle);

      const storedFacts = await db.select().from(facts).where(eq(facts.userId, USER_ID));
      for (const expectedType of expectedDomainTypes) {
        expect(storedFacts.some(fact => fact.factType === expectedType)).toBe(true);
      }

      if (expectedConfirmedFocus) {
        const proposedDomainFact = storedFacts.find(
          fact => expectedDomainTypes.some(type => type === fact.factType) && fact.status === 'PROPOSED'
        );
        expect(proposedDomainFact).toBeDefined();
        const confirmation = await mutateFact(
          jsonRequest('/api/facts', {
            action: 'confirm',
            factId: proposedDomainFact!.id,
            confirmationMethod: 'USER_REVIEW',
            idempotencyKey: `confirm-${scenarioId}`,
          })
        );
        expect(confirmation.status).toBe(200);
        expect((await confirmation.json()).reroute).not.toBeNull();
        const confirmedRoute = await (await getRoute()).json();
        const confirmedFocus = confirmedRoute.route.steps.find(
          (step: { actionId: string }) => step.actionId === confirmedRoute.route.focusActionId
        );
        expect(confirmedFocus.title).toBe(expectedConfirmedFocus);
      }

      if (scenarioId === 'SD-006') {
        const deadline = storedFacts.find(fact => fact.factType === 'DEADLINE');
        const dueAt = deadline ? JSON.parse(deadline.factText).value.dueAt : null;
        expect(new Date(dueAt).getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60_000);
      }
    }
  });

  it('keeps the SD-008 Proposed Fact outside the Route and completes SD-010', async () => {
    const proposedResponse = await seedDemo(
      seedRequest('SD-008')
    );
    expect(proposedResponse.status).toBe(200);
    const proposedRoute = await (await getRoute()).json();
    expect(proposedRoute.proposedCount).toBeGreaterThan(0);
    expect(
      proposedRoute.route.steps.some(
        (step: { title: string }) => step.title === 'Apply for a transit pass'
      )
    ).toBe(false);

    const completedResponse = await seedDemo(
      seedRequest('SD-010')
    );
    expect(completedResponse.status).toBe(200);
    const completedRoute = await (await getRoute()).json();
    expect(completedRoute.route.status).toBe('COMPLETED');
    expect(completedRoute.route.focusActionId).toBeNull();
    expect(completedRoute.versions).toEqual({
      application: '1.2.0',
      schema: '0005_sloppy_tag',
      engine: 'release-1.0',
      ruleSet: 'release-1.0',
    });
  });

  it('rejects an unknown demonstration scenario without replacing the current Route', async () => {
    const before = await (await getRoute()).json();
    const response = await seedDemo(
      jsonRequest('/api/demo/seed', { scenarioId: 'SD-999', confirmReplaceExisting: true })
    );
    expect(response.status).toBe(400);
    const after = await (await getRoute()).json();
    expect(after.route.id).toBe(before.route.id);
  });

  it('deduplicates repeated extracted Actions without failing the candidate batch', async () => {
    const extraction = vi.spyOn(AIGateway, 'extractCandidateFacts').mockResolvedValueOnce([
      {
        factType: 'ACTION',
        title: 'Attend orientation',
        description: 'Bring the appointment letter.',
        sourceText: 'Attend orientation and bring this letter.',
        confidence: 95,
      },
      {
        factType: 'ACTION',
        title: 'Attend orientation',
        description: 'Bring the appointment letter.',
        sourceText: 'Attend orientation and bring this letter.',
        confidence: 95,
      },
    ]);

    const response = await extractCandidateFacts(
      jsonRequest('/api/ai/extract', {
        text: 'Attend orientation and bring this letter.',
        idempotencyKey: crypto.randomUUID(),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.facts).toHaveLength(1);
    expect(body.omittedCandidates).toBe(1);
    extraction.mockRestore();
  });

  it('requires explicit confirmation before replacing existing Route data', async () => {
    expect((await seedDemo(seedRequest('SD-001'))).status).toBe(200);
    const before = await (await getRoute()).json();

    const rejected = await seedDemo(
      jsonRequest('/api/demo/seed', { scenarioId: 'SD-010' })
    );
    expect(rejected.status).toBe(409);
    expect((await rejected.json()).error_code).toBe('RESET_CONFIRMATION_REQUIRED');
    expect((await (await getRoute()).json()).route.id).toBe(before.route.id);

    expect((await seedDemo(seedRequest('SD-010'))).status).toBe(200);
    expect((await (await getRoute()).json()).route.status).toBe('COMPLETED');
  });

  it('returns a stable current Route Version and rejects stale Reroute requests', async () => {
    expect(
      (
        await seedDemo(
          seedRequest('SD-001')
        )
      ).status
    ).toBe(200);
    const first = await (await getRoute()).json();
    const second = await (await getRoute()).json();
    expect(second.route.id).toBe(first.route.id);

    const v1 = await (
      await getV1CurrentRoute(new Request('http://localhost/v1/routes/current'))
    ).json();
    expect(v1.route.route_version_id).toBe(first.route.id);
    expect(v1.route.engine_version).toBe('release-1.0');
    expect(v1.route.rule_set_version).toBe('release-1.0');
    expect(v1.route.focus_action.action_id).toBe(first.route.focusActionId);
    expect(v1.route.ordered_steps).toHaveLength(first.route.steps.length);
    expect(JSON.stringify(v1.route)).not.toContain('dependencies');

    const stale = await requestReroute(
      jsonRequest('/v1/reroutes', {
        trigger_type: 'FACT_CONFIRMED',
        trigger_reference: 'manual-refresh',
        expected_current_route_version_id: 'stale-route-version',
        idempotency_key: 'stale-reroute',
      })
    );
    expect(stale.status).toBe(409);
    expect((await stale.json()).error_code).toBe('STALE_ROUTE_VERSION');
  });

  it('replays an identical mutation and rejects conflicting idempotency-key reuse', async () => {
    const proposed = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'propose',
        payload: {
          key: 'ACTION',
          value: { title: 'Idempotent Action', description: '', status: 'OPEN' },
        },
        provenance: { source: 'user_input' },
        idempotencyKey: 'idempotent-proposal',
      })
    );
    const factId = (await proposed.json()).fact.id as string;
    const body = {
      action: 'confirm',
      factId,
      confirmationMethod: 'USER_REVIEW',
      idempotencyKey: 'idempotent-confirmation',
    };
    const first = await mutateFact(jsonRequest('/api/facts', body));
    const replay = await mutateFact(jsonRequest('/api/facts', body));
    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    expect((await replay.json()).idempotent_replay).toBe(true);

    const conflict = await mutateFact(
      jsonRequest('/api/facts', {
        ...body,
        factId: crypto.randomUUID(),
      })
    );
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).error_code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('preserves the old Confirmed Fact until a Proposed correction is confirmed', async () => {
    const originalResponse = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'propose',
        payload: {
          key: 'ACTION',
          value: { title: 'Attend on Monday', description: '', status: 'OPEN' },
        },
        provenance: { source: 'user_input' },
        idempotencyKey: 'correction-original-propose',
      })
    );
    const originalId = (await originalResponse.json()).fact.id as string;
    await mutateFact(
      jsonRequest('/api/facts', {
        action: 'confirm',
        factId: originalId,
        idempotencyKey: 'correction-original-confirm',
      })
    );

    const correctionResponse = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'supersede',
        factId: originalId,
        replacementPayload: {
          key: 'ACTION',
          value: { title: 'Attend on Tuesday', description: '', status: 'OPEN' },
        },
        provenance: { source: 'user_correction' },
        reasonCode: 'USER_CORRECTION',
        idempotencyKey: 'correction-request',
      })
    );
    const replacementId = (await correctionResponse.json()).fact.id as string;
    expect(
      (await db.select().from(facts).where(eq(facts.id, originalId)).limit(1))[0].status
    ).toBe('CONFIRMED');

    const confirmation = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'confirm',
        factId: replacementId,
        idempotencyKey: 'correction-confirm',
      })
    );
    expect(confirmation.status).toBe(200);
    const [original] = await db.select().from(facts).where(eq(facts.id, originalId)).limit(1);
    const [replacement] = await db.select().from(facts).where(eq(facts.id, replacementId)).limit(1);
    expect(original.status).toBe('SUPERSEDED');
    expect(original.supersededByFactId).toBe(replacementId);
    expect(replacement.status).toBe('CONFIRMED');
    expect(replacement.supersedesFactId).toBe(originalId);
  });

  it('atomically claims the requested Provenance for a v1 supersession', async () => {
    const originalResponse = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'propose',
        payload: {
          key: 'ACTION',
          value: { title: 'Meet on Wednesday', description: '', status: 'OPEN' },
        },
        provenance: { source: 'user_input' },
        idempotencyKey: 'v1-correction-original-propose',
      })
    );
    const originalId = (await originalResponse.json()).fact.id as string;
    await mutateFact(
      jsonRequest('/api/facts', {
        action: 'confirm',
        factId: originalId,
        idempotencyKey: 'v1-correction-original-confirm',
      })
    );
    const provenanceResponse = await createV1Provenance(
      jsonRequest('/v1/provenance', {
        source_type: 'USER_CORRECTION',
        source_reference: 'User reviewed correction',
        idempotency_key: 'v1-correction-provenance',
      })
    );
    const provenanceId = (await provenanceResponse.json()).provenance.provenance_id as string;

    const corrected = await supersedeV1Fact(
      jsonRequest(`/v1/facts/${originalId}/supersede`, {
        replacement_value: {
          title: 'Meet on Thursday',
          description: '',
          status: 'OPEN',
        },
        provenance_id: provenanceId,
        reason_code: 'USER_CORRECTION',
        idempotency_key: 'v1-correction-request',
      }),
      { params: Promise.resolve({ factId: originalId }) }
    );
    expect(corrected.status).toBe(200);
    const correctedBody = await corrected.json();
    const replacementId = correctedBody.fact.fact_id as string;
    expect(correctedBody.fact.provenance_id).toBe(provenanceId);
    const replacementSources = await db
      .select()
      .from(provenance)
      .where(eq(provenance.factId, replacementId));
    expect(replacementSources).toHaveLength(1);
    expect(replacementSources[0].id).toBe(provenanceId);
  });

  it('ATC-004 detects Provenance tampering without leaking the stored value', async () => {
    const created = await createV1Provenance(
      jsonRequest('/v1/provenance', {
        source_type: 'USER_ENTRY',
        source_reference: 'Integrity fixture',
        idempotency_key: 'tampered-provenance',
      })
    );
    const provenanceId = (await created.json()).provenance.provenance_id as string;
    await db.update(provenance).set({ integrityHash: 'tampered' }).where(eq(provenance.id, provenanceId));
    const response = await validateV1Provenance(
      jsonRequest(`/v1/provenance/${provenanceId}/validate`, {}),
      { params: Promise.resolve({ provenanceId }) }
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      valid: false,
      integrity_status: 'INVALID',
      validation_errors: ['INTEGRITY_HASH_MISMATCH'],
    });
    expect(JSON.stringify(body)).not.toContain('Integrity fixture');
  });

  it('ATC-007 refuses a corrupted latest GraphVersion and serves the prior valid publication', async () => {
    expect((await seedDemo(seedRequest('SD-001'))).status).toBe(200);
    const current = await (await getRoute()).json();
    const [latest] = await db
      .select()
      .from(graphVersions)
      .where(eq(graphVersions.userId, USER_ID))
      .orderBy(graphVersions.sequenceNumber)
      .limit(1);
    // Select the actual latest row explicitly after the baseline query keeps
    // the test independent of timestamp resolution.
    const all = await db.select().from(graphVersions).where(eq(graphVersions.userId, USER_ID));
    const newest = all.sort((a, b) => b.sequenceNumber - a.sequenceNumber)[0];
    expect(newest).toBeDefined();
    await db.update(graphVersions).set({ inputSnapshotHash: 'corrupted' }).where(eq(graphVersions.id, newest.id));
    const recovered = await getRoute();
    expect(recovered.status).toBe(200);
    expect((await recovered.json()).route.id).not.toBe(current.route.id);
    expect(latest).toBeDefined();
  });

  it('expires a Confirmed Fact and excludes it from the current Route', async () => {
    const proposed = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'propose',
        payload: {
          key: 'ACTION',
          value: { title: 'Temporary Action', description: '', status: 'OPEN' },
        },
        provenance: { source: 'user_input' },
        idempotencyKey: 'expire-propose',
      })
    );
    const factId = (await proposed.json()).fact.id as string;
    await mutateFact(
      jsonRequest('/api/facts', {
        action: 'confirm',
        factId,
        idempotencyKey: 'expire-confirm',
      })
    );
    const expired = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'expire',
        factId,
        reasonCode: 'NO_LONGER_CURRENT',
        idempotencyKey: 'expire-transition',
      })
    );
    expect(expired.status).toBe(200);
    expect((await expired.json()).fact.status).toBe('EXPIRED');
    const route = await (await getRoute()).json();
    expect(route.route.steps.map((step: { actionId: string }) => step.actionId)).not.toContain(factId);
  });

  it('blocks cross-user Fact reads and exports only the authenticated user', async () => {
    const otherUserId = 'integration-other-user';
    await db.delete(users).where(eq(users.id, otherUserId));
    await db.insert(users).values({ id: otherUserId, email: 'other@example.invalid' });
    authenticatedUserId = otherUserId;
    const created = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'propose',
        payload: {
          key: 'ACTION',
          value: { title: 'Other user Action', description: '', status: 'OPEN' },
        },
        provenance: { source: 'user_input' },
        idempotencyKey: 'other-user-proposal',
      })
    );
    const otherFactId = (await created.json()).fact.id as string;
    const otherProvenance = await createV1Provenance(
      jsonRequest('/v1/provenance', {
        source_type: 'USER_ENTRY',
        source_reference: 'Other user source',
        idempotency_key: 'other-user-v1-provenance',
      })
    );
    const otherProvenanceId = (await otherProvenance.json()).provenance
      .provenance_id as string;
    authenticatedUserId = USER_ID;

    const read = await getV1Fact(
      new Request(`http://localhost/v1/facts/${otherFactId}`),
      { params: Promise.resolve({ factId: otherFactId }) }
    );
    expect(read.status).toBe(404);

    const crossUserWrite = await createV1Fact(
      jsonRequest('/v1/facts', {
        fact_type: 'ACTION',
        value: { title: 'Cross-user reference', description: '', status: 'OPEN' },
        provenance_id: otherProvenanceId,
        idempotency_key: 'cross-user-v1-fact',
      })
    );
    expect(crossUserWrite.status).toBe(404);
    expect((await crossUserWrite.json()).error_code).toBe('PROVENANCE_NOT_FOUND');

    const exported = await exportAccount(
      jsonRequest('/api/account/export', { confirmation: true })
    );
    expect(exported.status).toBe(200);
    const exportBody = await exported.json();
    expect(exportBody.account.user_id).toBe(USER_ID);
    expect(exportBody.facts.map((fact: { fact_id: string }) => fact.fact_id)).not.toContain(otherFactId);
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

  it('deletes the full account aggregate and preserves only a minimal deletion receipt', async () => {
    const deletionUserId = 'integration-deletion-user';
    authenticatedUserId = deletionUserId;
    await db.delete(users).where(eq(users.id, deletionUserId));
    await db.insert(users).values({ id: deletionUserId, email: 'delete@example.invalid' });
    await db.insert(sessions).values({
      sessionToken: 'delete-session',
      userId: deletionUserId,
      expires: new Date(Date.now() + 60_000),
    });
    const created = await mutateFact(
      jsonRequest('/api/facts', {
        action: 'propose',
        payload: {
          key: 'ACTION',
          value: { title: 'Delete this Action', description: '', status: 'OPEN' },
        },
        provenance: { source: 'user_input' },
        idempotencyKey: 'delete-user-proposal',
      })
    );
    expect(created.status).toBe(200);

    const deleted = await deleteAccount(
      jsonRequest('/api/account/delete', { confirmation: 'DELETE MY ACCOUNT' })
    );
    expect(deleted.status).toBe(200);
    expect(await db.select().from(users).where(eq(users.id, deletionUserId))).toHaveLength(0);
    expect(await db.select().from(sessions).where(eq(sessions.userId, deletionUserId))).toHaveLength(0);
    expect(await db.select().from(facts).where(eq(facts.userId, deletionUserId))).toHaveLength(0);
    const receipts = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.resourceId, sha256(deletionUserId)));
    expect(receipts.some(receipt => receipt.eventType === 'ACCOUNT_DELETION_COMPLETED')).toBe(true);
    const deletionLedger = await db
      .select()
      .from(accountDeletionReceipts)
      .where(eq(accountDeletionReceipts.subjectHash, sha256(deletionUserId)));
    expect(deletionLedger).toHaveLength(1);
    expect(JSON.stringify(deletionLedger)).not.toContain(deletionUserId);
    authenticatedUserId = USER_ID;
  });
});
