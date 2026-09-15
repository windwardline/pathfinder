import { describe, expect, it, vi } from 'vitest';
import { suppressionStatus } from '../src/lib/suppression';

/**
 * A suppressed recipient is the one magic-link failure that reports success.
 * Resend accepts the POST, marks the email `suppressed`, delivers nothing, and
 * answers 2xx — so every status-code branch in the sender reads "sent" and the
 * reader is sent to an inbox that will never receive anything.
 *
 * The distinction under test is `clear` (a 404 — confirmed absent) versus
 * `unknown` (the lookup did not complete). Only the first is evidence. The
 * second must never be treated as clear internally, and must never block a
 * sign-in either: this check exists to make an invisible failure visible, not
 * to gate authentication, so its own outage degrades to sending anyway.
 */
describe('suppressionStatus', () => {
  const ok = (status: number) => async () => new Response('{}', { status });

  it('reads 200 as suppressed', async () => {
    expect(await suppressionStatus('re_k', 'a@example.com', ok(200))).toBe('suppressed');
  });

  it('reads 404 as clear', async () => {
    expect(await suppressionStatus('re_k', 'a@example.com', ok(404))).toBe('clear');
  });

  it('reads any other status as unknown, never as clear', async () => {
    for (const status of [401, 403, 429, 500, 503]) {
      expect(await suppressionStatus('re_k', 'a@example.com', ok(status))).toBe('unknown');
    }
  });

  it('reads a thrown network error as unknown rather than propagating', async () => {
    const boom = async () => {
      throw new TypeError('fetch failed');
    };
    expect(await suppressionStatus('re_k', 'a@example.com', boom)).toBe('unknown');
  });

  it('treats a missing API key as unknown, not as clear', async () => {
    // A lookup that never happened is not evidence the address is fine.
    const called = vi.fn();
    expect(await suppressionStatus(undefined, 'a@example.com', called as never)).toBe('unknown');
    expect(called).not.toHaveBeenCalled();
  });

  it('encodes the address into the path', async () => {
    // A `+` tag left raw decodes to a space server-side and addresses a
    // different resource, which answers 404 and reads as clear.
    let seen = '';
    const capture = (async (url: string | URL | Request) => {
      seen = String(url);
      return new Response('{}', { status: 404 });
    }) as unknown as typeof fetch;
    await suppressionStatus('re_k', 'user+tag@example.com', capture);
    expect(seen).toBe('https://api.resend.com/suppressions/user%2Btag%40example.com');
    expect(seen).not.toContain('+tag@');
  });

  it('sends the key as a bearer token', async () => {
    let auth: string | null = null;
    const capture = (async (_url: string | URL | Request, init?: RequestInit) => {
      auth = new Headers(init?.headers).get('authorization');
      return new Response('{}', { status: 404 });
    }) as unknown as typeof fetch;
    await suppressionStatus('re_secret', 'a@example.com', capture);
    expect(auth).toBe('Bearer re_secret');
  });
});
