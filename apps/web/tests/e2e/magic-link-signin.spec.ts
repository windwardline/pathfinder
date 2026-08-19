import { expect, test } from '@playwright/test';
import { db, users, verificationTokens } from '@pathfinder/core';
import { eq } from 'drizzle-orm';
import { toScannerSafeVerificationUrl } from '../../src/lib/magic-link';

// Every other E2E spec injects a session cookie and starts already signed in,
// so nothing exercised the emailed link itself. This spec walks the real path:
// the URL Auth.js hands the mailer, rewritten exactly as production rewrites it.

const ORIGIN = 'http://localhost:3000';

// @auth/core stores sha256(`${token}${secret}`) and mails the raw token; the
// same secret the Playwright web server runs with.
const SECRET =
  process.env.AUTH_SECRET ?? 'pathfinder-local-e2e-auth-secret-32-characters';

async function hash(token: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${token}${SECRET}`)
  );
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

const emails = new Set<string>();

/** Mints a live token and returns the URL that would arrive in the inbox. */
async function emailedLink(email: string) {
  emails.add(email);
  const token = crypto.randomUUID().replaceAll('-', '');
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
  await db.insert(verificationTokens).values({
    identifier: email,
    token: await hash(token),
    expires: new Date(Date.now() + 15 * 60_000),
  });

  // Byte-for-byte the URL @auth/core builds for sendVerificationRequest.
  return toScannerSafeVerificationUrl(
    `${ORIGIN}/api/auth/callback/resend?${new URLSearchParams({
      callbackUrl: `${ORIGIN}/`,
      token,
      email,
    })}`
  );
}

async function tokenCount(email: string) {
  return (
    await db.select().from(verificationTokens).where(eq(verificationTokens.identifier, email))
  ).length;
}

test.afterAll(async () => {
  for (const email of emails) {
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
    await db.delete(users).where(eq(users.email, email));
  }
});

test('a clicked magic link signs the person in', async ({ page, context }) => {
  const email = `signin-${crypto.randomUUID()}@example.invalid`;

  await page.goto(await emailedLink(email));
  await expect(page.getByRole('heading', { name: 'Continue signing in' })).toBeVisible();

  // A native GET form, not a server action: Next.js resolves a server action's
  // redirect internally, which spends the token while the Set-Cookie it earns
  // never leaves the server.
  const form = page.locator('form');
  await expect(form).toHaveAttribute('method', /get/i);
  await expect(form).toHaveAttribute('action', '/api/auth/callback/resend');

  await page.getByRole('button', { name: 'Continue to Pathfinder' }).click();

  // The whole point: the browser — not the server resolving a redirect on its
  // own — follows the callback, so Set-Cookie actually reaches the browser.
  await expect(page).toHaveURL(`${ORIGIN}/`);
  await expect(page).not.toHaveURL(/\/signin/);

  const session = (await context.cookies()).find(cookie =>
    cookie.name.endsWith('authjs.session-token')
  );
  expect(session, 'the session cookie must reach the browser').toBeDefined();

  await expect(page.getByRole('link', { name: 'Route History' })).toBeVisible();
});

test('merely opening the landing page never consumes the token', async ({ page }) => {
  const email = `scanner-${crypto.randomUUID()}@example.invalid`;
  const link = await emailedLink(email);

  // What a mail scanner does: GET the URL, follow nothing.
  await page.goto(link);
  await expect(page.getByRole('heading', { name: 'Continue signing in' })).toBeVisible();

  expect(await tokenCount(email), 'the token must survive an unattended GET').toBe(1);
});

test('a spent link returns to sign-in with the expired-link notice', async ({ page }) => {
  const email = `spent-${crypto.randomUUID()}@example.invalid`;
  const link = await emailedLink(email);

  await page.goto(link);
  await page.getByRole('button', { name: 'Continue to Pathfinder' }).click();
  await expect(page).toHaveURL(`${ORIGIN}/`);

  // Same link, second click: single-use must still hold.
  await page.context().clearCookies();
  await page.goto(link);
  await page.getByRole('button', { name: 'Continue to Pathfinder' }).click();

  await expect(page).toHaveURL(/\/signin\?error=Verification/);
  // Not getByRole('alert'): Next.js's route announcer carries that role too.
  await expect(
    page.getByText('That sign-in link has expired or was already used')
  ).toBeVisible();
});
