import { expect, test, type Page } from './fixtures/mentor';
import { mkdir, readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

const speaking = 'Public Speaking for Your Courses and Beyond';
const bigPaper = 'Big Paper? Let’s Write it Right';
const surrey = 'SLC drop-in support — Indigenous Student Centre (Surrey)';
const burnaby = 'SLC drop-in support — Indigenous Student Centre (Burnaby)';
const reviewedNow = new Date('2026-10-05T15:00:00Z');
const reviewDirectory = 'docs/ui-review/role-timetable-slc';
const workshops = [
  'Present with Confidence: Communication Skills for Academic and Professional Success',
  'Schedule-Building Workshop',
  'Conversation Group: Life’s Little Debates',
  'Unlock your Readings: Strategies for Success',
  'Ace the Numbers Game: Quantitative Exams',
  'Conversation Group: Photo Walk — Exploring Campus Through Language',
  'Level Up Your Study Skills',
  'AI as a Rehearsal Space: Building Confidence Through Practice',
  'Conversational English for the Canadian Workplace',
  '“I’ll Do It Later”: Managing Procrastination',
  speaking,
  'Soup Circles',
  'Scientific Writing Made Simple',
  bigPaper,
  'The Writer You Are Becoming',
  'Go touch some paper: zine-making workshop',
  'Take Your Writing for a Walk: Exploring Extrospection',
  '“I Know My Stuff But I Froze”: Dealing with Exam Anxiety',
];

function card(page: Page, title: string) {
  return page.locator('.resource-card').filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  });
}
function trackPage(page: Page) {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (request) => requests.push(request.url()));
  return { errors, requests };
}
async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  for (const dialog of await page.locator('dialog[open]').all())
    expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
}
async function capture(page: Page, name: string) {
  if (process.env.SLC_REVIEW_CAPTURE !== '1') return;
  await mkdir(reviewDirectory, { recursive: true });
  await page.screenshot({ path: `${reviewDirectory}/${name}.png` });
}
async function openHub(page: Page, query = '') {
  await page.clock.setFixedTime(reviewedNow);
  await page.goto(`./#/resources${query}`);
  await expect(page.getByRole('heading', { name: 'SFU Resource Hub', exact: true })).toBeVisible();
}
async function search(page: Page, value: string) {
  await page.getByRole('textbox', { name: 'Search SFU resources', exact: true }).fill(value);
}

