import { describe, expect, it } from 'vitest';
import { accountDeletionSchema, factsRequestSchema } from '../src/lib/validation';

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
});
