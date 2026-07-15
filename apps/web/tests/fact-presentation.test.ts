import { describe, expect, it } from 'vitest';
import { buildFactCorrectionPayload } from '../src/lib/fact-presentation';
import type { FactPayload } from '../src/lib/client-api';

const actionId = '9f566f0c-4f1c-4cc0-9487-8806ce7e8ca4';

describe('Fact correction presentation', () => {
  const cases: Array<[FactPayload, string, 'title' | 'description']> = [
    [{ key: 'ACTION', value: { title: 'Old action', description: '', status: 'OPEN' } }, 'New action', 'title'],
    [{ key: 'GOAL', value: { title: 'Old goal', status: 'ACTIVE', priority: 50 } }, 'New goal', 'title'],
    [{ key: 'REQUIREMENT', value: { description: 'Old requirement', status: 'UNSATISFIED', hardness: 'HARD', targetActionId: actionId } }, 'New requirement', 'description'],
    [{ key: 'CONSTRAINT', value: { description: 'Old constraint', status: 'ACTIVE', constraintType: 'TIME', targetActionIds: [actionId] } }, 'New constraint', 'description'],
    [{ key: 'OBLIGATION', value: { title: 'Old obligation', status: 'ACTIVE', startAt: '2026-07-20T12:00:00.000Z' } }, 'New obligation', 'title'],
    [{ key: 'DEADLINE', value: { title: 'Old deadline', dueAt: '2026-07-20T12:00:00.000Z', severity: 'HIGH', targetActionId: actionId } }, 'New deadline', 'title'],
    [{ key: 'BLOCKER', value: { description: 'Old blocker', reasonCode: 'USER_CONFIRMED_BLOCKER', active: true, targetActionId: actionId } }, 'New blocker', 'description'],
  ];

  it.each(cases)('preserves %s structure while correcting its user-facing wording', (payload, correction, field) => {
    const updated = buildFactCorrectionPayload(payload, correction, 'Helpful context');
    expect(updated.key).toBe(payload.key);
    expect(updated.value[field]).toBe(correction);
    expect(updated.value.targetActionId).toBe(payload.value.targetActionId);
    expect(updated.value.targetActionIds).toEqual(payload.value.targetActionIds);
  });
});
