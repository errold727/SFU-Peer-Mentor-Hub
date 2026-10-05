import { expect, test, type Locator, type Page } from './fixtures/mentor';
import AxeBuilder from '@axe-core/playwright';
import { installTimetableFixtures } from './fixtures/timetable';

const launcher = (page: Page) => page.getByRole('button', { name: /^View Timetable/ });
const modal = (page: Page) => page.getByRole('dialog', { name: 'My Timetable', exact: true });
const course = (page: Page, code: string, section = 'D100') =>
  page.getByRole('article', { name: `${code} ${section}`, exact: true, includeHidden: true });
const gridMeeting = (
  page: Page,
  code: string,
  day: string,
  section = 'D100',
  term = 'Spring 2027',
) =>
  modal(page).locator(
    `[data-testid="timetable-meeting"][data-course-id="${term}:${code}:${section}"][data-day="${day}"]`,
  );

function audit(page: Page, baseURL: string) {
  const errors: string[] = [];
  const external: string[] = [];
  const origin = new URL(baseURL).origin;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== origin)
      external.push(url.href);
  });
  return { errors, external };
}

async function ready(page: Page) {
  await expect(
    page.getByRole('heading', { name: 'SFU Course Planner', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.course-card').first()).toBeVisible();
  await expect(page.getByText('Loading course offerings…', { exact: true })).toHaveCount(0);
}

async function start(page: Page) {
  await installTimetableFixtures(page);
  await page.goto('./#/course-planner');
  await ready(page);
}

async function select(page: Page, code: string, section = 'D100') {
  await page.getByRole('textbox', { name: 'Find a course', exact: true }).fill(code);
  const card = course(page, code, section);
  await card.getByRole('button', { name: '+ Compare', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Selected', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
}

async function expectCount(page: Page, count: number) {
  await expect(launcher(page)).toHaveCount(count ? 1 : 0);
  if (count) await expect(launcher(page).locator('.timetable-count')).toHaveText(String(count));
}

async function open(page: Page) {
  await launcher(page).click();
  await expect(modal(page)).toBeVisible();
  await expect(launcher(page)).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(1);
}

async function selectedPanel(page: Page, count: number) {
  const summary = modal(page)
    .locator('summary')
    .filter({ hasText: `Selected sections (${count})` });
  await expect(summary).toHaveText(`Selected sections (${count})`);
  const panel = modal(page)
    .locator('details')
    .filter({
      has: page.locator('summary').filter({ hasText: `Selected sections (${count})` }),
    });
  if (!(await panel.evaluate((node) => (node as HTMLDetailsElement).open))) await summary.click();
  return panel;
}

async function close(page: Page) {
  await modal(page).getByRole('button', { name: 'Close timetable', exact: true }).click();
  await expect(modal(page)).toHaveCount(0);
  await expect(launcher(page)).toBeFocused();
}

async function cleanAccessibility(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

async function box(locator: Locator) {
  const bounds = await locator.boundingBox();
  expect(bounds).not.toBeNull();
  return bounds!;
}

test('timetable: desktop shared selection survives filters, pages, details and internal navigation', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const observed = audit(page, baseURL!);
  await start(page);
  await expectCount(page, 0);
  await select(page, 'TEST 101');
  await expect(
    course(page, 'TEST 101').getByRole('button', { name: 'Selected', exact: true }),
  ).toBeFocused();
  await expect(modal(page)).toHaveCount(0);
  await expectCount(page, 1);
  // Compare is a toggle. Revisiting/reselecting a section never creates duplicates.
  await course(page, 'TEST 101').getByRole('button', { name: 'Selected', exact: true }).click();
  await expectCount(page, 0);
  await select(page, 'TEST 101');
  await open(page);
  await selectedPanel(page, 1);
  await expect(modal(page).getByTestId('timetable-meeting')).toHaveCount(3);
  await close(page);

  await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('ALT');
  await select(page, 'ALT 201');
  await page.getByRole('combobox', { name: 'Campus', exact: true }).selectOption('Surrey');
  await page.getByRole('combobox', { name: 'Sort by', exact: true }).selectOption('title');
  await expectCount(page, 2);
  await page.getByRole('combobox', { name: 'Campus', exact: true }).selectOption('All');
  await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('All');
  await page.getByRole('combobox', { name: 'Sort by', exact: true }).selectOption('code');
  await page.getByRole('textbox', { name: 'Find a course', exact: true }).fill('');
  await ready(page);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible();
  await course(page, 'TEST 111').getByRole('button', { name: '+ Compare', exact: true }).click();
  await expectCount(page, 3);
  await select(page, 'TEST 101', 'D200');
  await select(page, 'TEST 101', 'T101');
  await select(page, 'TEST 112');
  await expectCount(page, 6);
  await course(page, 'TEST 112').getByRole('button', { name: 'Details →', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close details', exact: true }).click();
  await expectCount(page, 6);

  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'About', exact: true })
    .click();
  await expect(launcher(page)).toHaveCount(0);
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Course Planner', exact: true })
    .click();
  await ready(page);
  await expectCount(page, 6);
  await open(page);
  const panel = await selectedPanel(page, 6);
  await expect(panel).toContainText('Multiple sections of this course selected.');
  await expect(panel).toContainText(
    'Required lecture, tutorial and lab combinations are not verified',
  );
  await close(page);
  expect(
    await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    })),
  ).toEqual({ local: [], session: ['pmh-role'] });
  expect(await page.evaluate(() => sessionStorage.getItem('pmh-role'))).toBe('mentor');
  expect(new URL(page.url()).hash).toBe('#/course-planner');
  expect(new URL(page.url()).search).toBe('');
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
  await page.reload();
  await ready(page);
  await expectCount(page, 0);
});

test('timetable: mobile focus, scroll restoration, removal and empty-state return', async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const observed = audit(page, baseURL!);
  await start(page);
  await select(page, 'TEST 101');
  await page.getByRole('textbox', { name: 'Find a course', exact: true }).fill('');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.locator('.course-card').last().scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  expect(scrollBefore).toBeGreaterThan(0);
  const launchBounds = await box(launcher(page));
  expect(launchBounds.x + launchBounds.width).toBeLessThanOrEqual(390);
  expect(launchBounds.y + launchBounds.height).toBeLessThanOrEqual(844);
  await open(page);
  const bounds = await box(modal(page));
  expect(bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.height).toBeLessThanOrEqual(844);
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await page
    .getByRole('textbox', { name: 'Find a course', exact: true, includeHidden: true })
    .focus();
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await modal(page).getByRole('button', { name: 'Close timetable', exact: true }).focus();
  for (const key of ['Shift+Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  }
  await gridMeeting(page, 'TEST 101', 'Mon').focus();
  await page.keyboard.press('Enter');
  const detail = modal(page).getByRole('region', { name: 'TEST 101 · D100', exact: true });
  await expect(detail).toContainText('Synthetic: Three-day lecture');
  await expect(detail).toContainText('Mon, Wed, Fri');
  await expect(detail).toContainText('2027-01-04');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await detail.getByRole('button', { name: 'Close meeting details', exact: true }).click();
  await expect(gridMeeting(page, 'TEST 101', 'Mon')).toBeFocused();
  await cleanAccessibility(page);
  await page.screenshot({ path: testInfo.outputPath('mobile-timetable.png') });
  await page.keyboard.press('Escape');
  await expect(modal(page)).toHaveCount(0);
  await expect(launcher(page)).toBeFocused();
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(
    2,
  );
  await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Find a course', exact: true })).toHaveValue('');
  await open(page);
  const panel = await selectedPanel(page, 1);
  await panel
    .getByRole('button', { name: 'Remove TEST 101 D100 from timetable', exact: true })
    .click();
  await expect(modal(page)).toBeVisible();
  await expect(
    modal(page).getByRole('heading', { name: 'No sections selected for Spring 2027', exact: true }),
  ).toBeVisible();
  await expectCount(page, 0);
  await modal(page).getByRole('button', { name: 'Back to courses', exact: true }).click();
  await expect(modal(page)).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Find a course', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Find a course', exact: true }).fill('TEST 101');
  await expect(
    course(page, 'TEST 101').getByRole('button', { name: '+ Compare', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
});

test('timetable: terms stay isolated and confirmed clear affects only the visible term', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await start(page);
  await select(page, 'TEST 101');
  await select(page, 'ALT 201');
  await page.getByRole('combobox', { name: 'Term', exact: true }).selectOption('1267');
  await select(page, 'TEST 101');
  await expectCount(page, 3);
  await expect(launcher(page)).toContainText('2 terms');
  await open(page);
  const term = modal(page).getByRole('combobox', { name: 'Timetable term', exact: true });
  await expect(term).toHaveValue('Fall 2026');
  await expect(modal(page).getByTestId('timetable-meeting')).toHaveCount(1);
  await expect(gridMeeting(page, 'TEST 101', 'Tue', 'D100', 'Fall 2026')).toHaveAttribute(
    'data-start',
    '1090',
  );
  await term.selectOption('Spring 2027');
  await expect(modal(page).getByTestId('timetable-meeting')).toHaveCount(4);
  await expect(modal(page).locator('[data-course-id^="Fall 2026:"]')).toHaveCount(0);
  let panel = await selectedPanel(page, 2);
  await panel.getByRole('button', { name: 'Clear Spring 2027 selections', exact: true }).click();
  await panel.getByRole('button', { name: 'Cancel', exact: true }).click();
  panel = await selectedPanel(page, 2);
  await panel.getByRole('button', { name: 'Clear Spring 2027 selections', exact: true }).click();
  await panel.getByRole('button', { name: 'Confirm clear Spring 2027', exact: true }).click();
  await expect(
    modal(page).getByRole('heading', { name: 'No sections selected for Spring 2027', exact: true }),
  ).toBeVisible();
  await term.selectOption('Fall 2026');
  await selectedPanel(page, 1);
  await expect(gridMeeting(page, 'TEST 101', 'Tue', 'D100', 'Fall 2026')).toBeVisible();
  await close(page);
  await expectCount(page, 1);
  await expect(
    course(page, 'TEST 101').getByRole('button', { name: 'Selected', exact: true }),
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Term', exact: true }).selectOption('1271');
  await expect(
    course(page, 'TEST 101').getByRole('button', { name: '+ Compare', exact: true }),
  ).toBeVisible();
  await open(page);
  // Browsed Spring has no choices, so the most recent remaining term is used.
  await expect(modal(page)).toContainText('Fall 2026');
  await expect(modal(page).getByTestId('timetable-meeting')).toHaveCount(1);
});

test('timetable: three overlapping sections use exact durations and separate stable lanes', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await start(page);
  for (const code of ['TEST 101', 'TEST 102', 'TEST 103']) await select(page, code);
  await open(page);
  await expect(modal(page).locator('.timetable-status')).toContainText(
    '3 conflicting section pairs in Spring 2027',
  );
  const blocks = ['TEST 101', 'TEST 102', 'TEST 103'].map((code) => gridMeeting(page, code, 'Mon'));
  for (const block of blocks) {
    await expect(block).toHaveAttribute('data-lane-count', '3');
    await expect(block).toHaveAttribute('data-conflict', 'true');
  }
  const boxes = await Promise.all(blocks.map(box));
  const mondayTrack = await box(
    modal(page).locator('[data-testid="timetable-day-track"][data-day="Mon"]'),
  );
  expect(boxes[0].y - mondayTrack.y).toBeCloseTo(108, 0);
  expect(boxes[0].height).toBeCloseTo(60, 0);
  expect(boxes[1].height).toBeCloseTo(72, 0);
  expect(boxes[2].height).toBeCloseTo(24, 0);
  expect(boxes[1].y - boxes[0].y).toBeCloseTo(0, 0);
  expect(boxes[2].y - boxes[0].y).toBeCloseTo(24, 0);
  const horizontal = [...boxes].sort((a, b) => a.x - b.x);
  for (let i = 1; i < horizontal.length; i++)
    expect(horizontal[i - 1].x + horizontal[i - 1].width).toBeLessThanOrEqual(horizontal[i].x + 1);
  const color = await blocks[0].evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(
    await gridMeeting(page, 'TEST 101', 'Wed').evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    ),
  ).toBe(color);
  await cleanAccessibility(page);
  await page.screenshot({ path: testInfo.outputPath('desktop-overlap-timetable.png') });
  await close(page);
  await open(page);
  expect(await blocks[0].evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(color);
});

test('timetable: adjacency and disjoint teaching dates do not become confirmed conflicts', async ({
  page,
}) => {
  await start(page);
  for (const code of ['TEST 101', 'TEST 104', 'TEST 105', 'TEST 106']) await select(page, code);
  await open(page);
  await expect(modal(page).locator('.timetable-status')).toContainText(
    'No detected time conflicts',
  );
  await expect(
    modal(page).locator('[data-testid="timetable-meeting"][data-conflict="true"]'),
  ).toHaveCount(0);
  const before = await box(gridMeeting(page, 'TEST 101', 'Mon'));
  const after = await box(gridMeeting(page, 'TEST 104', 'Mon'));
  expect(after.y - before.y - before.height).toBeCloseTo(0, 0);
  // Same weekly position still needs separate visual lanes even without shared dates.
  await expect(gridMeeting(page, 'TEST 105', 'Tue')).toHaveAttribute('data-lane-count', '2');
  await expect(gridMeeting(page, 'TEST 106', 'Tue')).toHaveAttribute('data-lane-count', '2');
  await gridMeeting(page, 'TEST 105', 'Tue').click();
  await expect(
    modal(page).getByRole('region', { name: 'TEST 105 · D100', exact: true }),
  ).toContainText('2027-01-31');
  await expect(page.getByRole('dialog')).toHaveCount(1);
});

test.describe('timetable campus-local time in another viewer timezone', () => {
  test.use({ timezoneId: 'Asia/Tokyo' });
  test('weekends, early/late meetings and a ten-minute block retain exact published times', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await start(page);
    await select(page, 'TEST 107');
    await open(page);
    await expect(modal(page)).toContainText('Pacific time');
    await expect(modal(page).getByTestId('timetable-meeting')).toHaveCount(3);
    const day = modal(page).getByRole('combobox', { name: 'Jump to timetable day', exact: true });
    await day.selectOption('Sat');
    const saturday = gridMeeting(page, 'TEST 107', 'Sat');
    await expect(saturday).toHaveAccessibleName(/7:15 AM.*7:45 AM/);
    await expect(saturday).toHaveAttribute('data-start', '435');
    expect((await box(saturday)).height).toBeCloseTo(36, 0);
    const saturdayTrack = await box(
      modal(page).locator('[data-testid="timetable-day-track"][data-day="Sat"]'),
    );
    expect((await box(saturday)).y - saturdayTrack.y).toBeCloseTo(18, 0);
    await day.selectOption('Sun');
    const sunday = gridMeeting(page, 'TEST 107', 'Sun');
    await expect(sunday).toHaveAccessibleName(/9:30 PM.*10:00 PM/);
    await expect(sunday).toHaveAttribute('data-start', '1290');
    await sunday.scrollIntoViewIfNeeded();
    const sundayBounds = await box(sunday);
    const scrollBounds = await box(
      modal(page).getByRole('region', { name: /weekly timetable, scroll/ }),
    );
    expect(sundayBounds.y).toBeGreaterThanOrEqual(scrollBounds.y);
    expect(sundayBounds.y + sundayBounds.height).toBeLessThanOrEqual(
      scrollBounds.y + scrollBounds.height,
    );
    await day.selectOption('Thu');
    const short = gridMeeting(page, 'TEST 107', 'Thu');
    await expect(short).toHaveAttribute('data-start', '570');
    await expect(short).toHaveAttribute('data-end', '580');
    expect((await box(short)).height).toBeCloseTo(12, 0);
    expect(await short.evaluate((node) => (node as HTMLElement).draggable)).toBe(false);
    expect(await short.evaluate((node) => getComputedStyle(node).resize)).toBe('none');
    await short.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await expect(short).toHaveAttribute('data-start', '570');
    await expect(short).toHaveAttribute('data-end', '580');
    await page.keyboard.press('Enter');
    const detail = modal(page).getByRole('region', { name: 'TEST 107 · D100', exact: true });
    await expect(detail).toContainText('Example Short Room');
    await expect(detail).toContainText('9:30 AM–9:40 AM');
    await expect(modal(page).getByRole('spinbutton')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await modal(page).getByRole('button', { name: 'Close meeting details', exact: true }).click();
    await modal(page).locator('summary').filter({ hasText: 'Text schedule' }).click();
    await expect(
      modal(page).getByRole('heading', { name: 'Examination details', exact: true }),
    ).toBeVisible();
    await expect(modal(page).locator('.tt-exams')).toContainText('2027-04-19');
    await expect(modal(page).getByTestId('timetable-meeting')).toHaveCount(3);
  });
});

test('timetable: unknown, partial and explicitly asynchronous sections remain visible', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await start(page);
  for (const code of ['TEST 108', 'TEST 109', 'TEST 110']) await select(page, code);
  await expectCount(page, 3);
  await open(page);
  await expect(modal(page).locator('.timetable-status')).toContainText(
    'Some schedules are unavailable; conflict checking is incomplete.',
  );
  await expect(modal(page).locator('.timetable-status')).not.toContainText(
    'No detected time conflicts',
  );
  await expect(modal(page).getByTestId('timetable-meeting')).toHaveCount(1);
  await expect(gridMeeting(page, 'TEST 109', 'Wed')).toBeVisible();
  await expect(
    modal(page).getByRole('heading', { name: 'Not placed on the timetable', exact: true }),
  ).toBeVisible();
  const panel = await selectedPanel(page, 3);
  const unknown = panel
    .locator('li')
    .filter({ has: page.getByRole('button', { name: /^TEST 108 · D100/ }) });
  await expect(unknown).toContainText('Schedule unavailable');
  await expect(unknown).not.toContainText('Asynchronous');
  const asynchronous = panel
    .locator('li')
    .filter({ has: page.getByRole('button', { name: /^TEST 110 · D100/ }) });
  await expect(asynchronous).toContainText('Asynchronous');
  await gridMeeting(page, 'TEST 109', 'Wed').click();
  await expect(
    modal(page).getByRole('region', { name: 'TEST 109 · D100', exact: true }),
  ).toContainText('1 meeting block(s) have unavailable times');
  await expect(modal(page)).toContainText('Partially published schedule');
  await modal(page).getByRole('button', { name: 'Close meeting details', exact: true }).click();
  const summary = modal(page).locator('summary').filter({ hasText: 'Text schedule' });
  await summary.click();
  const textSchedule = modal(page)
    .locator('details')
    .filter({ has: page.locator('summary').filter({ hasText: 'Text schedule' }) });
  await expect(textSchedule).toContainText('TEST 109');
  await expect(textSchedule).toContainText('2:00 PM');
  await expect(modal(page)).toContainText(
    'Planning preview only. Confirm schedules and enrol through SFU.',
  );
  await cleanAccessibility(page);
  await page.screenshot({ path: testInfo.outputPath('incomplete-timetable.png') });
});

test('timetable: clearing a term cancels a pending section selection', async ({ page }) => {
  let releaseDetail!: () => void;
  let detailRequested!: () => void;
  const pendingDetail = new Promise<void>((resolve) => {
    releaseDetail = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    detailRequested = resolve;
  });
  await installTimetableFixtures(page, async (path) => {
    if (path.endsWith('/ALT.json')) {
      detailRequested();
      await pendingDetail;
    }
  });
  await page.goto('./#/course-planner');
  await ready(page);
  await select(page, 'TEST 101');
  await page.getByRole('textbox', { name: 'Find a course', exact: true }).fill('ALT 201');
  await course(page, 'ALT 201').getByRole('button', { name: '+ Compare', exact: true }).click();
  await requested;
  try {
    await open(page);
    const panel = await selectedPanel(page, 1);
    await panel.getByRole('button', { name: 'Clear Spring 2027 selections', exact: true }).click();
    await panel.getByRole('button', { name: 'Confirm clear Spring 2027', exact: true }).click();
    await expect(
      modal(page).getByRole('heading', {
        name: 'No sections selected for Spring 2027',
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    releaseDetail();
  }
  // Wait for the actual delayed action to settle, then verify it cannot resurrect a choice.
  await expect(
    course(page, 'ALT 201').getByRole('button', {
      name: '+ Compare',
      exact: true,
      includeHidden: true,
    }),
  ).toBeEnabled();
  await expect(
    modal(page).getByRole('heading', { name: 'No sections selected for Spring 2027', exact: true }),
  ).toBeVisible();
  await expect(modal(page).getByTestId('timetable-meeting')).toHaveCount(0);
  await modal(page).getByRole('button', { name: 'Back to courses', exact: true }).click();
  await expectCount(page, 0);
});

test('timetable: a late course-detail response cannot open a nested dialog', async ({ page }) => {
  let releaseDetail!: () => void;
  let detailRequested!: () => void;
  const pendingDetail = new Promise<void>((resolve) => {
    releaseDetail = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    detailRequested = resolve;
  });
  await installTimetableFixtures(page, async (path) => {
    if (path.endsWith('/ALT.json')) {
      detailRequested();
      await pendingDetail;
    }
  });
  await page.goto('./#/course-planner');
  await ready(page);
  await select(page, 'TEST 101');
  await page.getByRole('textbox', { name: 'Find a course', exact: true }).fill('ALT 201');
  await course(page, 'ALT 201').getByRole('button', { name: 'Details →', exact: true }).click();
  await requested;
  try {
    await open(page);
  } finally {
    releaseDetail();
  }
  await expect(
    course(page, 'ALT 201').getByRole('button', {
      name: 'Details →',
      exact: true,
      includeHidden: true,
    }),
  ).toBeEnabled();
  await expect(modal(page)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await selectedPanel(page, 1);
  await close(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
