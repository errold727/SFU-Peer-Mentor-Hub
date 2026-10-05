import { expect, test, type Page } from './fixtures/mentor';
import { mkdir, readFile } from 'node:fs/promises';

const fraser = 'Fraser Library — Surrey quiet and silent study';
const bennett = 'W.A.C. Bennett Library — Burnaby';
const computing = 'Activate your SFU Computing ID';
const writing = 'WriteAway';
const tuition = 'Tuition and fee payment dates — Fall 2026';
const librarySource = 'https://www.sfu.ca/surrey/campus-services/library.html';
const studySource = 'https://www.sfu.ca/surrey/students/campus-space/study-spaces-.html';
const reviewDirectory = 'docs/ui-review/resource-hub';

function resourceCard(page: Page, title: string) {
  return page.locator('.resource-card').filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  });
}

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function capture(page: Page, name: string) {
  if (process.env.RESOURCE_REVIEW_CAPTURE !== '1') return;
  await mkdir(reviewDirectory, { recursive: true });
  await page.screenshot({ path: `${reviewDirectory}/${name}.jpg`, quality: 65 });
}

async function search(page: Page, query: string) {
  await page.getByRole('textbox', { name: 'Search SFU resources' }).fill(query);
}

async function openHub(page: Page) {
  // Published term fixtures are intentionally exercised at their review date.
  await page.clock.setFixedTime(new Date('2026-10-05T19:00:00Z'));
  await page.goto('./#/resources');
  await expect(page.getByRole('heading', { name: 'SFU Resource Hub', exact: true })).toBeVisible();
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`resource hub: filters, source details and honest library gaps at ${viewport.width}px`, async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.setViewportSize(viewport);
    await openHub(page);
    await search(page, '安静自习');
    await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption('library');
    await page.getByRole('combobox', { name: 'Campus', exact: true }).selectOption('Surrey');
    await page
      .getByRole('combobox', { name: 'Audience', exact: true })
      .selectOption('Undergraduate');
    await page.getByRole('combobox', { name: 'Term', exact: true }).selectOption('Fall 2026');
    const quietCard = resourceCard(page, fraser);
    await expect(quietCard).toBeVisible();
    await expect(resourceCard(page, bennett)).toHaveCount(0);
    await expect(quietCard.getByRole('link', { name: 'Official Source' })).toHaveAttribute(
      'href',
      librarySource,
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await capture(page, `library-search-${viewport.width}`);
    await quietCard.getByRole('button', { name: 'View Details' }).click();
    const quietDetails = page.getByRole('dialog', { name: fraser });
    await expect(quietDetails).toContainText('Podium 3');
    await expect(quietDetails).toContainText('room 3650');
    await expect(quietDetails.getByRole('heading', { name: 'How to access' })).toBeVisible();
    await expect(quietDetails.locator(`a[href="${studySource}"]`)).toHaveCount(1);
    await expect(quietDetails.locator(`a[href="${librarySource}"]`).first()).toBeVisible();
    await page.getByRole('button', { name: 'Close details' }).click();

    await page.getByRole('combobox', { name: 'Campus', exact: true }).selectOption('Burnaby');
    await search(page, 'Bennett');
    await resourceCard(page, bennett).getByRole('button', { name: 'View Details' }).click();
    const incomplete = page.getByRole('dialog', { name: bennett });
    await expect(incomplete).toContainText('Some details remain unconfirmed');
    await expect(incomplete).toContainText('could not be verified');
    await expect(incomplete).toContainText('These are not general-access rooms');
    await expect(incomplete).toContainText('Source access blocked during review');
    await capture(page, `bennett-details-${viewport.width}`);
    await page.keyboard.press('Escape');
    await expect(incomplete).not.toBeVisible();

    await search(page, 'zzzx-no-such-resource-zzzx');
    await expect(page.getByRole('heading', { name: 'No matching resources' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(page.getByLabel('Search SFU resources')).toHaveValue('');
    for (const name of ['Category', 'Campus', 'Audience', 'Term'])
      await expect(page.getByRole('combobox', { name, exact: true })).toHaveValue('All');

    await search(page, 'WriteAway');
    await page
      .getByRole('combobox', { name: 'Audience', exact: true })
      .selectOption('Undergraduate');
    await expect(resourceCard(page, writing)).toBeVisible();
    await page.getByRole('combobox', { name: 'Audience', exact: true }).selectOption('Graduate');
    await expect(resourceCard(page, writing)).toHaveCount(0);

    await page
      .getByRole('combobox', { name: 'Audience', exact: true })
      .selectOption('Undergraduate');
    await search(page, 'Add, swap and tutorial changes');
    await page.getByRole('combobox', { name: 'Term', exact: true }).selectOption('Spring 2027');
    await expect(resourceCard(page, 'Add, swap and tutorial changes — Spring 2027')).toBeVisible();
    await expect(resourceCard(page, 'Add, swap and tutorial changes — Fall 2026')).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Term', exact: true }).selectOption('Fall 2026');
    await expect(resourceCard(page, 'Add, swap and tutorial changes — Fall 2026')).toBeVisible();
    await expect(resourceCard(page, 'Add, swap and tutorial changes — Spring 2027')).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('resource hub: basket creates an editable poster and real PNG/PDF downloads', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000);
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHub(page);
  for (const [query, title] of [
    ['Fraser', fraser],
    ['Computing ID', computing],
    ['WriteAway', writing],
    ['Tuition and fee payment', tuition],
  ]) {
    await search(page, query);
    await resourceCard(page, title)
      .getByRole('button', { name: 'Add to Poster', exact: true })
      .click();
    await expect(
      resourceCard(page, title).getByRole('button', { name: 'Added', exact: true }),
    ).toBeDisabled();
  }
  const basket = page.locator('.basket');
  await expect(basket.getByRole('heading')).toHaveText('Poster Content (4)');
  await basket.getByRole('button', { name: `Remove ${computing}`, exact: true }).click();
  await expect(basket.getByRole('heading')).toHaveText('Poster Content (3)');
  await basket.getByRole('link', { name: 'Create Poster' }).click();
  await page.getByRole('button', { name: 'Create Blank Poster', exact: true }).click();
  await page.getByRole('button', { name: 'Create Poster', exact: true }).click();
  await page.getByRole('button', { name: 'Resources', exact: true }).click();
  await page.getByRole('button', { name: 'Add selected resources (3)', exact: true }).click();
  // Importing twice must not duplicate the selected resources.
  await page.getByRole('button', { name: 'Add selected resources (3)', exact: true }).click();
  await page.getByRole('button', { name: 'Sections', exact: true }).click();
  await expect(page.locator('.section-select')).toHaveCount(3);
  const body = page.getByRole('textbox', { name: 'Editable text', exact: true });
  await page.locator('.section-select').filter({ hasText: 'WriteAway' }).click();
  await expect(body).toHaveValue(/For undergraduates at participating institutions/);
  await expect(body).toHaveValue(/Response times are a target, not guaranteed/);
  await page.locator('.section-select').filter({ hasText: 'Tuition and fee payment' }).click();
  await expect(body).toHaveValue(/Undergraduate dates/);
  await expect(body).toHaveValue(/Allow payment processing time/);
  await expect(body).toHaveValue(/2026-10-23/);
  await page.locator('.section-select').filter({ hasText: 'Quiet study at Surrey' }).click();
  await expect(body).toHaveValue(/room 3650/);
  await expect(body).toHaveValue(/Check current branch hours before visiting/);
  const wording = await body.inputValue();
  await body.fill(`${wording}\nMentor tip: plan a study break.`);
  await expect(body).toHaveValue(/Mentor tip: plan a study break/);
  await page.getByRole('button', { name: 'Resources', exact: true }).click();
  await page.getByRole('button', { name: 'Auto Arrange resource cards', exact: true }).click();
  const quality = page.locator('.poster-quality');
  if (!(await quality.evaluate((node) => (node as HTMLDetailsElement).open)))
    await quality.locator('summary').click();
  await expect(quality).not.toContainText('text overflows');
  await expect(quality).not.toContainText('outside the canvas');
  await expect(quality).not.toContainText('overlaps');
  await quality.locator('summary').click();
  await capture(page, 'resource-poster-desktop');
  for (const extension of ['png', 'pdf'] as const) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: extension.toUpperCase(), exact: true }).click();
    const download = await pending;
    const path = testInfo.outputPath(`resource-poster.${extension}`);
    await download.saveAs(path);
    const bytes = await readFile(path);
    if (extension === 'png') {
      expect(bytes.subarray(1, 4).toString()).toBe('PNG');
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([816, 1056]);
    } else {
      expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
      expect(bytes.toString('latin1')).toContain('/MediaBox [0 0 612. 792.]');
    }
  }
  expect(errors).toEqual([]);
});

