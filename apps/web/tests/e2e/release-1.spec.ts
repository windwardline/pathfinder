import { expect, test } from '@playwright/test';
import { db, sessions, users } from '@pathfinder/core';
import { eq } from 'drizzle-orm';

const userIds = new Set<string>();

test.beforeEach(async ({ context }, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.workerIndex}-${crypto.randomUUID()}`;
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

test('AT-001, AT-002, and AT-008: seeded Route completes and explains a meaningful Reroute', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your Route starts with a fact' })).toBeVisible();

  await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();

  await expect(
    page.getByRole('heading', { name: 'Obtain a state identification card' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Show reason codes' }).click();
  await expect(page.getByText(/HARD_PREREQUISITE/)).toBeVisible();
  await expect(page.getByText(/HIGH_UNLOCK_VALUE/)).toBeVisible();

  await page.getByRole('button', { name: 'Mark as complete' }).click();

  const dialog = page.getByRole('dialog', { name: 'You completed an Action' });
  await expect(dialog).toBeVisible();
  const available = dialog.locator('dt', { hasText: 'Became available' }).locator('..').locator('dd');
  await expect(available).toContainText('Complete employment onboarding at Harbor Light Logistics');
  await expect(available).toContainText('Submit the housing application at Riverside Commons');
  await expect(available).toContainText('Open a checking account');
  await dialog.getByRole('button', { name: 'Back to your Route' }).click();

  await page.getByRole('link', { name: 'Route History' }).click();
  const events = page.locator('main ol > li');
  await expect(events).toHaveCount(2);
  await expect(events.first()).toContainText('Action completed');
  await expect(events.first()).toContainText('Completed: Obtain a state identification card');
  await expect(events.nth(1)).toContainText('Fact confirmed');
  await expect(events.nth(1)).toContainText('Added:');
});

test('AT-003 and AT-004: a Proposed Fact cannot affect the Route until confirmation', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();
  await expect(
    page.getByRole('heading', { name: 'Obtain a state identification card' })
  ).toBeVisible();

  await page.getByRole('link', { name: 'Facts', exact: true }).click();
  await page.getByRole('tab', { name: 'Add manually' }).click();
  await page.getByLabel('What needs to happen?').fill('Apply for a transit pass');
  await page.getByLabel('Helpful context').fill('Bring the Confirmed state identification card.');
  await page.getByRole('button', { name: 'Add as Proposed Fact' }).click();
  await expect(page.getByText('Added as a Proposed Fact — review it below.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Apply for a transit pass' })).toBeVisible();

  await page.getByRole('link', { name: 'Today' }).click();
  await expect(
    page.getByRole('heading', { name: 'Obtain a state identification card' })
  ).toBeVisible();
  await expect(page.getByText(/Proposed Facts don't affect your Route until you confirm them/)).toBeVisible();

  await page.getByRole('link', { name: 'Facts', exact: true }).click();
  const proposedCard = page.locator('li').filter({
    has: page.getByRole('heading', { name: 'Apply for a transit pass' }),
  });
  await proposedCard.getByRole('button', { name: 'Confirm' }).click();

  const dialog = page.getByRole('dialog', { name: 'You confirmed a fact' });
  await expect(dialog).toBeVisible();
  const added = dialog.locator('dt', { hasText: 'Added to your Route' }).locator('..').locator('dd');
  await expect(added).toHaveText('Apply for a transit pass');
});

test('mobile acceptance: the Focus Action and Reroute remain available at 390px', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();
  await expect(
    page.getByRole('heading', { name: 'Obtain a state identification card' })
  ).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();

  await page.getByRole('button', { name: 'Mark as complete' }).click();
  await expect(page.getByRole('dialog', { name: 'You completed an Action' })).toBeVisible();
});
