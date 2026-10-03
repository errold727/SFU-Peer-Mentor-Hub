import { test, expect } from '@playwright/test';
test('loads datasets, shows details and conflicts, compares terms, and creates poster content', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/course-planner');
  await expect(page.locator('.course-card').first()).toBeVisible();
  await page.getByLabel('Find a course').fill('ENGL 211');
  await page.getByLabel('Sections', { exact: true }).selectOption('Primary');
  await page.getByRole('button', { name: 'The Place of the Past', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Paul Budra');
  await expect(page.getByRole('dialog')).toContainText('prerequisites');
  await page.getByRole('button', { name: 'Close details' }).click();
  await page.getByRole('button', { name: 'Add to Comparison', exact: true }).first().click();
  await page.getByLabel('Find a course').fill('ENGL 234');
  await page.getByRole('button', { name: 'Add to Comparison', exact: true }).first().click();
  await expect(page.getByText('Schedule Conflict', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Term', exact: true }).selectOption('2026-fall');
  await page.getByRole('button', { name: 'Search Courses' }).click();
  await page.getByLabel('Find a course').fill('ENGL 211');
  await expect(page.locator('.course-card').first()).toContainText('JD Fleming');
  await page.getByRole('button', { name: 'Add to Comparison', exact: true }).first().click();
  await expect(page.locator('.comparison-table')).toContainText('JD Fleming');
  await expect(page.locator('.comparison-table')).toContainText('Paul Budra');
  await page.screenshot({ path: 'test-results/course-comparison.png', fullPage: true });
  await page.getByRole('button', { name: 'Add Comparison to Poster' }).click();
  await page.getByRole('link', { name: /Poster Content/ }).click();
  await expect(page.locator('.layer-list button').filter({ hasText: 'ENGL 211' })).toHaveCount(2);
  await expect(page.locator('canvas').first()).toBeVisible();
  expect(errors).toEqual([]);
});
test('department filter loads separate normalized JSON', async ({ page }) => {
  await page.goto('./#/course-planner');
  await page.getByRole('combobox', { name: 'Department', exact: true }).selectOption('ECON');
  await page.getByRole('button', { name: 'Search Courses' }).click();
  await page.getByLabel('Find a course').fill('ECON 103');
  await page.getByLabel('Sections', { exact: true }).selectOption('Primary');
  await expect(page.locator('.course-card').first()).toContainText('Principles of Microeconomics');
  await page.getByRole('combobox', { name: 'Department', exact: true }).selectOption('CMPT');
  await page.getByRole('button', { name: 'Search Courses' }).click();
  await page.getByLabel('Find a course').fill('CMPT 120');
  await expect(page.locator('.course-card').first()).toContainText(
    'Introduction to Computing Science',
  );
});
