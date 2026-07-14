import { describe, expect, it } from 'vitest';
import {
  toScannerSafeVerificationUrl,
  validateVerificationCallback,
} from '../src/lib/magic-link';

describe('scanner-safe magic links', () => {
  const callback =
    'https://pathfinder.example/api/auth/callback/resend?callbackUrl=https%3A%2F%2Fpathfinder.example%2F&token=secret-token&email=user%40example.com';

  it('sends email scanners to an inert landing page', () => {
    const result = new URL(toScannerSafeVerificationUrl(callback));
    expect(result.origin).toBe('https://pathfinder.example');
    expect(result.pathname).toBe('/verify');
    expect(result.searchParams.get('callbackUrl')).toContain('/api/auth/callback/resend?');
  });

  it('accepts only complete same-app Resend callback paths', () => {
    const relative = new URL(callback).pathname + new URL(callback).search;
    expect(validateVerificationCallback(relative)).toBe(relative);
    expect(validateVerificationCallback('https://attacker.example/steal')).toBeNull();
    expect(validateVerificationCallback('/api/auth/callback/github?token=x&email=y')).toBeNull();
    expect(validateVerificationCallback('/api/auth/callback/resend?email=user%40example.com')).toBeNull();
  });
});
