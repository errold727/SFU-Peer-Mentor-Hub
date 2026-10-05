import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { MENTOR_CODE_SHA256 } from '../src/app/access';
import { installTimetableFixtures } from './fixtures/timetable';

const roleKey = 'pmh-role';
const protectedRoutes = ['resources', 'poster', 'poster/edit', 'poster/templates', 'unknown-area'];
const navigation = (page: Page) => page.getByRole('navigation', { name: 'Main navigation' });
const planner = (page: Page) =>
  page.getByRole('heading', { name: 'SFU Course Planner', exact: true });

async function selector(page: Page) {
  await expect(
    page.getByRole('heading', { name: 'SFU Peer Mentor Hub', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Choose your access', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Peer Mentor', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mentee / Student', exact: true })).toBeVisible();
  await expect(navigation(page)).toHaveCount(0);
}

async function mentorForm(page: Page) {
  await page.getByRole('button', { name: 'Peer Mentor', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mentor Access', exact: true })).toBeVisible();
  await expect(page.getByLabel('Access Code', { exact: true })).toHaveAttribute('type', 'password');
}

async function openMobileNavigation(page: Page) {
  const toggle = page.getByRole('button', { name: 'Toggle navigation', exact: true });
  if (await toggle.isVisible()) await toggle.click();
}

async function student(page: Page) {
  await installTimetableFixtures(page);
  await page.goto('./#/');
  await selector(page);
  await page.getByRole('button', { name: 'Mentee / Student', exact: true }).click();
  await expect(planner(page)).toBeVisible();
  await expect(page.getByRole('article', { name: 'TEST 101 D100', exact: true })).toBeVisible();
}

async function expectNoPosterActions(page: Page) {
  await expect(page.getByRole('button', { name: /Poster/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Poster/i })).toHaveCount(0);
}

function observe(page: Page, baseURL: string) {
  const errors: string[] = [],
    consoleMessages: string[] = [],
    requests: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    consoleMessages.push(message.text());
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (request) => {
    requests.push(`${request.url()} ${request.postData() ?? ''}`);
    if (new URL(request.url()).origin !== new URL(baseURL).origin) external.push(request.url());
  });
  return { errors, consoleMessages, requests, external };
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`access: fresh ${viewport.width}px session has concise, accessible role choices`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('./#/');
    await selector(page);
    for (const copy of [
      'No account required.',
      'Student View.',
      'Browse course offerings and learn about the project.',
      'Access mentor resources and creation tools.',
    ])
      await expect(page.getByText(copy, { exact: true })).toHaveCount(0);
    const mentor = page.getByRole('button', { name: 'Peer Mentor', exact: true });
    await mentor.focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Mentee / Student', exact: true })).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    expect(
      await page.evaluate(() => ({
        role: sessionStorage.getItem('pmh-role'),
        local: localStorage.length,
      })),
    ).toEqual({ role: null, local: 0 });
    if (viewport.width === 1440)
      await page.screenshot({ path: testInfo.outputPath('role-entry-desktop.png') });
  });
}

test('access: fresh and invalid sessions cannot mount protected pages', async ({ page }) => {
  for (const route of ['', ...protectedRoutes, 'course-planner', 'about']) {
    await page.goto(`./#/${route}`);
    await selector(page);
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Add to Poster/i })).toHaveCount(0);
  }
  await page.evaluate((key) => sessionStorage.setItem(key, 'administrator'), roleKey);
  await page.reload();
  await selector(page);
});

test('access: incorrect code stays local and Back clears the form', async ({ page, baseURL }) => {
  const observed = observe(page, baseURL!);
  const wrongCode = 'synthetic-incorrect-attempt';
  await page.goto('./#/');
  await mentorForm(page);
  await page.getByLabel('Access Code', { exact: true }).fill(wrongCode);
  await page.getByRole('button', { name: 'Enter Hub', exact: true }).click();
  await expect(page.getByText('Incorrect access code.', { exact: true })).toBeVisible();
  await expect(navigation(page)).toHaveCount(0);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), roleKey)).toBeNull();
  expect(observed.requests.join('\n')).not.toContain(wrongCode);
  expect(observed.consoleMessages.join('\n')).not.toContain(wrongCode);
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await selector(page);
  await mentorForm(page);
  await expect(page.getByLabel('Access Code', { exact: true })).toHaveValue('');
  await expect(page.getByText('Incorrect access code.', { exact: true })).toHaveCount(0);
});

