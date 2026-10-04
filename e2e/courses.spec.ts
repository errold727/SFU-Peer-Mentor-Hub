import { test, expect, type Page } from '@playwright/test';
async function ready(page: Page) {
  await expect(page.locator('.course-card').first()).toBeVisible();
  await expect(page.getByText('Loading course offerings…')).toHaveCount(0);
}
test('all-subject search, section details, conflict, cross-subject comparison and concise poster integration', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/course-planner');
  await ready(page);
  await expect(page.getByRole('combobox', { name: 'Subject', exact: true })).toHaveValue('All');
  await page.getByLabel('Find a course').fill('Budra');
  await expect(page.locator('.course-card').first()).toContainText(/Budra/);
  await page.getByLabel('Find a course').fill('ENGL 211');
  const first = page.getByRole('article', { name: 'ENGL 211 D100', exact: true });
  await first.getByRole('button', { name: 'Details →' }).click();
  await expect(page.getByRole('dialog')).toContainText('prerequisites');
  await expect(page.getByRole('dialog')).toContainText('snapshot');
  await page.getByRole('button', { name: 'Close details' }).click();
  await first.getByRole('button', { name: '+ Compare' }).click();
  await expect(page.getByRole('heading', { name: 'Selected Courses (1)' })).toBeVisible();
  await page.getByLabel('Find a course').fill('ENGL 234');
  await page
    .getByRole('article', { name: 'ENGL 234 D100', exact: true })
    .getByRole('button', { name: '+ Compare' })
    .click();
  await expect(page.getByText('Schedule Conflict', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('CMPT');
  await page.getByLabel('Find a course').fill('CMPT 354');
  await ready(page);
  await page.locator('.course-card').first().getByRole('button', { name: '+ Compare' }).click();
  await expect(page.getByRole('heading', { name: 'Selected Courses (3)' })).toBeVisible();
  await page.getByText('Weekly timetable · selected sections', { exact: true }).click();
  await expect(page.locator('.weekly-schedule')).toContainText('ENGL 211');
  await page.screenshot({ path: 'test-results/course-v2-comparison.png', fullPage: true });
  await page.getByRole('button', { name: 'Add Selected Courses to Poster' }).click();
  await page.getByRole('button', { name: 'Add Schedule Conflict to Poster' }).first().click();
  await page.getByRole('link', { name: /Poster Content/ }).click();
  await page.locator('.layer-list button').filter({ hasText: 'SPRING 2027 ENGL 211' }).click();
  await expect(page.getByLabel('Editable text')).toContainText('9:30 AM');
  await expect(page.getByLabel('Editable text')).not.toContainText('https://');
  await page.getByRole('button', { name: 'Add official source QR' }).click();
  await expect(page.getByLabel('Editable text')).toHaveValue(/https:\/\/www.sfu.ca\/outlines/);
  expect(errors).toEqual([]);
});
for (const term of ['1267', '1271'])
  test(`term ${term} loads CMPT ENGL ECON and links the exact CourSys semester`, async ({
    page,
  }) => {
    await page.goto('./#/course-planner');
    await ready(page);
    await page.getByRole('combobox', { name: 'Term', exact: true }).selectOption(term);
    await ready(page);
    for (const subject of ['CMPT', 'ENGL', 'ECON']) {
      await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption(subject);
      await ready(page);
      await expect(
        page.getByRole('link', { name: `View ${subject} in CourSys ↗` }),
      ).toHaveAttribute(
        'href',
        `https://coursys.sfu.ca/browse/#!semester=${term}&subject=${subject}`,
      );
      await expect(page.locator('.course-group').first()).toContainText(subject);
    }
    await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('All');
    await ready(page);
    await page.getByLabel('Find a course').fill('CMPT 354');
    await expect(page.locator('.course-card').first()).toBeVisible();
    await page.reload();
    await ready(page);
    await expect(page.getByRole('heading', { name: 'Selected Courses (0)' })).toBeVisible();
  });
test('campus filters, absent outlines, pagination and homepage loading stay honest', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'SFU Peer Mentor Hub' })).toBeVisible();
  expect(requests.some((r) => r.includes('/data/courses/'))).toBe(false);
  await page.goto('./#/course-planner');
  await ready(page);
  await expect(
    page.getByRole('combobox', { name: 'Subject', exact: true }).locator('option'),
  ).not.toHaveCount(9);
  const first = await page.locator('.course-group').first().getAttribute('aria-label');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.course-group').first()).not.toHaveAttribute('aria-label', first!);
  expect(await page.locator('.course-card').count()).toBeLessThan(250);
  for (const campus of ['Burnaby', 'Surrey', 'Vancouver']) {
    await page.getByRole('combobox', { name: 'Campus', exact: true }).selectOption(campus);
    await expect(page.locator('.course-card').first()).toBeVisible();
    for (const card of await page.locator('.course-card').all())
      await expect(card).toContainText(campus);
  }
  await page.getByRole('combobox', { name: 'Campus', exact: true }).selectOption('All');
  await page.getByLabel('Find a course').fill('EXCH');
  await expect(page.locator('.course-card').first()).toContainText('Schedule not yet published');
  await expect(page.locator('.course-card').first()).toContainText(
    'Course outline not yet available',
  );
});
