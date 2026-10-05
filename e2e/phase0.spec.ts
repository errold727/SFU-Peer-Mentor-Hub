import { test, expect } from './fixtures/mentor';
import { readFile } from 'node:fs/promises';
test('resource to editable poster, PNG/PDF export, and temporary recipient', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/resources');
  await page
    .getByRole('textbox', { name: 'Search SFU resources', exact: true })
    .fill('Campus Public Safety');
  await page.getByRole('button', { name: 'Add to Poster', exact: true }).first().click();
  await page.getByRole('link', { name: 'Create Poster' }).click();
  await page.getByRole('button', { name: 'Create Blank Poster', exact: true }).click();
  await page.getByRole('button', { name: 'Create Poster', exact: true }).click();
  await page.getByRole('button', { name: 'Resources', exact: true }).click();
  await page.getByRole('button', { name: /Add selected resources/ }).click();
  await expect(page.locator('canvas').first()).toBeVisible();
  await page.locator('.layer-list button').filter({ hasText: 'Campus Public Safety' }).click();
  await expect(page.getByLabel('Editable text')).toContainText('778-782-4500');
  await page.getByLabel('Element width').fill('650');
  await page.getByLabel('Element x').fill('55');
  await page.getByLabel('Recipient first name').fill('Callum');
  const pngWait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  const png = await pngWait;
  expect(png.suggestedFilename()).toContain('callum');
  const pngBytes = await readFile((await png.path())!);
  expect(pngBytes.subarray(1, 4).toString()).toBe('PNG');
  expect(pngBytes.readUInt32BE(16)).toBe(816);
  expect(pngBytes.readUInt32BE(20)).toBe(1056);
  const pdfWait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  const pdf = await pdfWait;
  const pdfBytes = await readFile((await pdf.path())!);
  expect(pdfBytes.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdfBytes.toString('latin1')).toContain('/MediaBox [0 0 612. 792.]');
  await page.screenshot({ path: 'test-results/poster-desktop.png', fullPage: true });
  await page.reload();
  await expect(page.getByLabel('Recipient first name')).toHaveValue('');
  expect(errors).toEqual([]);
});
test('home and mobile navigation', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'SFU Peer Mentor Hub' })).toBeVisible();
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('link', { name: 'Resources', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'SFU Resource Hub' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/resources-mobile.png', fullPage: true });
});
