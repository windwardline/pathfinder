import { expect, test } from '@playwright/test';
import { db, sessions, users } from '@pathfinder/core';
import { eq } from 'drizzle-orm';
import path from 'node:path';

const userIds = new Set<string>();

test.beforeEach(async ({ context }, testInfo) => {
  const suffix = `demo-video-${testInfo.project.name}-${crypto.randomUUID()}`;
  const userId = `e2e-${suffix}`;
  const sessionToken = `e2e-session-${suffix}`;
  userIds.add(userId);

  await db.insert(users).values({
    id: userId,
    email: `${suffix}@example.invalid`,
    emailVerified: new Date(),
  });
  await db.insert(sessions).values({
    sessionToken,
    userId,
    expires: new Date(Date.now() + 60 * 60_000),
  });
  await context.addCookies([
    {
      name: 'authjs.session-token',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ]);
});

test.afterAll(async () => {
  for (const userId of userIds) {
    await db.delete(users).where(eq(users.id, userId));
  }
});

test('mobile acceptance: capture the authentic responsive Today view for the demo video', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.getByLabel('Demonstration scenario').selectOption('SD-008');
  await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();

  await expect(
    page.getByRole('heading', { name: 'Obtain a state identification card' })
  ).toBeVisible();
  await expect(page.getByText(/Proposed Facts don't affect your Route until you confirm them/)).toBeVisible();

  await page.screenshot({
    path: path.resolve(process.cwd(), '../../docs/demo/captures/today-mobile-authentic.png'),
    animations: 'disabled',
    caret: 'hide',
  });
});

test('capture the authentic dark Route History view for the demo video', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.getByLabel('Demonstration scenario').selectOption('SD-008');
  await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();

  await expect(
    page.getByRole('heading', { name: 'Obtain a state identification card' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Mark as complete' }).click();
  await expect(page.getByRole('dialog', { name: 'You completed an Action' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to your Route' }).click();
  await page.getByRole('link', { name: 'Route History' }).click();
  await expect(page.getByRole('heading', { name: 'How your Route has changed' })).toBeVisible();

  await page.screenshot({
    path: path.resolve(process.cwd(), '../../docs/demo/captures/route-history-authentic-dark.png'),
    animations: 'disabled',
    caret: 'hide',
  });
});
