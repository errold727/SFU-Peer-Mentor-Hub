import { test, expect } from '@playwright/test';

test('desktop course density preserves grouping, source disclosure and compact actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./#/course-planner');
  await expect(page.locator('.course-card').first()).toBeVisible();
  const visible = await page.locator('.course-card').evaluateAll(
    (rows) =>
      rows.filter((row) => {
        const box = row.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= innerHeight;
      }).length,
  );
  expect(visible).toBeGreaterThanOrEqual(5);
  await page.screenshot({ path: 'test-results/density-all-subjects-desktop.png' });
  await page.getByText('Coverage & sources', { exact: true }).click();
  await expect(page.locator('.coverage-details')).toContainText('Complete CourSys offering index');
  await expect(page.locator('.coverage-details')).toContainText('SFU Course Outlines');
  await page.getByText('Coverage & sources', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('TEKX');
  await expect(page.getByRole('article', { name: 'TEKX 110 D100', exact: true })).toBeVisible();
  for (const title of ['3D Printing Technologies', 'Intro to Cyber Skills'])
    await expect(page.getByText(title, { exact: true })).toHaveCount(1);
  const row = page.getByRole('article', { name: 'TEKX 110 D100', exact: true });
  expect((await row.boundingBox())!.height).toBeLessThanOrEqual(100);
  await expect(row).toContainText('Tue');
  await expect(row).toContainText('Thu');
  await expect(row).toContainText('Burnaby');
  await expect(row).toContainText('Waitlist');
  await expect(row.getByRole('link', { name: 'CourSys', exact: false })).toBeVisible();
  await expect(row.getByRole('link', { name: 'Course Outline', exact: false })).toBeVisible();
  await row.getByRole('button', { name: '+ Compare', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Selected Courses (1)' })).toBeVisible();
  await row.getByRole('button', { name: 'Poster', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Poster Content (1) →' })).toBeVisible();
  await row.getByRole('button', { name: 'Details →', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('CourSys snapshot');
});

test('home exposes current resources and editor exposes canvas above the desktop fold', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  for (const name of ['Search Resources', 'Create Poster', 'Course Planner'])
    await expect(page.locator('.hero').getByRole('link', { name, exact: true })).toBeVisible();
  const resource = (await page.locator('.resource-card').first().boundingBox())!;
  expect(resource.y + resource.height).toBeLessThan(900);
  await page.locator('.hero').getByRole('link', { name: 'Create Poster', exact: true }).click();
  await page.getByRole('button', { name: 'Create Blank Poster', exact: true }).click();
  await page.getByRole('button', { name: 'Create Poster', exact: true }).click();
  await expect(page.locator('canvas').first()).toBeVisible();
  expect((await page.locator('canvas').first().boundingBox())!.y).toBeLessThan(450);
  await expect(page.getByRole('link', { name: 'Privacy', exact: true })).toBeVisible();
});

test('mobile compact course actions retain touch targets and readable details', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('./#/course-planner');
  await expect(page.locator('.course-card').first()).toBeVisible();
  await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('TEKX');
  const row = page.getByRole('article', { name: 'TEKX 110 D100', exact: true });
  await expect(row).toBeVisible();
  for (const button of await row.getByRole('button').all())
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await row.getByRole('button', { name: 'Details →', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Intro to Cyber Skills');
  await page.getByRole('button', { name: 'Close details' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
