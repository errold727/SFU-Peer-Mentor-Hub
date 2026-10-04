import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
test('auto arrange preserves readable resources, quality tools fix overflow, and zoom works', async ({
  page,
}) => {
  await page.goto('./#/poster');
  for (const title of ['Campus Public Safety', 'Safe Walk', 'SFU Computing ID'])
    await page.locator('.resource-picker button').filter({ hasText: title }).click();
  await page.getByRole('button', { name: 'Auto Arrange resource cards', exact: true }).click();
  for (const title of ['Campus Public Safety', 'Safe Walk', 'SFU Computing ID']) {
    await page.locator('.layer-list button').filter({ hasText: title }).click();
    expect(
      Number(await page.getByLabel('Font size', { exact: true }).inputValue()),
    ).toBeGreaterThanOrEqual(16);
    await expect(page.getByLabel('Editable text')).not.toContainText('https://');
    await expect(page.getByRole('button',{name:'Add official source QR'})).toBeVisible();
  }
  await page.getByLabel('Element height', { exact: true }).fill('50');
  await page.locator('.poster-quality summary').click();
  await expect(page.locator('.poster-quality')).toContainText('text overflows');
  await page.getByRole('button', { name: 'Grow to fit text' }).click();
  expect(
    Number(await page.getByLabel('Element height', { exact: true }).inputValue()),
  ).toBeGreaterThan(50);
  await page.getByRole('combobox', { name: 'Preview zoom' }).selectOption('2');
  await expect(page.locator('canvas').first()).toBeVisible();
});
test('drafts only persist by explicit action and names never enter network requests', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url() + ' ' + (r.postData() ?? '')));
  await page.goto('./#/poster');
  await page.getByLabel('Recipient first name').fill('PrivateRecipientExample');
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.locator('.local-drafts summary').click();
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    'PrivateRecipientExample',
  );
  await page.getByLabel('Include recipient name in this personalized local draft').check();
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toContain(
    'PrivateRecipientExample',
  );
  await page.reload();
  await expect(page.getByLabel('Recipient first name')).toHaveValue('');
  await page.locator('.local-drafts summary').click();
  await page.getByRole('button', { name: 'Open draft 2', exact: true }).click();
  await page.getByRole('button', { name: 'Open saved draft', exact: true }).click();
  await expect(page.getByLabel('Recipient first name')).toHaveValue('PrivateRecipientExample');
  await page.getByRole('button', { name: 'Duplicate draft 2', exact: true }).click();
  await expect(page.locator('.draft-list li')).toHaveCount(3);
  await page.getByRole('button', { name: 'Delete all local drafts' }).click();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(requests.some((r) => r.includes('PrivateRecipientExample'))).toBe(false);
  expect(requests.every((r) => r.startsWith(new URL(page.url()).origin))).toBe(true);
});

test('all eight templates render within bounds with readable text', async ({ page }) => {
  for (let i = 0; i < 8; i++) {
    await page.goto('./#/poster/templates');
    await page.getByRole('button', { name: 'Use template →', exact: true }).nth(i).click();
    await page.locator('.poster-quality summary').click();
    await expect(page.locator('.poster-quality')).not.toContainText('text overflows');
    await expect(page.locator('.poster-quality')).not.toContainText('extends outside');
    await expect(page.locator('.poster-quality')).not.toContainText('text is small');
    await page.locator('.canvas-paper').screenshot({ path: `test-results/template-${i + 1}.png` });
  }
});
test('print PNG has correct bounds and a decodable QR; PDF has no hidden editable document', async ({
  page,
}) => {
  await page.goto('./#/poster');
  await page.getByRole('button', { name: 'QR Code', exact: true }).click();
  await page.getByRole('button', { name: 'Add QR Code', exact: true }).click();
  await page.getByRole('combobox', { name: 'Export quality' }).selectOption('3.125');
  // Wait for the locally generated image to be rendered, without assuming network readiness.
  await page.waitForFunction(() => document.querySelectorAll('canvas').length > 0);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  const file = await download;
  const png = PNG.sync.read(await readFile((await file.path())!));
  expect([png.width, png.height]).toEqual([2550, 3300]);
  expect(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data).toBe(
    'https://www.sfu.ca/',
  );
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.getByRole('button', { name: 'Add body text', exact: true }).click();
  await page.getByLabel('Editable text').fill('HiddenPrivateExportSentinel');
  await page.getByRole('button', { name: 'Hide element', exact: true }).click();
  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  const pdf = await readFile((await (await wait).path())!);
  expect(pdf.toString('latin1')).not.toMatch(
    /HiddenPrivateExportSentinel|EmbeddedFile|recipientName/,
  );
  expect(pdf.toString('latin1')).toContain('/MediaBox [0 0 612. 792.]');
});
