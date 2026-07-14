import { describe, expect, it } from 'vitest';
import { factsRequestSchema } from '../src/lib/validation';

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
      }).success
    ).toBe(false);
  });
});
