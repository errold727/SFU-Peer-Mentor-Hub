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
  await card.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Added', exact: true })).toHaveAttribute(
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

// Measure the rendered time axis rather than assuming a fixed pixel density:
// desktop fits the available modal height, while mobile uses a scrollable grid.
async function axisScale(page: Page) {
  const ticks = modal(page).locator('.tt-time-axis span');
  // The first/last labels are inset for readability, so compare interior ticks.
  const first = await box(ticks.nth(1));
  const second = await box(ticks.nth(2));
  const [hour, minute] = (await ticks.first().innerText()).split(':').map(Number);
  return { start: hour * 60 + minute, pixelsPerMinute: (second.y - first.y) / 60 };
}

async function expectExactMeetingGeometry(page: Page, block: Locator, day: string) {
  const { start: axisStart, pixelsPerMinute } = await axisScale(page);
  const start = Number(await block.getAttribute('data-start'));
  const end = Number(await block.getAttribute('data-end'));
  const bounds = await box(block);
  const track = await box(
    modal(page).locator(`[data-testid="timetable-day-track"][data-day="${day}"]`),
  );
  expect(pixelsPerMinute).toBeGreaterThan(0);
  expect(bounds.height).toBeCloseTo((end - start) * pixelsPerMinute, 0);
  expect(bounds.y - track.y).toBeCloseTo((start - axisStart) * pixelsPerMinute, 0);
}

async function expectEqualLanes(page: Page, blocks: Locator[], day: string) {
  const track = await box(
    modal(page).locator(`[data-testid="timetable-day-track"][data-day="${day}"]`),
  );
  const lanes = (await Promise.all(blocks.map(box))).sort((a, b) => a.x - b.x);
  for (const bounds of lanes) {
    // Four pixels of gutters must not turn half/third-width slots into tiny chips.
    expect(Math.abs(bounds.width - track.width / blocks.length)).toBeLessThanOrEqual(6);
    expect(Math.abs(bounds.width - lanes[0].width)).toBeLessThanOrEqual(1);
  }
  for (let index = 1; index < lanes.length; index++)
    expect(lanes[index - 1].x + lanes[index - 1].width).toBeLessThanOrEqual(lanes[index].x + 1);
}

