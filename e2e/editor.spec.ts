import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
async function png(page: Page) {
  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  const file = await wait;
  return readFile((await file.path())!);
}
test('exports exclude handles and hidden content, while keyboard, lock, undo and redo work', async ({
  page,
}) => {
  await page.goto('./#/poster');
  await expect(page.locator('canvas').first()).toBeVisible();
  const original = await png(page);
  await page.locator('.layer-list button').filter({ hasText: 'IMPORTANT INFORMATION' }).click();
  const withSelection = await png(page);
  expect(withSelection.equals(original)).toBe(true);
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.getByRole('button', { name: 'Add body text', exact: true }).click();
  await page.getByLabel('Editable text').fill('Temporary private draft');
  await page.getByRole('button', { name: 'Hide element', exact: true }).click();
  const hidden = await png(page);
  expect(hidden.equals(original)).toBe(true);
  await page.getByRole('button', { name: 'Show element', exact: true }).click();
  await page.locator('.layer-list button').filter({ hasText: 'Temporary private draft' }).click();
  const x = Number(await page.getByLabel('Element x', { exact: true }).inputValue());
  await page.keyboard.press('Shift+ArrowRight');
  await expect(page.getByLabel('Element x', { exact: true })).toHaveValue(String(x + 10));
  await page.getByRole('button', { name: 'Lock element', exact: true }).click();
  await page.keyboard.press('Delete');
  await expect(
    page.locator('.layer-list button').filter({ hasText: 'Temporary private draft' }),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Unlock element', exact: true }).click();
  await page.getByRole('button', { name: 'Delete element', exact: true }).click();
  await expect(
    page.locator('.layer-list button').filter({ hasText: 'Temporary private draft' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(
    page.locator('.layer-list button').filter({ hasText: 'Temporary private draft' }),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(
    page.locator('.layer-list button').filter({ hasText: 'Temporary private draft' }),
  ).toHaveCount(0);
});
test('canvas supports pointer dragging and resizing; higher resolution and landscape exports work', async ({
  page,
}) => {
  await page.goto('./#/poster');
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.getByRole('button', { name: 'Add body text', exact: true }).click();
  const canvas = page.locator('canvas').first();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  const scale = box.width / 816;
  await page.mouse.move(box.x + 180 * scale, box.y + 290 * scale);
  await page.mouse.down();
  await page.mouse.move(box.x + 220 * scale, box.y + 320 * scale, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByLabel('Element x', { exact: true })).not.toHaveValue('60');
  const x = Number(await page.getByLabel('Element x', { exact: true }).inputValue()),
    y = Number(await page.getByLabel('Element y', { exact: true }).inputValue());
  await page.mouse.move(box.x + (x + 360) * scale, box.y + (y + 130) * scale);
  await page.mouse.down();
  await page.mouse.move(box.x + (x + 420) * scale, box.y + (y + 165) * scale, { steps: 5 });
  await page.mouse.up();
  expect(
    Number(await page.getByLabel('Element width', { exact: true }).inputValue()),
  ).toBeGreaterThan(360);
  await page.getByRole('combobox', { name: 'Canvas size' }).selectOption('screen');
  await page.getByRole('combobox', { name: 'Export quality' }).selectOption('2');
  const image = await png(page);
  expect(image.readUInt32BE(16)).toBe(3840);
  expect(image.readUInt32BE(20)).toBe(2160);
  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  const pdf = await wait;
  expect((await readFile((await pdf.path())!)).toString('latin1')).toContain(
    '/MediaBox [0 0 1440. 810.]',
  );
});
test('all templates load editable content and QR code exports render', async ({ page }) => {
  await page.goto('./#/poster/templates');
  await expect(page.getByRole('button', { name: 'Use template' })).toHaveCount(8);
  await page.getByRole('button', { name: 'Use template' }).first().click();
  await page.getByLabel('Recipient first name').fill('Avery');
  await page.locator('.layer-list button').filter({ hasText: '{{recipientName}}' }).click();
  await expect(page.getByLabel('Editable text')).toHaveValue('{{recipientName}}');
  await page.getByRole('button', { name: 'QR Code', exact: true }).click();
  await page.getByRole('button', { name: 'Add QR Code', exact: true }).click();
  await expect(
    page.locator('.layer-list button').filter({ hasText: 'https://www.sfu.ca/' }),
  ).toHaveCount(1);
  await expect(page.getByRole('status')).not.toContainText('failed');
  await png(page);
  await page.reload();
  await expect(page.getByLabel('Recipient first name')).toHaveValue('');
});
