import { describe, expect, it } from 'vitest';
import { accountDeletionSchema, extractRequestSchema, factsRequestSchema } from '../src/lib/validation';
import { deriveDeadlineSeverity } from '../src/lib/deadline-policy';

describe('Facts API lifecycle validation', () => {
  it('accepts a newly proposed open Action', () => {
    expect(
      factsRequestSchema.safeParse({
        action: 'propose',
        payload: {
          key: 'ACTION',
          value: { title: 'Attend orientation', description: '', status: 'OPEN' },
        },
        provenance: { source: 'user_input' },
        idempotencyKey: 'propose-1',
      }).success
    ).toBe(true);
  });

  it('rejects a newly proposed Action that is already completed', () => {
    expect(
      factsRequestSchema.safeParse({
        action: 'propose',
        payload: {
          key: 'ACTION',
          value: { title: 'Attend orientation', description: '', status: 'COMPLETED' },
        },
        provenance: { source: 'user_input' },
        idempotencyKey: 'propose-2',
      }).success
    ).toBe(false);
  });

  it('accepts explicit supersession and expiration transitions with idempotency keys', () => {
    expect(
      factsRequestSchema.safeParse({
        action: 'supersede',
        factId: '9f566f0c-4f1c-4cc0-9487-8806ce7e8ca4',
        replacementPayload: {
          key: 'ACTION',
          value: { title: 'Corrected Action', description: '', status: 'OPEN' },
        },
        provenance: { source: 'user_correction' },
        reasonCode: 'USER_CORRECTION',
        idempotencyKey: 'replace-1',
      }).success
    ).toBe(true);
    expect(
      factsRequestSchema.safeParse({
        action: 'expire',
        factId: '9f566f0c-4f1c-4cc0-9487-8806ce7e8ca4',
        reasonCode: 'NO_LONGER_CURRENT',
        idempotencyKey: 'expire-1',
      }).success
    ).toBe(true);
  });

  it('requires the exact account-deletion confirmation phrase', () => {
    expect(accountDeletionSchema.safeParse({ confirmation: 'DELETE MY ACCOUNT' }).success)
      .toBe(true);
    expect(accountDeletionSchema.safeParse({ confirmation: 'delete' }).success).toBe(false);
  });

  it('derives deadline urgency from time remaining instead of user-selected priority', () => {
    const now = new Date('2026-07-15T12:00:00.000Z');
    expect(deriveDeadlineSeverity('2026-07-15T18:00:00.000Z', now)).toBe('CRITICAL');
    expect(deriveDeadlineSeverity('2026-07-17T12:00:00.000Z', now)).toBe('HIGH');
    expect(deriveDeadlineSeverity('2026-07-22T12:00:00.000Z', now)).toBe('MODERATE');
    expect(deriveDeadlineSeverity('2026-08-15T12:00:00.000Z', now)).toBe('LOW');
  });

  it('overrides client-supplied deadline severity at the API boundary', () => {
    const result = factsRequestSchema.safeParse({
      action: 'propose',
      payload: {
        key: 'DEADLINE',
        value: {
          title: 'File the application',
          dueAt: new Date(Date.now() + 45 * 24 * 60 * 60_000).toISOString(),
          severity: 'CRITICAL',
          targetActionId: '9f566f0c-4f1c-4cc0-9487-8806ce7e8ca4',
        },
      },
      provenance: { source: 'user_input' },
      idempotencyKey: 'deadline-policy',
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.action === 'propose' && result.data.payload.key === 'DEADLINE'
      ? result.data.payload.value.severity
      : null).toBe('LOW');
  });

  it('ATC-008 rejects oversized extraction input and unsupported Fact enums', () => {
    expect(extractRequestSchema.safeParse({ text: 'x'.repeat(5_001), idempotencyKey: 'oversized' }).success)
      .toBe(false);
    expect(factsRequestSchema.safeParse({
      action: 'propose',
      payload: { key: 'GOAL', value: { title: 'Goal', status: 'HIDDEN', priority: 50 } },
      provenance: { source: 'user_input' },
      idempotencyKey: 'unsupported-enum',
    }).success).toBe(false);
  });
});