test('access: accepted digest opens the complete mentor workspace and Switch role clears only role state', async ({
  page,
}) => {
  // This committed positive-path fixture substitutes only the SHA-256 result.
  // Acceptance of the real supplied code is verified separately with an untracked harness.
  await page.addInitScript((digest) => {
    Object.defineProperty(crypto.subtle, 'digest', {
      value: async () =>
        Uint8Array.from(digest.match(/.{2}/g)!, (byte) => parseInt(byte, 16)).buffer,
    });
  }, MENTOR_CODE_SHA256);
  await page.goto('./#/');
  await mentorForm(page);
  await page.getByLabel('Access Code', { exact: true }).fill('synthetic-positive-flow');
  await page.getByRole('button', { name: 'Enter Hub', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'This week at SFU', exact: true })).toBeVisible();
  await expect(navigation(page).getByRole('link')).toHaveText([
    'Home',
    'Resources',
    'Poster Maker',
    'Course Planner',
    'About',
  ]);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), roleKey)).toBe('mentor');
  await page.reload();
  await expect(navigation(page)).toBeVisible();
  await page.setViewportSize({ width: 768, height: 1024 });
  await openMobileNavigation(page);
  for (const name of ['Home', 'Resources', 'Poster Maker', 'Course Planner', 'About']) {
    await expect(navigation(page).getByRole('link', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Switch role', exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./#/poster/templates');
  await expect(page.getByRole('heading', { name: 'Template Gallery', exact: true })).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem('synthetic-unrelated-key', 'preserve'));
  await page.getByRole('button', { name: 'Switch role', exact: true }).click();
  await selector(page);
  expect(
    await page.evaluate(() => ({
      role: sessionStorage.getItem('pmh-role'),
      other: sessionStorage.getItem('synthetic-unrelated-key'),
      local: localStorage.length,
    })),
  ).toEqual({ role: null, other: 'preserve', local: 0 });
  await page.goto('./#/poster/edit');
  await selector(page);
});

test('access: student navigation and all mentor-only direct routes are guarded', async ({
  page,
}) => {
  await student(page);
  await expect(navigation(page).getByRole('link')).toHaveText(['Course Planner', 'About']);
  await expectNoPosterActions(page);
  for (const route of ['', ...protectedRoutes]) {
    await page.goto(`./#/${route}`);
    await expect(planner(page)).toBeVisible();
    await expect(page).toHaveURL(/#\/course-planner$/);
    await expectNoPosterActions(page);
    await expect(page.locator('canvas')).toHaveCount(0);
  }
  await navigation(page).getByRole('link', { name: 'About', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible();
  expect(await page.evaluate((key) => sessionStorage.getItem(key), roleKey)).toBe('mentee');
});

test('access: mobile student course details, selections, conflicts and timetable remain usable', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const observed = observe(page, baseURL!);
  await student(page);
  await openMobileNavigation(page);
  await expect(navigation(page).getByRole('link')).toHaveText(['Course Planner', 'About']);
  await page.getByRole('button', { name: 'Toggle navigation', exact: true }).click();
  for (const code of ['TEST 101', 'TEST 102']) {
    await page.getByRole('textbox', { name: 'Find a course', exact: true }).fill(code);
    const card = page.getByRole('article', { name: `${code} D100`, exact: true });
    await card.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(card.getByRole('button', { name: 'Added', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }
  await expectNoPosterActions(page);
  const card = page.getByRole('article', { name: 'TEST 102 D100', exact: true });
  await card.getByRole('button', { name: 'Details →', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Example instructor');
  await expect(dialog.getByRole('link', { name: 'CourSys ↗', exact: true })).toBeVisible();
  await expectNoPosterActions(page);
  await dialog.getByRole('button', { name: 'Close details', exact: true }).click();
  await page.getByRole('button', { name: /^View Timetable/ }).click();
  dialog = page.getByRole('dialog', { name: 'My Timetable', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('timetable-meeting')).toHaveCount(4);
  await expect(dialog.locator('.timetable-status')).toContainText('1 conflicting section pair');
  await expect(
    dialog.locator('[data-testid="timetable-meeting"][data-conflict="true"]'),
  ).toHaveCount(2);
  await expectNoPosterActions(page);
  await dialog.getByRole('button', { name: 'Close timetable', exact: true }).click();
  await expect(page.getByRole('button', { name: /^View Timetable/ })).toBeFocused();
  expect(
    await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
      role: sessionStorage.getItem('pmh-role'),
    })),
  ).toEqual({ local: [], session: ['pmh-role'], role: 'mentee' });
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
  await openMobileNavigation(page);
  await page.getByRole('button', { name: 'Switch role', exact: true }).click();
  await selector(page);
});
