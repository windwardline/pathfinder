import { describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

import { serializeDifference } from '../src/app/v1/reroutes/route';

describe('Reroute v1 contract', () => {
  it('serializes every structured difference with snake_case fields and reason codes', () => {
    const difference = {
      focusActionChanged: true,
      previousFocus: { actionId: 'a', title: 'First', reasonCodes: ['ONLY_ELIGIBLE_ACTION'] },
      newFocus: { actionId: 'b', title: 'Second', reasonCodes: ['HARD_PREREQUISITE'] },
      added: [],
      removed: [],
      newlyAvailable: [{ actionId: 'b', title: 'Second', reasonCodes: ['HARD_PREREQUISITE'] }],
      newlyBlocked: [],
      completed: [{ actionId: 'a', title: 'First', reasonCodes: ['ALREADY_COMPLETED'] }],
      moved: [{ actionId: 'b', title: 'Second', reasonCodes: ['HARD_PREREQUISITE'], fromRank: 2, toRank: 1 }],
      deadlineChanges: [{ actionId: 'b', title: 'Second', reasonCodes: ['CRITICAL_DEADLINE'], previousDeadline: '2026-07-20T12:00:00.000Z', newDeadline: '2026-07-18T12:00:00.000Z' }],
      obligationChanges: [{ actionId: 'b', title: 'Second', reasonCodes: ['MANDATORY_OBLIGATION'], wasMandatory: false, isMandatory: true }],
      constraintChanges: [{ actionId: 'b', title: 'Second', reasonCodes: ['BLOCKED_BY_CONSTRAINT'], addedConstraintIds: ['c-1'], removedConstraintIds: [] }],
      isMeaningful: true,
    };

    const serialized = serializeDifference(difference);

    expect(serialized?.new_focus_action).toEqual({
      action_id: 'b',
      title: 'Second',
      reason_codes: ['HARD_PREREQUISITE'],
    });
    expect(serialized?.moved_actions[0]).toEqual({
      action_id: 'b',
      title: 'Second',
      previous_position: 2,
      new_position: 1,
      reason_codes: ['HARD_PREREQUISITE'],
    });
    expect(serialized?.deadline_changes[0]).toMatchObject({
      action_id: 'b',
      previous_deadline: '2026-07-20T12:00:00.000Z',
      new_deadline: '2026-07-18T12:00:00.000Z',
    });
    expect(JSON.stringify(serialized)).not.toMatch(/actionId|reasonCodes|fromRank|toRank/);
  });
});