test('resource hub: replace a template section while retaining editable wording and evidence', async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./#/poster/templates');
  await page
    .getByRole('button', { name: 'Use template: Library Guide — Editorial', exact: true })
    .click();
  await page.getByRole('button', { name: 'Sections', exact: true }).click();
  await page.getByRole('button', { name: '☰ Quiet Spaces', exact: true }).click();
  const before = await page.locator('.section-select').count();
  await page.getByRole('button', { name: 'Replace Content', exact: true }).click();
  await page.getByLabel('Find poster resources').fill('Fraser');
  await page.locator('.resource-picker button').filter({ hasText: fraser }).click();
  await expect(page.getByLabel('Section title', { exact: true })).toHaveValue(fraser);
  await expect(page.getByLabel('Body', { exact: true })).toHaveValue(/room 3650/);
  await expect(page.getByRole('status')).toContainText('Text does not fit');
  await page.getByRole('button', { name: 'Sections', exact: true }).click();
  await expect(page.locator('.section-select')).toHaveCount(before);
  await page.getByLabel('Section title', { exact: true }).fill('QUIET STUDY');
  await page
    .getByLabel('Body', { exact: true })
    .fill('Quiet carrels: Podium 3.\nSilent study: room 3650.\nCheck branch hours.');
  // Preserve the template layout and deliberately shorten the editable wording to fit.
  const quality = page.locator('.poster-quality');
  if (!(await quality.evaluate((node) => (node as HTMLDetailsElement).open)))
    await quality.locator('summary').click();
  await expect(quality).not.toContainText('text overflows');
  await expect(quality).not.toContainText('outside the canvas');
  await expect(page.getByRole('status')).toHaveText(
    'Section content replaced. Source metadata retained.',
  );
  await quality.locator('summary').click();
  await page.locator('.source-metadata summary').click();
  await expect(page.locator('.source-metadata a')).toHaveAttribute('href', librarySource);
  await expect(page.locator('.source-metadata')).toContainText(
    'Poster wording is editable and is not officially verified',
  );
  await expect(page.getByLabel('Body', { exact: true })).toHaveValue(/Check branch hours/);
  await capture(page, 'template-resource-replaced-desktop');
  expect(errors).toEqual([]);
});
