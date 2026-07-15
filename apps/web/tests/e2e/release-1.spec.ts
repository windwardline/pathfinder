import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { db, sessions, users } from '@pathfinder/core';
import { eq } from 'drizzle-orm';

const userIds = new Set<string>();

async function expectNoSeriousAccessibilityViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? '')),
    results.violations.map(violation => `${violation.id}: ${violation.help}`).join('\n')
  ).toEqual([]);
}

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
  await expect(events.first()).toContainText('Moved:');
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

test('guided intake exposes every canonical user-facing Fact type', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();
  await expect(page.getByRole('heading', { name: 'Obtain a state identification card' })).toBeVisible();
  await page.getByRole('link', { name: 'Facts', exact: true }).click();
  await page.getByRole('tab', { name: 'Add manually' }).click();

  const factKind = page.getByLabel('What are you adding?');
  await expect(factKind.locator('option')).toHaveText([
    'An Action',
    'A Goal',
    'A Requirement',
    'A Constraint',
    'An Obligation',
    'A Deadline',
    'A Blocker',
  ]);

  await factKind.selectOption('CONSTRAINT');
  await page.getByLabel('Describe this Fact').fill('Morning transportation is unavailable');
  await page.getByLabel('Affected Action').selectOption({
    label: 'Complete employment onboarding at Harbor Light Logistics',
  });
  await page.getByLabel('Action that can resolve this (optional)').selectOption({
    label: 'Obtain a state identification card',
  });
  await page.getByRole('button', { name: 'Add as Proposed Fact' }).click();

  await expect(page.getByText('Added as a Proposed Fact — review it below.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Morning transportation is unavailable' })).toBeVisible();
  await expect(page.getByText('Constraint', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Today' }).click();
  await expect(page.getByRole('heading', { name: 'Obtain a state identification card' })).toBeVisible();
});

