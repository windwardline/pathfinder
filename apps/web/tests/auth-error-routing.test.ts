import { describe, expect, it, vi } from 'vitest';
import { Auth } from '@auth/core';
import type { AuthConfig } from '@auth/core';
import type { Adapter } from '@auth/core/adapters';

// The Next.js binding only drags the Next server runtime into this Node test;
// the config is exercised against @auth/core, which is what next-auth delegates to.
vi.mock('next-auth', () => ({
  default: () => ({ handlers: {}, signIn: () => {}, signOut: () => {}, auth: () => {} }),
}));

const { authConfig } = await import('../src/auth');

const ORIGIN = 'https://pathfinder.example';

// next-auth supplies these two itself (basePath from AUTH_URL's pathname, secret
// from AUTH_SECRET); @auth/core defaults elsewhere, so the test states them.
const BASE_PATH = '/api/auth';

const spentLink = {
  // A link already used, or one that expired: Auth.js reads null as "no invite".
  useVerificationToken: async () => null,
  getUserByEmail: async () => null,
  createVerificationToken: async (token: unknown) => token,
} as unknown as Adapter;

async function followSpentLink() {
  return Auth(new Request(`${ORIGIN}${BASE_PATH}/callback/resend?token=spent&email=user%40example.com`), {
    ...(authConfig as unknown as AuthConfig),
    adapter: spentLink,
    basePath: BASE_PATH,
    secret: 'test-secret-value-of-sufficient-length',
    trustHost: true,
  });
}

describe('auth page routing', () => {
  it('declares the app pages for sign-in, inbox, and error', () => {
    expect(authConfig.pages).toMatchObject({
      signIn: '/signin',
      verifyRequest: '/check-email',
      error: '/signin',
    });
  });

  it('sends a spent or expired link to the app sign-in page, not the stock error page', async () => {
    const result = await followSpentLink();

    expect(result.status).toBe(302);
    const location = new URL(result.headers.get('location')!);

    expect(location.pathname).toBe('/signin');
    expect(location.pathname.startsWith(BASE_PATH)).toBe(false);
    // /signin already renders copy for this exact code.
    expect(location.searchParams.get('error')).toBe('Verification');
  });
});
