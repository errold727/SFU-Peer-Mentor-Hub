import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const width of [375, 390, 768, 1024, 1440]) {
  test(`responsive and accessible routes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const [route, title] of [
      ['', 'SFU Peer Mentor Hub'],
      ['resources', 'SFU Resource Hub'],
      ['course-planner', 'SFU Course Planner'],
      ['poster', 'Poster Maker'],
      ['poster/edit', 'Poster Maker'],
      ['poster/templates', 'Template Gallery'],
      ['about', 'About this hub'],
    ]) {
      await page.goto(`./#/${route}`);
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      if (route === 'course-planner')
        await expect(page.locator('.course-card').first()).toBeVisible();
      if (route === 'poster/edit') await expect(page.locator('canvas').first()).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${route} horizontal overflow`,
      ).toBe(true);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          description: v.description,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
      if ([390, 768, 1024, 1440].includes(width))
        await page.screenshot({
          path: `test-results/ui-${route.replace('/', '-') || 'home'}-${width}.png`,
        });
    }
    expect(errors).toEqual([]);
  });
}
test('keyboard navigation, resource dialog focus and Escape, refresh and reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./#/resources');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.getByLabel('Search SFU resources', { exact: true }).fill('Campus Public Safety');
  const details = page.getByRole('button', { name: 'View Details', exact: true }).first();
  await details.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(details).toBeFocused();
  await page.goto('./#/about');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'About this hub' })).toBeVisible();
});
test('course errors explain recovery without exposing stack traces', async ({ page }) => {
  await page.route('**/data/courses/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"schemaVersion":1,"courses":[{"title":"Broken"}]}',
    }),
  );
  await page.goto('./#/course-planner');
  await expect(page.getByRole('alert')).toContainText('needs repair');
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await page.unroute('**/data/courses/**');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.course-card').first()).toBeVisible();
});
test('mobile comparison and detail drawer stay within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('./#/course-planner');
  await page.getByLabel('Find a course').fill('ENGL 211');
  await page.getByRole('combobox', { name: 'Sections', exact: true }).selectOption('Enrollment');
  await page.getByRole('button', { name: '+ Compare', exact: true }).first().click();
  await page.getByLabel('Find a course').fill('ENGL 234');
  await page.getByRole('button', { name: '+ Compare', exact: true }).first().click();
  await expect(page.getByText('Schedule Conflict', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Details →', exact: true }).first().click();
  const box = (await page.getByRole('dialog').boundingBox())!;
  expect(box.width).toBeLessThanOrEqual(375);
  expect(box.height).toBeLessThanOrEqual(812);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Clear comparison', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Selected Courses (0)' })).toBeVisible();
});
for (const failure of ['missing', 'offline'])
  test(`course ${failure} data has a recoverable state`, async ({ page }) => {
    await page.route('**/data/courses/**', (route) =>
      failure === 'missing'
        ? route.fulfill({ status: 404, body: '' })
        : route.abort('internetdisconnected'),
    );
    await page.goto('./#/course-planner');
    await expect(page.getByRole('alert')).toContainText(
      failure === 'missing' ? 'could not be loaded' : 'Connection unavailable',
    );
    await expect(page.getByRole('link', { name: 'Official SFU CourSys' })).toBeVisible();
  });