test('SLC: eighteen canonical workshops are searchable by English and Mandarin aliases', async ({
  page,
}) => {
  test.setTimeout(60000);
  const audit = trackPage(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHub(page, '?category=workshops-events');
  await expect(page.getByRole('combobox', { name: 'Category', exact: true })).toHaveValue(
    'workshops-events',
  );
  await expect(page.locator('.resource-card')).toHaveCount(18);
  expect(await page.locator('.resource-card h3').allTextContents()).toEqual(workshops);
  for (const [query, title] of [
    ['study skills', 'Level Up Your Study Skills'],
    ['public speaking', speaking],
    ['AI rehearsal', 'AI as a Rehearsal Space: Building Confidence Through Practice'],
    ['学习技巧', 'Level Up Your Study Skills'],
    ['拖延', '“I’ll Do It Later”: Managing Procrastination'],
    ['公开演讲', speaking],
    ['考试焦虑', '“I Know My Stuff But I Froze”: Dealing with Exam Anxiety'],
    ['英语口语', 'Conversational English for the Canadian Workplace'],
    ['学习计划', 'Schedule-Building Workshop'],
  ]) {
    await search(page, query);
    await expect(card(page, title)).toHaveCount(1);
  }
  await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption('All');
  await search(page, '写作辅导');
  await expect(card(page, 'WriteAway')).toHaveCount(1);
  await search(page, '');
  await page
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption('workshops-events');
  await expect(page.locator('.resource-card')).toHaveCount(18);
  await expectNoOverflow(page);
  expect(audit.errors).toEqual([]);
  await page.evaluate(() => scrollTo(0, 0));
  await capture(page, 'resources-slc');
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`SLC: compact next-week feed and filtered navigation at ${viewport.width}px`, async ({
    page,
  }) => {
    const audit = trackPage(page);
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(reviewedNow);
    await page.goto('./#/');
    const week = page.getByRole('region', { name: 'This week at SFU', exact: true });
    const items = week.locator('.this-week-list > li');
    await expect(items).toHaveCount(6);
    const dates = await items
      .locator('time')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime')!));
    expect(dates).toEqual([...dates].sort());
    expect(dates.every((date) => date >= '2026-10-05' && date <= '2026-10-12')).toBe(true);
    expect(await items.locator('a').allTextContents()).toEqual([
      'Conversational English for the Canadian Workplace',
      speaking,
      'Conversation Group: Life’s Little Debates',
      'SLC drop-in support — Global Student Centre',
      'Soup Circles',
      'Conversation Group: Photo Walk — Exploring Campus Through Language',
    ]);
    await expect(week).not.toContainText(surrey);
    await expect(week).not.toContainText('Time not confirmed');
    await expect(week.getByRole('button', { name: /Add to Poster|Copy|View Details/ })).toHaveCount(
      0,
    );
    await expectNoOverflow(page);
    expect(audit.errors).toEqual([]);
    await capture(
      page,
      viewport.width === 1440 ? 'this-week-slc' : `this-week-slc-${viewport.width}`,
    );
    await week.getByRole('link', { name: 'View all workshops →', exact: true }).click();
    await expect(page).toHaveURL(/#\/resources\?category=workshops-events$/);
    await expect(page.getByRole('combobox', { name: 'Category', exact: true })).toHaveValue(
      'workshops-events',
    );
    await expect(page.locator('.resource-card')).toHaveCount(18);
    await search(page, 'public speaking');
    const opener = card(page, speaking).getByRole('button', { name: 'View Details', exact: true });
    await opener.click();
    const detail = page.getByRole('dialog', { name: speaking, exact: true });
    await expect(detail).toContainText('2026-10-06');
    await expect(detail).toContainText('2026-10-26');
    await expect(detail).toContainText('Arts Central, AQ 3020, Burnaby & Zoom');
    await expect(detail).toContainText('Sci-Space, AQ 3146, Burnaby & Zoom');
    await expect(detail.getByRole('link', { name: /Register/ })).toHaveCount(0);
    await expect(detail).toContainText('Registration link unavailable');
    await expectNoOverflow(page);
    await detail.getByRole('button', { name: 'Close details' }).click();
    await expect(opener).toBeFocused();
    expect(audit.errors).toEqual([]);
    if (viewport.width !== 1440) {
      await page.evaluate(() => scrollTo(0, 0));
      await capture(page, `resources-slc-${viewport.width}`);
    }
  });
}

test('SLC: completed occurrences move to keyboard-accessible history without duplicating the program', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-07T15:00:00Z'));
  await page.goto('./#/resources?category=workshops-events');
  await search(page, 'public speaking');
  await expect(card(page, speaking)).toHaveCount(1);
  await card(page, speaking).getByRole('button', { name: 'View Details' }).click();
  const detail = page.getByRole('dialog', { name: speaking, exact: true });
  await expect(detail.locator('time[datetime="2026-10-26"]')).toBeVisible();
  await expect(detail.locator('time[datetime="2026-10-06"]')).toBeHidden();
  const history = detail.locator('.program-history');
  await expect(history).not.toHaveAttribute('open');
  await history.locator('summary').focus();
  await page.keyboard.press('Space');
  await expect(history).toHaveAttribute('open', '');
  await expect(history.locator('time[datetime="2026-10-06"]')).toBeVisible();
  await expect(history).toContainText('12:30 PM–1:30 PM');
  await page.keyboard.press('Escape');
  await expect(detail).toHaveCount(0);
  await page.goto('./#/');
  await expect(page.locator('.this-week-list')).not.toContainText(speaking);
});

test('SLC: uncertain source details and Indigenous-only access remain qualified', async ({
  page,
}) => {
  const audit = trackPage(page);
  await openHub(page, '?resource=slc-drop-in-indigenous-surrey');
  const detail = page.getByRole('dialog', { name: surrey, exact: true });
  await expect(detail).toContainText('For self-identified Indigenous students only.');
  await expect(detail).toContainText('SRYC 5300');
  await expect(detail.getByRole('heading', { name: 'Dates needing confirmation' })).toBeVisible();
  for (const date of ['2026-10-07', '2026-10-21', '2026-11-04', '2026-11-18', '2026-12-02']) {
    const occurrence = detail
      .locator('.program-occurrences li')
      .filter({ has: page.locator(`time[datetime="${date}"]`) });
    await expect(occurrence.locator('strong')).toHaveText(`${date} · Time not confirmed`);
    await expect(occurrence).toContainText('Both normalized times are withheld');
  }
  await detail.getByRole('button', { name: 'Close details' }).click();
  await page
    .getByRole('combobox', { name: 'Audience', exact: true })
    .selectOption('Indigenous students');
  await search(page, 'SLC drop-in');
  await expect(card(page, burnaby)).toHaveCount(1);
  await expect(card(page, surrey)).toHaveCount(1);
  await page.goto('./#/resources?resource=slc-big-paper');
  const paper = page.getByRole('dialog', { name: bigPaper, exact: true });
  await expect(paper).toContainText('Description withheld; ask SLC to confirm.');
  await expect(paper.locator('time[datetime="2026-10-22"]')).toBeVisible();
  await expect(paper).toContainText('11:30 AM–12:30 PM');
  await expect(paper).toContainText('Program Guide Fall 2026_FINAL1.pdf');
  await expect(paper).toContainText('Page 9');
  await expectNoOverflow(page);
  expect(audit.errors).toEqual([]);
});

test('SLC: legacy dated reminders remain in This Week alongside program occurrences', async ({
  page,
}) => {
  // A second fixed fixture date exercises a published legacy reminder, not the host clock.
  await page.clock.setFixedTime(new Date('2026-10-23T15:00:00Z'));
  await page.goto('./#/');
  const week = page.locator('.this-week-list');
  await expect(
    week.getByRole('link', { name: /Tuition and fee payment dates — Fall 2026/ }),
  ).toBeVisible();
  await expect(week).toContainText('Public Speaking for Your Courses and Beyond');
  const dates = await week
    .locator('time')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime')!));
  expect(dates.length).toBeLessThanOrEqual(6);
  expect(dates).toEqual([...dates].sort());
});

test('SLC: program content stays editable and verified destination QR exports locally to PNG and PDF', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  const audit = trackPage(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHub(page, '?category=workshops-events');
  await search(page, 'public speaking');
  await card(page, speaking).getByRole('button', { name: 'Add to Poster', exact: true }).click();
  await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption('All');
  await search(page, 'WriteAway');
  await card(page, 'WriteAway').getByRole('button', { name: 'Add to Poster', exact: true }).click();
  await page.locator('.basket').getByRole('link', { name: 'Create Poster' }).click();
  await page.getByRole('button', { name: 'Create Blank Poster', exact: true }).click();
  await page.getByRole('button', { name: 'Create Poster', exact: true }).click();
  await page.getByRole('button', { name: 'Resources', exact: true }).click();
  await page.getByRole('button', { name: 'Add selected resources (2)', exact: true }).click();
  await page.getByRole('button', { name: 'Auto Arrange resource cards', exact: true }).click();
  await page.getByRole('button', { name: 'Sections', exact: true }).click();
  await expect(page.locator('.section-select')).toHaveCount(2);
  // Section labels intentionally show only a short prefix of editable resource text.
  const speakingSection = page.locator('.section-select').filter({ hasText: 'Public Speaking' });
  await expect(speakingSection).toHaveCount(1);
  await speakingSection.click();
  const body = page.getByRole('textbox', { name: 'Editable text', exact: true });
  await expect(body).toHaveValue(/Next session: 2026-10-06/);
  await expect(body).toHaveValue(/12:30 PM–1:30 PM/);
  await expect(body).toHaveValue(/Arts Central, AQ 3020, Burnaby & Zoom/);
  expect((await body.inputValue()).length).toBeLessThan(850);
  await expect(page.getByRole('button', { name: 'Add program link QR', exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: 'Add official source QR', exact: true }),
  ).toHaveCount(0);
  const initial = await body.inputValue();
  await body.fill(`${initial}\nMentor tip: bring a question.`);
  await expect(body).toHaveValue(/Mentor tip: bring a question/);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await speakingSection.click();
  await expect(body).toHaveValue(initial);
  const writeAwaySection = page.locator('.section-select').filter({ hasText: 'WriteAway' });
  await expect(writeAwaySection).toHaveCount(1);
  await writeAwaySection.click();
  await expect(body).toHaveValue(/For undergraduates at participating institutions/);
  await page.getByRole('button', { name: 'Add program link QR', exact: true }).click();
  await expect(body).toHaveValue('https://writeaway.ca/');
  // QR remains independently editable: place it in the blank header area before
  // exporting, as prompted by the editor, so it cannot cover resource conditions.
  await page.getByRole('spinbutton', { name: 'Element y', exact: true }).fill('60');
  // The destination is generated into pixels locally; the browser never visits it.
  await page.getByRole('combobox', { name: 'Export quality', exact: true }).selectOption('2');
  const pngPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  const pngDownload = await pngPending;
  await pngDownload.saveAs(testInfo.outputPath('slc-program-poster.png'));
  const png = PNG.sync.read(await readFile((await pngDownload.path())!));
  expect([png.width, png.height]).toEqual([1632, 2112]);
  expect(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data).toBe(
    'https://writeaway.ca/',
  );
  const pdfPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  const pdfDownload = await pdfPending;
  await pdfDownload.saveAs(testInfo.outputPath('slc-program-poster.pdf'));
  const pdf = await readFile((await pdfDownload.path())!);
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.toString('latin1')).toContain('/MediaBox [0 0 612. 792.]');
  expect(pdf.toString('latin1')).not.toContain('EmbeddedFile');
  expect(audit.errors).toEqual([]);
  const origin = new URL(page.url()).origin;
  expect(
    audit.requests
      .filter((url) => /^https?:/.test(url))
      .every((url) => new URL(url).origin === origin),
  ).toBe(true);
});