async function expectReadableCode(block: Locator) {
  const label = block.locator('.tt-meeting-code');
  expect(await label.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(
    1,
  );
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
    course(page, 'TEST 101').getByRole('button', { name: 'Added', exact: true }),
  ).toBeFocused();
  await expect(modal(page)).toHaveCount(0);
  await expectCount(page, 1);
  // Add is a toggle. Revisiting/reselecting a section never creates duplicates.
  await course(page, 'TEST 101').getByRole('button', { name: 'Added', exact: true }).click();
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
  await course(page, 'TEST 111').getByRole('button', { name: 'Add', exact: true }).click();
  await expectCount(page, 3);
  await select(page, 'TEST 101', 'D200');
  await select(page, 'TEST 101', 'T101');
  await select(page, 'TEST 112');
  await expectCount(page, 6);
  await course(page, 'TEST 112').getByRole('button', { name: 'Details →', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Added', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('dialog').getByRole('button', { name: 'Added', exact: true }).click();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Added', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
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
  await page.screenshot({ path: testInfo.outputPath('course-timetable-mobile.png') });
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
    course(page, 'TEST 101').getByRole('button', { name: 'Add', exact: true }),
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
  await panel.getByRole('button', { name: 'Clear selections', exact: true }).click();
  await panel.getByRole('button', { name: 'Cancel', exact: true }).click();
  panel = await selectedPanel(page, 2);
  await panel.getByRole('button', { name: 'Clear selections', exact: true }).click();
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
    course(page, 'TEST 101').getByRole('button', { name: 'Added', exact: true }),
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Term', exact: true }).selectOption('1271');
  await expect(
    course(page, 'TEST 101').getByRole('button', { name: 'Add', exact: true }),
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
    await expectReadableCode(block);
  }
  for (const block of blocks) await expectExactMeetingGeometry(page, block, 'Mon');
  await expectEqualLanes(page, blocks, 'Mon');
  for (const code of ['TEST 101', 'TEST 102', 'TEST 103']) {
    await gridMeeting(page, code, 'Mon').click();
    const detail = modal(page).getByRole('region', { name: `${code} · D100`, exact: true });
    await expect(detail).toBeVisible();
    await detail.getByRole('button', { name: 'Close meeting details', exact: true }).click();
  }
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
    'No detected conflicts among published meeting times.',
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
    await expectExactMeetingGeometry(page, saturday, 'Sat');
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
    await expectExactMeetingGeometry(page, short, 'Thu');
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
    'Some selected schedules are unavailable; conflict checking is incomplete.',
  );
  await expect(modal(page).locator('.timetable-status')).toContainText(
    'No detected conflicts among published meeting times.',
  );
  await expect(modal(page).locator('.timetable-status')).not.toContainText('No conflicts');
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
  await course(page, 'ALT 201').getByRole('button', { name: 'Add', exact: true }).click();
  await requested;
  try {
    await open(page);
    const panel = await selectedPanel(page, 1);
    await panel.getByRole('button', { name: 'Clear selections', exact: true }).click();
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
      name: 'Add',
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

test('timetable: five selections fit a full desktop week and the selected panel scrolls independently', async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const observed = audit(page, baseURL!);
  await start(page);
  for (const code of ['TEST 101', 'TEST 104', 'TEST 105', 'ALT 201', 'ALT 202'])
    await select(page, code);
  await expectCount(page, 5);
  await expect(page.getByRole('button', { name: /Compare/ })).toHaveCount(0);
  await expect(
    course(page, 'ALT 202').getByRole('button', { name: 'Add to Poster', exact: true }),
  ).toBeVisible();
  await open(page);
  await selectedPanel(page, 5);
  await expect(modal(page).getByTestId('timetable-meeting')).toHaveCount(7);
  const calendar = modal(page).locator('.tt-scroll');
  const assertFit = async () => {
    await expect
      .poll(() => calendar.evaluate((node) => node.scrollHeight - node.clientHeight))
      .toBeLessThanOrEqual(1);
    expect(
      await calendar.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeLessThanOrEqual(1);
    const bounds = await box(calendar);
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
      const heading = await box(
        modal(page)
          .locator('.tt-day-header')
          .filter({ hasText: new RegExp(`^${day}$`) }),
      );
      expect(heading.x).toBeGreaterThanOrEqual(bounds.x);
      expect(heading.x + heading.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
    }
    for (const time of ['08:00', '20:00']) {
      const tick = await box(
        modal(page)
          .locator('.tt-time-axis span')
          .filter({ hasText: new RegExp(`^${time}$`) }),
      );
      expect(tick.y).toBeGreaterThanOrEqual(bounds.y);
      expect(tick.y + tick.height).toBeLessThanOrEqual(bounds.y + bounds.height + 1);
    }
    expect(bounds.y + bounds.height).toBeLessThan(900);
    expect(
      await modal(page).evaluate((node) => node.scrollHeight - node.clientHeight),
    ).toBeLessThanOrEqual(1);
  };
  await assertFit();
  await expectExactMeetingGeometry(page, gridMeeting(page, 'TEST 101', 'Mon'), 'Mon');
  await expectExactMeetingGeometry(page, gridMeeting(page, 'ALT 202', 'Thu'), 'Thu');
  await expect(modal(page).locator('.timetable-footer')).toHaveText(
    'Planning preview only. Confirm schedules and enrol through SFU.',
  );
  await page.screenshot({ path: testInfo.outputPath('course-timetable-desktop.png') });
  await close(page);
  for (const code of ['TEST 111', 'TEST 112', 'TEST 113', 'TEST 114', 'TEST 115', 'TEST 116'])
    await select(page, code);
  await open(page);
  await selectedPanel(page, 11);
  await assertFit();
  const side = modal(page).getByRole('complementary', {
    name: 'Selected sections and meeting details',
  });
  expect(await side.evaluate((node) => node.scrollHeight - node.clientHeight)).toBeGreaterThan(100);
  const before = await box(gridMeeting(page, 'TEST 101', 'Mon'));
  const beforeScroll = await calendar.evaluate((node) => ({
    top: node.scrollTop,
    left: node.scrollLeft,
  }));
  await side.hover();
  await page.mouse.wheel(0, 450);
  await expect.poll(() => side.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  expect(
    await calendar.evaluate((node) => ({ top: node.scrollTop, left: node.scrollLeft })),
  ).toEqual(beforeScroll);
  const after = await box(gridMeeting(page, 'TEST 101', 'Mon'));
  expect(after.y).toBeCloseTo(before.y, 0);
  expect(after.height).toBeCloseTo(before.height, 0);
  await assertFit();
  expect(observed.errors).toEqual([]);
  expect(observed.external).toEqual([]);
});

test('timetable: both conflict members keep their course colors in separate half-width lanes', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await start(page);
  await select(page, 'TEST 101');
  await open(page);
  const color = await gridMeeting(page, 'TEST 101', 'Mon').evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );
  await close(page);
  await select(page, 'TEST 102');
  await open(page);
  await expect(modal(page).locator('.timetable-status')).toContainText(
    '1 conflicting section pair',
  );
  const blocks = ['TEST 101', 'TEST 102'].map((code) => gridMeeting(page, code, 'Mon'));
  const panel = await selectedPanel(page, 2);
  for (const [index, block] of blocks.entries()) {
    await expect(block).toHaveAttribute('data-lane-count', '2');
    await expect(block).toHaveAttribute('data-conflict', 'true');
    await expect(block.locator('.tt-conflict-mark')).toContainText('Conflict');
    await expect(block.locator('.tt-conflict-mark')).toBeVisible();
    await expectReadableCode(block);
    const emphasis = await block.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        border: style.borderColor,
        shadow: style.boxShadow,
        outline: style.outlineColor,
        outlineWidth: style.outlineWidth,
      };
    });
    expect(Object.values(emphasis).join(' ')).toMatch(
      /rgb\((?:1[2-9]\d|2[0-5]\d),\s*(?:[0-9]|[1-8]\d),\s*(?:[0-9]|[1-8]\d)\)/,
    );
    expect(Number.parseFloat(emphasis.outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(
      panel.locator('li[data-conflict="true"]').filter({ hasText: `TEST ${101 + index}` }),
    ).toContainText('Conflict');
    await expectExactMeetingGeometry(page, block, 'Mon');
    await block.click();
    const detail = modal(page).getByRole('region', {
      name: `TEST ${101 + index} · D100`,
      exact: true,
    });
    await expect(detail).toBeVisible();
    await detail.getByRole('button', { name: 'Close meeting details', exact: true }).click();
  }
  await expectEqualLanes(page, blocks, 'Mon');
  expect(await blocks[0].evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(color);
  expect(
    await gridMeeting(page, 'TEST 101', 'Wed').evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    ),
  ).toBe(color);
  const textSchedule = modal(page)
    .locator('summary')
    .filter({ hasText: /^Text schedule$/ });
  const conflictDetails = modal(page)
    .locator('summary')
    .filter({ hasText: /^Conflict details/ });
  await panel
    .getByRole('button', { name: /from timetable$/ })
    .last()
    .focus();
  await page.keyboard.press('Tab');
  await expect(textSchedule).toBeFocused();
  await page.keyboard.press('Space');
  await expect(textSchedule.locator('..')).toHaveAttribute('open', '');
  await page.keyboard.press('Space');
  await expect(textSchedule.locator('..')).not.toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(conflictDetails).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(conflictDetails.locator('..')).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(conflictDetails.locator('..')).not.toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(
    modal(page).getByRole('button', { name: 'Close timetable', exact: true }),
  ).toBeFocused();
  await cleanAccessibility(page);
  await page.screenshot({ path: testInfo.outputPath('course-conflict.png') });
});

test('timetable: tablet student can reach weekday columns and inspect sections without mentor tools', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  const observed = audit(page, baseURL!);
  await start(page);
  await page.getByRole('button', { name: 'Toggle navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Switch role', exact: true }).click();
  await page.getByRole('button', { name: 'Mentee / Student', exact: true }).click();
  await ready(page);
  for (const code of ['TEST 101', 'ALT 202']) await select(page, code);
  await expect(page.getByRole('button', { name: /Poster/ })).toHaveCount(0);
  await open(page);
  const bounds = await box(modal(page));
  expect(bounds.width).toBeLessThanOrEqual(768);
  expect(bounds.height).toBeLessThanOrEqual(1024);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  await modal(page)
    .getByRole('combobox', { name: 'Jump to timetable day', exact: true })
    .selectOption('Thu');
  const block = gridMeeting(page, 'ALT 202', 'Thu');
  await block.scrollIntoViewIfNeeded();
  await expectExactMeetingGeometry(page, block, 'Thu');
  await block.click();
  await expect(
    modal(page).getByRole('region', { name: 'ALT 202 · D100', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await cleanAccessibility(page);
  await close(page);
  await expectCount(page, 2);
  expect(observed.errors).toEqual([]);
  expect(observed.external).toEqual([]);
});
