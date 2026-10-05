import { test, expect, type Page } from './fixtures/mentor';
import { mkdir, readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';

const designs = [
  ['newsletter', 'Weekly Check-In Newsletter'],
  ['welcome', 'Welcome to SFU Orientation'],
  ['courses', 'Course Planning — Classic'],
  ['library', 'Library Guide — Editorial'],
  ['essentials', 'Student Essentials — Playful'],
  ['event', 'Workshop / Event — Dark'],
  ['welcome-campus', 'Welcome to SFU — Campus'],
  ['deadlines', 'Important Deadlines — Timeline'],
  ['library-campus', 'SFU Library — Campus'],
  ['wellbeing', 'Student Wellbeing'],
  ['recreation', 'Get Active — Recreation'],
  ['courses-campus', 'Course Planning — Campus'],
  ['safety', 'Campus Safety'],
  ['academic', 'Academic Success'],
  ['international', 'International Students'],
] as const;
const deepIds = new Set(['newsletter', 'welcome', 'courses', 'event', 'international']);
const out = 'test-results/template-import';

function replacementImage() {
  const png = new PNG({ width: 400, height: 240 });
  for (let y = 0; y < png.height; y++)
    for (let x = 0; x < png.width; x++) {
      const offset = (y * png.width + x) * 4;
      const rgb = y > 170 ? [20, 44, 66] : [41, 120, 104];
      png.data[offset] = rgb[0];
      png.data[offset + 1] = rgb[1];
      png.data[offset + 2] = rgb[2];
      png.data[offset + 3] = 255;
    }
  return PNG.sync.write(png);
}
async function openDesign(page: Page, id: string, name: string) {
  await page.goto('./#/poster/templates');
  await expect(page.getByRole('button', { name: /Use template:/ })).toHaveCount(16);
  await expect(page.locator('canvas')).toHaveCount(0);
  const card = page
    .locator('.template-card')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('img')).toBeVisible();
  await expect
    .poll(() =>
      card
        .locator('img')
        .evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0),
    )
    .toBe(true);
  await page.getByRole('button', { name: `Use template: ${name}`, exact: true }).click();
  await expect(page.getByLabel('Poster template')).toHaveValue(id);
  await expect(page.locator('.canvas-paper canvas').first()).toBeVisible();
  await page.getByRole('button', { name: 'Sections', exact: true }).click();
}
async function selectSection(page: Page, label: string) {
  await page.getByRole('button', { name: `☰ ${label}`, exact: true }).click();
  await expect(page.getByLabel('Section name', { exact: true })).toHaveValue(label);
}
async function sectionLabels(page: Page) {
  return (await page.locator('.section-select').allTextContents()).map((value) =>
    value.replace(/^☰\s*/, '').trim(),
  );
}
async function replaceImage(page: Page) {
  await page.getByLabel('Replace Image', { exact: true }).setInputFiles({
    name: 'local-test-image.png',
    mimeType: 'image/png',
    buffer: replacementImage(),
  });
  await expect(page.getByRole('status')).toContainText('Image replaced');
  await page.getByLabel('Fit mode').selectOption('contain');
  await page.getByLabel('Image zoom', { exact: true }).fill('1.25');
  await page.getByLabel('Horizontal position', { exact: true }).fill('0.5');
  await page.getByLabel('Vertical position', { exact: true }).fill('-0.5');
  await page.getByLabel('Fit mode').selectOption('cover');
  await page.getByLabel('Image zoom', { exact: true }).fill('1');
  await page.getByLabel('Horizontal position', { exact: true }).fill('0');
  await page.getByLabel('Vertical position', { exact: true }).fill('0');
  await page.getByLabel('Overlay opacity', { exact: true }).fill('0');
}
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

