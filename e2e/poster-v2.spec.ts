import { test, expect } from '@playwright/test';
test('poster start, blank setup, sixteen real template previews and newsletter loading', async ({
  page,
}) => {
  await page.goto('./#/poster');
  await expect(page.getByRole('heading', { name: 'Poster Maker', exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create Blank Poster', exact: true }).click();
  await page.getByLabel('Size', { exact: true }).selectOption('square');
  await page.getByLabel('Style', { exact: true }).selectOption('dark');
  await page.getByRole('button', { name: 'Create Poster', exact: true }).click();
  await expect(page.getByLabel('Canvas size')).toHaveValue('square');
  await expect(page.locator('.layer-list button')).toHaveCount(0);
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('link', { name: 'Browse templates' }).click();
  await expect(page.getByRole('button', { name: /Use template:/ })).toHaveCount(16);
  await expect(page.locator('.real-template-preview img').first()).toBeVisible();
  await page
    .getByRole('button', { name: 'Use template: Weekly Check-In Newsletter', exact: true })
    .click();
  await expect(page.getByLabel('Poster template')).toHaveValue('newsletter');
  await expect(page.locator('.layer-list button')).toHaveCount(10);
});
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
async function chooseNewsletter(page: import('@playwright/test').Page) {
  await page.goto('./#/poster/templates');
  await page
    .getByRole('button', { name: 'Use template: Weekly Check-In Newsletter', exact: true })
    .click();
  await expect(page.locator('.canvas-paper canvas').first()).toBeVisible();
}
async function section(page: import('@playwright/test').Page, name: string) {
  await page.getByRole('button', { name: 'Sections', exact: true }).click();
  await page.locator('.section-select').filter({ hasText: name }).click();
}
test('newsletter creation, image replacement, sections, tables, resources, undo and real exports', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [],
    requests: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text());
  });
  page.on('request', (r) => requests.push(r.url() + ' ' + (r.postData() || '')));
  await chooseNewsletter(page);
  await page.screenshot({ path: 'test-results/newsletter-editor.png' });
  await section(page, 'Title Banner');
  await page.getByLabel('Editable text', { exact: true }).fill('THIRD-WEEK CHECK-IN');
  await section(page, 'Greeting');
  await page
    .getByLabel('Editable text', { exact: true })
    .fill('Hope your first few weeks at SFU are going well, {{recipientName}}!');
  await page.getByLabel('Recipient first name').fill('Student Name');
  await section(page, 'Announcement');
  await page.getByLabel('Section title', { exact: true }).fill('SEP 30 — NO CLASSES');
  await page
    .getByLabel('Body', { exact: true })
    .fill('Sample announcement for this workflow test. Verify dates before sharing.');
  await section(page, 'Get Involved');
  await page.getByLabel('Section title', { exact: true }).fill('GET INVOLVED — myInvolvement');
  await section(page, 'Planning Tips');
  await page.getByLabel('Section title', { exact: true }).fill('WHY PLAN AHEAD?');
  await section(page, 'Footer');
  await page.getByLabel('Editable text', { exact: true }).fill('Questions? Message me anytime.');
  const img = new PNG({ width: 800, height: 400 });
  for (let y = 0; y < 400; y++)
    for (let x = 0; x < 800; x++) {
      const i = (y * 800 + x) * 4;
      const color =
        y > 240 && x % 150 < 22 ? [240, 220, 176] : y > 210 ? [23, 45, 67] : [34, 112, 98];
      img.data[i] = color[0];
      img.data[i + 1] = color[1];
      img.data[i + 2] = color[2];
      img.data[i + 3] = 255;
    }
  const bytes = PNG.sync.write(img);
  await mkdir('.course-import', { recursive: true });
  await writeFile('.course-import/replacement-campus.png', bytes);
  await section(page, 'Hero Image');
  await page
    .getByLabel('Replace Image', { exact: true })
    .setInputFiles({ name: 'replacement-campus.png', mimeType: 'image/png', buffer: bytes });
  await expect(page.getByRole('status')).toContainText('Image replaced');
  await page.getByLabel('Fit mode').selectOption('contain');
  await page.getByLabel('Image zoom', { exact: true }).fill('1.25');
  await page.getByLabel('Horizontal position', { exact: true }).fill('0.5');
  await page.getByLabel('Fit mode').selectOption('cover');
  await page.getByLabel('Image zoom', { exact: true }).fill('1');
  await page.getByLabel('Horizontal position', { exact: true }).fill('0');
  await page.screenshot({ path: 'test-results/hero-image-replaced.png' });
  await page.getByRole('button', { name: 'Hide section Intro', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Show section Intro', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Show section Intro', exact: true }).click();
  await page.getByRole('button', { name: 'Delete section Intro', exact: true }).click();
  await expect(page.locator('.section-select').filter({ hasText: 'Intro' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('.section-select').filter({ hasText: 'Intro' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await page.getByLabel('New section type').selectOption('info');
  await page.getByRole('button', { name: '+ Add Section', exact: true }).click();
  await page.getByLabel('Section name').fill('Quick Note');
  await page.getByLabel('Section title', { exact: true }).fill('CHECK YOUR PLAN');
  await page.getByLabel('Body', { exact: true }).fill('Confirm your courses before enrolment.');
  await page.getByRole('button', { name: 'Duplicate section Quick Note', exact: true }).click();
  await expect(page.locator('.section-select').filter({ hasText: 'Quick Note' })).toHaveCount(2);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('.section-select').filter({ hasText: 'Quick Note' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Move section Quick Note up', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await section(page, 'Course Planning');
  await page.getByRole('button', { name: 'Add Row', exact: true }).click();
  await page.getByLabel('Row 4 Course', { exact: true }).fill('ENGL 204');
  await page.getByLabel('Row 4 Instructor', { exact: true }).fill('Ronda Arab');
  await page.getByRole('button', { name: 'Delete row 1', exact: true }).click();
  await page.getByLabel('Row 1 Course', { exact: true }).fill('ENGL 211');
  await page.getByLabel('Row 1 Instructor', { exact: true }).fill('Paul Budra');
  await expect(page.getByLabel('Row 3 Course', { exact: true })).toHaveValue('ENGL 204');
  await section(page, 'Get Involved');
  await page.getByRole('button', { name: 'Replace Content', exact: true }).click();
  await page.getByLabel('Find poster resources').fill('Bennett');
  await page.locator('.resource-picker button').filter({ hasText: 'Bennett' }).click();
  await expect(page.getByLabel('Section title', { exact: true })).toHaveValue(
    'W.A.C. Bennett Library — Burnaby',
  );
  await page
    .getByLabel('Body', { exact: true })
    .fill('Find study spaces and services. Check the official Library guide for current details.');
  await page.getByText('Source metadata', { exact: true }).click();
  await expect(page.locator('.source-metadata')).toContainText('Unverified');
  // Rebalance after deleting a section, adding one and replacing a resource.
  if (
    !(await page.locator('.poster-quality').evaluate((node) => (node as HTMLDetailsElement).open))
  )
    await page.locator('.poster-quality summary').click();
  await page.getByRole('button', { name: 'Auto Arrange', exact: true }).click();
  await expect(page.locator('.poster-quality')).not.toContainText('text overflows');
  await page.locator('.poster-quality summary').click();
  const pngWait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  const png = await pngWait;
  await png.saveAs('test-results/newsletter-export.png');
  const output = PNG.sync.read(await readFile((await png.path())!));
  expect([output.width, output.height]).toEqual([816, 1056]);
  const pixel = (90 * output.width + 90) * 4;
  expect([...output.data.subarray(pixel, pixel + 3)]).toEqual([34, 112, 98]);
  const pdfWait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  const pdf = await pdfWait;
  await pdf.saveAs('test-results/newsletter-export.pdf');
  const pdfBytes = await readFile((await pdf.path())!);
  expect(pdfBytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdfBytes.toString('latin1')).toContain('/MediaBox [0 0 612. 792.]');
  expect(pdfBytes.toString('latin1')).not.toContain('EmbeddedFile');
  for (const [quality, dimension] of [
    ['2', 1632],
    ['3.125', 2550],
  ] as const) {
    await page.getByLabel('Export quality').selectOption(quality);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PNG', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    expect(bytes.readUInt32BE(16)).toBe(dimension);
  }
  await page.getByLabel('Export quality').selectOption('1');
  await page.screenshot({ path: 'test-results/newsletter-customized.png' });
  expect(errors).toEqual([]);
  expect(
    requests
      .filter((r) => /^https?:/.test(r))
      .every((r) => r.startsWith(new URL(page.url()).origin)),
  ).toBe(true);
});
for (const [width, height] of [
  [1024, 768],
  [768, 1024],
  [390, 844],
])
  test(`newsletter responsive editing at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await chooseNewsletter(page);
    if (width <= 1000) {
      await page.getByRole('button', { name: 'Sections & tools', exact: true }).click();
    }
    await section(page, 'Title Banner');
    if (width <= 1000) await page.getByRole('button', { name: 'Properties', exact: true }).click();
    await page.getByLabel('Editable text', { exact: true }).fill('WEEKLY CHECK-IN');
    if (width <= 1000) await page.getByRole('button', { name: 'Properties', exact: true }).click();
    await expect(page.locator('canvas').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.getByRole('heading', { name: 'Poster Maker', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/newsletter-${width}.png` });
  });
import AxeBuilder from '@axe-core/playwright';
test('inline text, drag reorder, content modes, image undo and guide-free preview exports', async ({
  page,
}) => {
  await chooseNewsletter(page);
  const canvas = page.locator('canvas').first();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!,
    scale = box.width / 816;
  await canvas.dblclick({ position: { x: 200 * scale, y: 242 * scale } });
  await page.getByLabel('Edit text on canvas', { exact: true }).fill('DIRECT CANVAS EDIT');
  await page.getByLabel('Edit text on canvas', { exact: true }).press('Control+Enter');
  await section(page, 'Title Banner');
  await expect(page.getByLabel('Editable text', { exact: true })).toHaveValue('DIRECT CANVAS EDIT');
  const before = await page.locator('.section-select').allTextContents();
  await page
    .locator('.section-select')
    .filter({ hasText: 'Hero Image' })
    .dragTo(page.locator('.section-select').filter({ hasText: 'Title Banner' }));
  expect(await page.locator('.section-select').allTextContents()).not.toEqual(before);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await page.locator('.section-select').allTextContents()).toEqual(before);
  await section(page, 'Get Involved');
  await page.getByLabel('Content mode').selectOption('info');
  await page.getByLabel('Body', { exact: true }).fill('Check schedules\nConfirm prerequisites');
  await page.getByLabel('Content mode').selectOption('checklist');
  await expect(page.getByLabel('Item 1', { exact: true })).toHaveValue('Check schedules');
  await page.getByRole('button', { name: 'Add Item', exact: true }).click();
  await page.getByRole('button', { name: 'Remove item 3', exact: true }).click();
  await page.getByLabel('Content mode').selectOption('table');
  await expect(page.getByLabel('Row 1 Item', { exact: true })).toHaveValue('Check schedules');
  const violations = (
    await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  ).violations;
  expect(violations.map((v) => v.id)).toEqual([]);
  const exportBytes = async () => {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PNG', exact: true }).click();
    return readFile((await (await pending).path())!);
  };
  const plain = await exportBytes();
  await page.getByLabel('Guides', { exact: true }).check();
  expect((await exportBytes()).equals(plain)).toBe(true);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.inspector')).toBeHidden();
  expect((await exportBytes()).equals(plain)).toBe(true);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
});
test('course selections populate an editable poster table with official metadata', async ({
  page,
}) => {
  await page.goto('./#/course-planner');
  await page.getByLabel('Find a course').fill('ENGL 211');
  await page
    .getByRole('article', { name: 'ENGL 211 D100', exact: true })
    .getByRole('button', { name: 'Poster', exact: true })
    .click();
  await page.getByLabel('Find a course').fill('ENGL 234');
  await page
    .getByRole('article', { name: 'ENGL 234 D100', exact: true })
    .getByRole('button', { name: 'Poster', exact: true })
    .click();
  await page.getByRole('link', { name: /Poster Content/ }).click();
  await page.getByRole('button', { name: 'Create Blank Poster', exact: true }).click();
  await page.getByRole('button', { name: 'Create Poster', exact: true }).click();
  await expect(page.locator('.layer-list button')).toHaveCount(0);
  await page.getByRole('button', { name: 'Resources', exact: true }).click();
  await page.getByRole('button', { name: 'Insert course table', exact: true }).click();
  await expect(page.getByLabel('Row 1 Course', { exact: true })).toHaveValue('ENGL 211');
  await expect(page.getByLabel('Row 1 Instructor', { exact: true })).toHaveValue('Budra, Paul');
  await expect(page.getByLabel('Row 2 Course', { exact: true })).toHaveValue('ENGL 234');
  await page.getByText('Source metadata', { exact: true }).click();
  await expect(page.locator('.source-metadata a')).toHaveCount(2);
  await expect(page.locator('.source-metadata')).toContainText('Spring 2027');
});
