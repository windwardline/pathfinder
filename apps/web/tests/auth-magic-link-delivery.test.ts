import { afterEach, describe, expect, it, vi } from 'vitest';
import { Auth, skipCSRFCheck } from '@auth/core';
import type { Adapter } from '@auth/core/adapters';

// The Next.js binding is irrelevant here and only drags the Next server runtime
// into this Node test; the provider is driven through @auth/core directly, which
// is the same engine next-auth delegates to.
vi.mock('next-auth', () => ({
  default: () => ({ handlers: {}, signIn: () => {}, signOut: () => {}, auth: () => {} }),
}));

const { resendProvider } = await import('../src/auth');

// What ships in the email is the invariant, and it is only observable after
// Auth.js resolves the provider: `parseProviders` destructures
// `{ options: userOptions, ...defaults }` and merges userOptions *over* the
// defaults, so a `sendVerificationRequest` assigned to the provider after
// construction is discarded in favor of the config object's own. These tests
// therefore drive the real @auth/core request pipeline.
const ORIGIN = 'https://pathfinder.example';

type SentEmail = { to: string; subject: string; html: string; text: string };

const adapter = {
  getUserByEmail: async () => null,
  createVerificationToken: async (token: unknown) => token,
  useVerificationToken: async () => null,
} as unknown as Adapter;

async function requestSignIn(response: () => Response) {
  const sent: SentEmail[] = [];

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    expect(String(input)).toBe('https://api.resend.com/emails');
    sent.push(JSON.parse(String(init?.body)) as SentEmail);
    return response();
  });

  const result = await Auth(
    new Request(`${ORIGIN}/api/auth/signin/resend`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'user@example.com', callbackUrl: `${ORIGIN}/` }),
    }),
    {
      basePath: '/api/auth',
      secret: 'test-secret-value-of-sufficient-length',
      trustHost: true,
      skipCSRFCheck,
      adapter,
      providers: [resendProvider],
    },
  );

  return { result, sent };
}

const accepted = () =>
  new Response('{"id":"stub"}', { status: 200, headers: { 'content-type': 'application/json' } });

async function sendOneEmail(): Promise<SentEmail> {
  const { result, sent } = await requestSignIn(accepted);
  expect(result.status).toBe(302);
  expect(sent).toHaveLength(1);
  return sent[0];
}

function telemetry(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls
    .map(([record]: unknown[]) => {
      try {
        return JSON.parse(String(record)) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter(event => event?.operation === 'magic_link_request');
}

describe('magic link delivery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emails the inert /verify landing page, never the token-consuming callback', async () => {
    const email = await sendOneEmail();

    const href = /href="([^"]+)"/.exec(email.html)?.[1];
    expect(href).toBeDefined();

    const landing = new URL(href!);
    expect(landing.origin).toBe(ORIGIN);
    expect(landing.pathname).toBe('/verify');

    // The real callback survives only as the landing page's encoded
    // `callbackUrl` parameter; it must never be a link a mail client — or the
    // scanner ahead of it — can resolve on its own.
    expect(landing.searchParams.get('callbackUrl')).toMatch(
      /^\/api\/auth\/callback\/resend\?.*\btoken=/,
    );
  });

  it('keeps the plain-text part on the same landing URL', async () => {
    const email = await sendOneEmail();

    expect(email.text).toContain(`${ORIGIN}/verify?callbackUrl=`);
    expect(email.text).not.toMatch(/https:\/\/\S*\/api\/auth\/callback\/resend/);
  });

  it('sends the house template, not the stock Auth.js one', async () => {
    const email = await sendOneEmail();

    expect(email.subject).toBe('Your Pathfinder sign-in link');
    expect(email.html).toContain('Sign in to Pathfinder');
  });

  it('reports the send on the operational telemetry channel', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    await sendOneEmail();

    const events = telemetry(info);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      service: 'authentication',
      operation: 'magic_link_request',
      outcome: 'success',
    });
    expect(typeof events[0]!.duration_ms).toBe('number');
    expect(typeof events[0]!.correlation_id).toBe('string');
  });

  // Invoked directly rather than through Auth(): @auth/core starts the send and
  // then awaits a hash before joining both promises, so a rejection spends a
  // microtask unhandled and Vitest fails the run on it. `options` is the copy
  // the merge above resolves to, so this is still the function that ships.
  it('reports a rejected send as a failure and rethrows', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('rate limited', { status: 429 }),
    );

    const send = resendProvider.options?.sendVerificationRequest;
    expect(send).toBeTypeOf('function');

    await expect(
      send!({
        identifier: 'user@example.com',
        url: `${ORIGIN}/api/auth/callback/resend?callbackUrl=%2F&token=t&email=user%40example.com`,
        provider: { apiKey: 'test-key', from: 'Pathfinder <login@windwardline.com>' },
        expires: new Date(),
        token: 't',
        theme: {},
        request: new Request(ORIGIN),
      } as unknown as Parameters<NonNullable<typeof send>>[0]),
    ).rejects.toThrow(/429/);

    const events = telemetry(error);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ outcome: 'failure', severity: 'error' });
  });
});