test('first-use guided intake leads from Fact type to Proposed review', async ({ page }) => {
  await page.goto('/facts');
  await page.getByRole('tab', { name: 'Add manually' }).click();
  await expect(page.getByText('Guided intake · Step 1 of 3')).toBeVisible();
  await page.getByLabel('What are you adding?').selectOption('ACTION');
  await page.getByRole('button', { name: 'Continue to describe this Fact' }).click();
  await expect(page.getByText('Guided intake · Step 2 of 3')).toBeVisible();
  await page.getByLabel('What needs to happen?').fill('Call the identification office');
  await page.getByRole('button', { name: 'Add as Proposed Fact' }).click();
  await expect(page.getByText('Guided intake · Step 3 of 3')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Call the identification office' })).toBeVisible();
});

test('every confirmed Fact type can start a Proposed correction with inspectable evidence', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Demonstration scenario').selectOption('SD-003');
  await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();
  await expect(page.getByRole('heading', { name: 'Call your supervision officer' })).toBeVisible();
  await page.getByRole('link', { name: 'Facts', exact: true }).click();

  const proposed = page.locator('li').filter({
    has: page.getByRole('heading', { name: 'Reliable transportation is temporarily unavailable.' }),
  });
  await proposed.getByRole('button', { name: 'Confirm' }).click();
  const dialog = page.getByRole('dialog', { name: 'You confirmed a fact' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Back to your Route' }).click();

  const confirmed = page.locator('li').filter({
    hasText: 'Reliable transportation is temporarily unavailable.',
  });
  await confirmed.getByText('View supporting evidence').click();
  await expect(confirmed.getByText(/Integrity/)).toHaveCount(2);
  await confirmed.getByRole('button', { name: 'Correct' }).click();
  await confirmed.getByLabel('Corrected Constraint').fill('Transportation is available after 10:00 AM.');
  await confirmed.getByRole('button', { name: 'Save Proposed correction' }).click();
  await expect(page.getByText(/current Confirmed Fact stays active/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Transportation is available after 10:00 AM.' })).toBeVisible();
});

test('deadline intake derives urgency without exposing a ranking control', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();
  await page.getByRole('link', { name: 'Facts', exact: true }).click();
  await page.getByRole('tab', { name: 'Add manually' }).click();
  await page.getByLabel('What are you adding?').selectOption('DEADLINE');
  const dueDate = page.getByLabel('Due date and time');
  if ((await dueDate.count()) === 0) {
    await page.getByRole('button', { name: 'Continue to describe this Fact' }).click();
  }
  await expect(page.getByLabel('How strongly should this deadline affect the Route?')).toHaveCount(0);
  await dueDate.fill('2026-12-31T12:00');
  await expect(page.getByText(/derives urgency from the confirmed due date/)).toBeVisible();
});

test('seeded demonstration catalog selects the completed Route scenario', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Demonstration scenario').selectOption('SD-010');
  await expect(page.getByText('Demonstrate successful completion of all Goals.')).toBeVisible();
  await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();

  await expect(
    page.getByRole('heading', { name: 'Every Action on your Route is complete' })
  ).toBeVisible();
});

const scenarioFocusExpectations = [
  ['SD-001', 'Obtain a state identification card'],
  ['SD-002', 'Complete employment onboarding at Harbor Light Logistics'],
  ['SD-003', 'Call your supervision officer'],
  ['SD-004', 'Complete the housing application'],
  ['SD-005', 'Complete an optional worksheet'],
  ['SD-006', 'Attend orientation'],
  ['SD-007', 'Obtain a state identification card'],
  ['SD-008', 'Obtain a state identification card'],
  ['SD-009', 'Obtain a state identification card'],
] as const;

for (const [scenarioId, focusTitle] of scenarioFocusExpectations) {
  test(`${scenarioId}: canonical scenario opens with the expected Focus Action`, async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Demonstration scenario').selectOption(scenarioId);
    await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();
    await expect(page.getByRole('heading', { name: focusTitle })).toBeVisible();
  });
}

const proposedDomainScenarios = [
  ['SD-003', 'Call your supervision officer', 'Reliable transportation is temporarily unavailable.', 'Restore transportation access'],
  ['SD-004', 'Complete the housing application', 'The fictional housing denial must be reviewed first.', 'Request a housing denial review'],
  ['SD-005', 'Complete an optional worksheet', 'Attend the required supervision check-in', 'Resolve the work schedule conflict'],
  ['SD-006', 'Attend orientation', 'Paperwork submission deadline', 'Submit time-sensitive paperwork'],
] as const;

for (const [scenarioId, initialFocus, proposedTitle, expectedFocus] of proposedDomainScenarios) {
  test(`${scenarioId}: confirming the canonical domain Fact produces the expected Reroute`, async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Demonstration scenario').selectOption(scenarioId);
    await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();
    // The seed is an asynchronous client mutation. Synchronize on its visible
    // outcome before navigating so the test exercises the resulting scenario.
    await expect(page.getByRole('heading', { name: initialFocus })).toBeVisible();
    await page.getByRole('link', { name: 'Facts', exact: true }).click();
    const proposed = page.locator('li').filter({ has: page.getByRole('heading', { name: proposedTitle }) });
    await proposed.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('dialog', { name: 'You confirmed a fact' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Back to your Route' }).click();
    await page.getByRole('link', { name: 'Today' }).click();
    await expect(page.getByRole('heading', { name: expectedFocus })).toBeVisible();
  });
}

test('demonstration mode requires an explicit replacement confirmation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();
  await expect(page.getByRole('heading', { name: 'Obtain a state identification card' })).toBeVisible();
  await page.getByRole('link', { name: 'Account' }).click();
  await page.getByLabel('Scenario').selectOption('SD-010');
  const load = page.getByRole('button', { name: 'Load this demonstration' });
  await expect(load).toBeDisabled();
  await page.getByLabel(/I understand this replaces my current Route data/).check();
  await load.click();
  await expect(page.getByRole('heading', { name: 'Every Action on your Route is complete' })).toBeVisible();
});

test('accessibility gate: primary signed-in surfaces have no serious violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load the demonstration scenario' }).click();
  for (const href of ['/', '/route', '/facts', '/history', '/account']) {
    await page.goto(href);
    await expect(page.locator('main')).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
  }
});

test('keyboard and reduced-motion gate: fact capture remains operable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/facts');
  await page.getByRole('tab', { name: 'Paste a document' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Add manually' })).toBeFocused();
  await expect(page.getByLabel('What are you adding?')).toBeVisible();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
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
