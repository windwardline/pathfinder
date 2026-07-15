import { describe, expect, it } from 'vitest';
import { correlationId } from '../src/lib/api-response';

describe('correlation identifiers', () => {
  it('preserves a valid opaque UUID supplied by trusted infrastructure', () => {
    const expected = '019f5dec-677b-7670-be9f-f899a5745b44';
    const request = new Request('https://example.invalid', {
      headers: { 'x-correlation-id': expected },
    });

    expect(correlationId(request)).toBe(expected);
  });

  it('replaces arbitrary request text instead of reflecting it into logs and responses', () => {
    const request = new Request('https://example.invalid', {
      headers: { 'x-correlation-id': 'participant-email@example.invalid' },
    });

    const result = correlationId(request);
    expect(result).not.toContain('participant');
    expect(result).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
