import { describe, expect, it } from 'vitest';
import {
  parseVerificationCallback,
  toScannerSafeVerificationUrl,
} from '../src/lib/magic-link';

describe('scanner-safe magic links', () => {
  const callback =
    'https://pathfinder.example/api/auth/callback/resend?callbackUrl=https%3A%2F%2Fpathfinder.example%2F&token=secret-token&email=user%40example.com';
  const relative = new URL(callback).pathname + new URL(callback).search;

  it('sends email scanners to an inert landing page', () => {
    const result = new URL(toScannerSafeVerificationUrl(callback));
    expect(result.origin).toBe('https://pathfinder.example');
    expect(result.pathname).toBe('/verify');
    expect(result.searchParams.get('callbackUrl')).toContain('/api/auth/callback/resend?');
  });

  it('recovers the credentials the landing form resubmits', () => {
    expect(parseVerificationCallback(relative)).toEqual({
      token: 'secret-token',
      email: 'user@example.com',
      callbackUrl: '/',
    });
  });

  it('accepts only complete same-app Resend callback paths', () => {
    expect(parseVerificationCallback('https://attacker.example/steal')).toBeNull();
    expect(parseVerificationCallback('/api/auth/callback/github?token=x&email=y')).toBeNull();
    expect(parseVerificationCallback('/api/auth/callback/resend?email=user%40example.com')).toBeNull();
    expect(parseVerificationCallback(undefined)).toBeNull();
  });

  // Auth.js collapses a foreign origin to its own baseUrl; keeping only the path
  // means a crafted link cannot express one in the first place.
  it('reduces the post-sign-in destination to a path on this app', () => {
    const foreign = (url: string) =>
      parseVerificationCallback(
        `/api/auth/callback/resend?${new URLSearchParams({
          callbackUrl: url,
          token: 't',
          email: 'user@example.com',
        })}`
      )?.callbackUrl;

    expect(foreign('https://attacker.example/steal')).toBe('/steal');
    expect(foreign('//attacker.example/steal')).toBe('/steal');
    expect(foreign('/route?focus=1')).toBe('/route?focus=1');
  });
});
