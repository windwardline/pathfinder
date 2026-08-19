/** Where the landing page resubmits the emailed credentials. */
export const VERIFICATION_CALLBACK_PATH = '/api/auth/callback/resend';

/** The credentials Auth.js expects back on its callback, as form fields. */
export type VerificationCallback = {
  token: string;
  email: string;
  callbackUrl: string;
};

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

/**
 * Read the emailed callback back into the fields the landing page resubmits.
 * The form posts to `VERIFICATION_CALLBACK_PATH` directly, so the path is ours
 * by construction and only the credentials themselves come from the link.
 */
export function parseVerificationCallback(value: unknown): VerificationCallback | null {
  if (typeof value !== 'string' || value.length > 4096) return null;

  const base = 'https://pathfinder.invalid';
  let callback: URL;
  try {
    callback = new URL(value, base);
  } catch {
    return null;
  }

  if (callback.origin !== base || callback.pathname !== VERIFICATION_CALLBACK_PATH) {
    return null;
  }

  const token = callback.searchParams.get('token');
  const email = callback.searchParams.get('email');
  if (!token || !email) return null;

  return { token, email, callbackUrl: appPath(callback.searchParams.get('callbackUrl')) };
}

/**
 * Reduce the post-sign-in destination to a path on this app. Auth.js discards a
 * foreign origin anyway; keeping only the path means a crafted link cannot even
 * express one.
 */
function appPath(value: string | null): string {
  if (!value) return '/';
  try {
    const target = new URL(value, 'https://pathfinder.invalid');
    return target.pathname + target.search;
  } catch {
    return '/';
  }
}