for (const [id, name] of designs) {
  test(`template pack: ${name} loads, edits, hides and exposes real section controls`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    const errors = collectErrors(page);
    await openDesign(page, id, name);
    const labels = await sectionLabels(page);
    expect(labels.length).toBeGreaterThanOrEqual(8);
    await page.locator('.poster-quality summary').click();
    await expect(page.locator('.poster-quality')).not.toContainText('text overflows');
    await expect(page.locator('.poster-quality')).not.toContainText('outside the canvas');
    await page.locator('.poster-quality summary').click();
    await selectSection(page, 'Title Banner');
    await page.getByLabel('Editable text', { exact: true }).fill('SAMPLE TITLE');
    await expect(page.getByLabel('Editable text', { exact: true })).toHaveValue('SAMPLE TITLE');
    await page.getByRole('button', { name: 'Hide section Title Banner', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Show section Title Banner', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Show section Title Banner', exact: true }).click();
    let imageDone = false,
      tableDone = false,
      checklistDone = false,
      listDone = false,
      qrDone = false;
    for (const label of labels) {
      await selectSection(page, label);
      if (!imageDone && (await page.getByLabel('Replace Image', { exact: true }).count())) {
        await replaceImage(page);
        imageDone = true;
      }
      if (!qrDone && (await page.getByLabel('QR destination URL', { exact: true }).count())) {
        await page
          .getByLabel('QR destination URL', { exact: true })
          .fill('https://www.sfu.ca/students.html');
        await expect(page.getByLabel('QR destination URL', { exact: true })).toHaveValue(
          'https://www.sfu.ca/students.html',
        );
        qrDone = true;
      }
      const mode = page.getByLabel('Content mode');
      if (!(await mode.count())) continue;
      const kind = await mode.inputValue();
      if (!tableDone && ['table', 'schedule'].includes(kind)) {
        const firstCell = page.locator('.table-properties fieldset input').first();
        await firstCell.fill('Edited cell');
        await expect(firstCell).toHaveValue('Edited cell');
        const rowCount = await page.locator('.table-properties fieldset').count();
        await page.getByRole('button', { name: 'Add Row', exact: true }).click();
        await expect(page.locator('.table-properties fieldset')).toHaveCount(rowCount + 1);
        await page.getByRole('button', { name: `Delete row ${rowCount + 1}`, exact: true }).click();
        await expect(page.locator('.table-properties fieldset')).toHaveCount(rowCount);
        tableDone = true;
      }
      if ((kind === 'checklist' && !checklistDone) || (kind === 'list' && !listDone)) {
        const items = page.locator('.list-properties input');
        const count = await items.count();
        await page.getByRole('button', { name: 'Add Item', exact: true }).click();
        await page.getByLabel(`Item ${count + 1}`, { exact: true }).fill('New checklist item');
        await expect(items).toHaveCount(count + 1);
        await page.getByRole('button', { name: `Remove item ${count + 1}`, exact: true }).click();
        await expect(items).toHaveCount(count);
        if (kind === 'checklist') checklistDone = true;
        else listDone = true;
      }
    }
    if (id !== 'deadlines') expect(imageDone, `${name} replaceable image`).toBe(true);
    if (['newsletter', 'courses', 'library', 'library-campus', 'recreation'].includes(id))
      expect(tableDone, `${name} editable table`).toBe(true);
    if (
      [
        'welcome',
        'courses',
        'essentials',
        'event',
        'wellbeing',
        'courses-campus',
        'academic',
        'international',
      ].includes(id)
    )
      expect(checklistDone, `${name} editable checklist`).toBe(true);
    await expect(page.locator('.section-select')).toHaveCount(labels.length);
    const box = await page.locator('.canvas-paper canvas').first().boundingBox();
    expect(box?.width).toBeGreaterThan(100);
    expect(box?.height).toBeGreaterThan(100);
    expect(errors).toEqual([]);
  });
}

for (const [id, name] of designs.filter(([id]) => deepIds.has(id))) {
  test(`template pack deep workflow: ${name} real edits, arrangement and PNG/PDF export`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    const errors = collectErrors(page);
    await mkdir(out, { recursive: true });
    await openDesign(page, id, name);
    const originalLabels = await sectionLabels(page);
    await selectSection(page, 'Hero Image');
    await replaceImage(page);
    await selectSection(page, 'Title Banner');
    await page.getByLabel('Editable text', { exact: true }).fill('MY EDITABLE POSTER');
    const edited: string[] = [];
    for (const label of originalLabels) {
      if (edited.length === 2) break;
      await selectSection(page, label);
      const title = page.getByLabel('Section title', { exact: true });
      if (await page.getByLabel('Content mode').count()) {
        await title.fill(`EDITED SECTION ${edited.length + 1}`);
        const body = page.getByLabel('Body', { exact: true });
        if (await body.count()) await body.fill('Custom content for this poster.');
        else if (await page.locator('.table-properties fieldset input').count())
          await page.locator('.table-properties fieldset input').first().fill('Edited sample');
        else if (await page.getByLabel('Item 1', { exact: true }).count())
          await page.getByLabel('Item 1', { exact: true }).fill('An editable sample item');
        edited.push(label);
      }
    }
    expect(edited).toHaveLength(2);
    const target = edited[0];
    await page.getByRole('button', { name: `Delete section ${target}`, exact: true }).click();
    await expect(page.locator('.section-select')).toHaveCount(originalLabels.length - 1);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.locator('.section-select')).toHaveCount(originalLabels.length);
    await page.getByRole('button', { name: `Duplicate section ${target}`, exact: true }).click();
    await expect(page.locator('.section-select')).toHaveCount(originalLabels.length + 1);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.getByRole('button', { name: `Move section ${target} up`, exact: true }).click();
    expect(await sectionLabels(page)).not.toEqual(originalLabels);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    expect(await sectionLabels(page)).toEqual(originalLabels);
    await page.locator('.poster-quality summary').click();
    await page.getByRole('button', { name: 'Auto Arrange', exact: true }).click();
    await expect(page.locator('.canvas-paper canvas').first()).toBeVisible();
    await expect(page.locator('.poster-quality')).not.toContainText('invalid position');
    // Auto Arrange is intentionally reversible; preserve each reference layout for export review.
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.locator('.poster-quality summary').click();
    await selectSection(page, 'Title Banner');
    await page.screenshot({ path: `${out}/${id}-editor.png` });
    const pngPending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PNG', exact: true }).click();
    const pngDownload = await pngPending;
    await pngDownload.saveAs(`${out}/${id}-export.png`);
    const png = PNG.sync.read(await readFile((await pngDownload.path())!));
    expect([png.width, png.height]).toEqual([816, 1056]);
    let replacementPixels = 0;
    for (let i = 0; i < png.data.length; i += 4)
      if (png.data[i] === 41 && png.data[i + 1] === 120 && png.data[i + 2] === 104)
        replacementPixels++;
    expect(replacementPixels).toBeGreaterThan(1000);
    const pdfPending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF', exact: true }).click();
    const pdfDownload = await pdfPending;
    await pdfDownload.saveAs(`${out}/${id}-export.pdf`);
    const pdf = await readFile((await pdfDownload.path())!);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.toString('latin1')).toContain('/MediaBox [0 0 612. 792.]');
    expect(pdf.toString('latin1')).not.toContain('/EmbeddedFile');
    expect(errors).toEqual([]);
  });
}
