/**
 * Replace the emailed Auth.js callback with an inert landing page. Security
 * scanners may GET that page safely; only the user's form submission follows
 * the real callback and consumes the single-use token.
 */
export function toScannerSafeVerificationUrl(callbackUrl: string): string {
  const callback = new URL(callbackUrl);
  const landing = new URL('/verify', callback.origin);
  landing.searchParams.set('callbackUrl', callback.pathname + callback.search);
  return landing.toString();
}

/** Allow only the Resend callback shape produced by Auth.js for this app. */
export function validateVerificationCallback(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 4096) return null;

  const base = 'https://pathfinder.invalid';
  let callback: URL;
  try {
    callback = new URL(value, base);
  } catch {
    return null;
  }

  if (callback.origin !== base || callback.pathname !== '/api/auth/callback/resend') {
    return null;
  }
  if (!callback.searchParams.get('token') || !callback.searchParams.get('email')) {
    return null;
  }

  return callback.pathname + callback.search;
}
