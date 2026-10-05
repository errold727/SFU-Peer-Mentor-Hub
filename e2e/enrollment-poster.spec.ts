import { test, expect } from './fixtures/mentor';
import type { CourseManifest, CourseOffering, OfferingDataset } from '../src/course/courseTypes';

test('enrollment poster rows distinguish identical sections across terms and retain editable presentation and sources', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const records: CourseOffering[] = [];
  for (const termCode of ['1271', '1267']) {
    const manifestResponse = await page.request.get(
      new URL(`data/courses/${termCode}/manifest.json`, baseURL).href,
    );
    expect(manifestResponse.ok()).toBe(true);
    const manifest: CourseManifest = await manifestResponse.json();
    const subject = manifest.subjects.find((entry) => entry.code === 'ENGL');
    expect(subject).toBeDefined();
    const response = await page.request.get(
      new URL(`data/courses/${termCode}/${subject!.file}`, baseURL).href,
    );
    expect(response.ok()).toBe(true);
    const dataset: OfferingDataset = await response.json();
    const course = dataset.courses.find(
      (entry) => entry.code === 'ENGL 211' && entry.section === 'D100',
    );
    expect(course).toBeDefined();
    records.push(course!);
  }

  await page.goto('./#/course-planner');
  for (const course of records) {
    await page.getByRole('combobox', { name: 'Term', exact: true }).selectOption(course.termCode!);
    await expect(
      page.getByRole('combobox', { name: 'Subject', exact: true }).locator('option[value="ENGL"]'),
    ).toHaveCount(1);
    await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('ENGL');
    await page.getByLabel('Find a course', { exact: true }).fill('ENGL 211');
    const card = page.getByRole('article', { name: 'ENGL 211 D100', exact: true });
    await expect(card.getByRole('link', { name: 'CourSys ↗', exact: true })).toHaveAttribute(
      'href',
      course.courSysUrl!,
    );
    await card.getByRole('button', { name: 'Add to Poster', exact: true }).click();
    await expect(card.getByRole('button', { name: 'In Poster', exact: true })).toBeDisabled();
  }
  await page.getByRole('link', { name: 'Poster Content (2) →', exact: true }).click();
  await page.getByRole('link', { name: 'Browse Templates', exact: true }).click();
  await page
    .getByRole('button', { name: 'Use template: Course Planning — Classic', exact: true })
    .click();
  await page.getByRole('button', { name: '☰ Course Offerings', exact: true }).click();
  const sectionCount = await page.locator('.section-select').count();
  const styles = {
    Background: '#fff0d8',
    'Accent colour': '#87501a',
    'Table header': '#164c63',
    'Table stripe': '#e3eff4',
    'Font size': '18',
    Padding: '12',
  };
  for (const [label, value] of Object.entries(styles))
    await page.getByLabel(label, { exact: true }).fill(value);
  const geometry: Record<string, string> = {};
  for (const label of ['Element x', 'Element y', 'Element width', 'Element height'])
    geometry[label] = await page.getByLabel(label, { exact: true }).inputValue();

  await page.getByRole('button', { name: 'Resources', exact: true }).click();
  await page.getByRole('button', { name: 'Insert enrollment snapshot', exact: true }).click();
  await expect(page.getByLabel('Section title', { exact: true })).toHaveValue(
    'ENROLLMENT SNAPSHOT',
  );
  await expect(page.locator('.table-properties fieldset')).toHaveCount(2);
  for (const [index, course] of records.entries()) {
    const row = index + 1;
    await expect(page.getByLabel(`Row ${row} Course / term`, { exact: true })).toHaveValue(
      `${course.code} · ${course.section} · ${course.term}`,
    );
    const { enrolled, capacity, waitlistCount, waitlistCapacity } = course.enrollment!;
    const waitlist =
      waitlistCapacity === undefined
        ? String(waitlistCount)
        : `${waitlistCount} / ${waitlistCapacity}`;
    await expect(page.getByLabel(`Row ${row} Enrollment`, { exact: true })).toHaveValue(
      `${enrolled} / ${capacity} enrolled · Waitlist: ${waitlist}`,
    );
    await expect(page.getByLabel(`Row ${row} Snapshot`, { exact: true })).toHaveValue(
      course.snapshotAt!,
    );
  }
  for (const [label, value] of Object.entries({ ...geometry, ...styles }))
    await expect(page.getByLabel(label, { exact: true })).toHaveValue(value);

  await page.getByLabel('Row 1 Enrollment', { exact: true }).fill('My editable presentation note');
  await page.getByLabel('Section title', { exact: true }).fill('RECORDED COURSE COMPARISON');
  await expect(page.getByLabel('Row 1 Enrollment', { exact: true })).toHaveValue(
    'My editable presentation note',
  );
  await page.getByText('Source metadata', { exact: true }).click();
  const sources = page.locator('.source-metadata');
  await expect(sources.locator('a')).toHaveCount(2);
  for (const [index, course] of records.entries()) {
    await expect(sources.locator('a').nth(index)).toHaveAttribute('href', course.courSysUrl!);
    await expect(sources.locator('a').nth(index)).toContainText(course.term);
    await expect(sources).toContainText(
      `Original resource reviewed ${course.snapshotAt!.slice(0, 10)}`,
    );
  }
  await expect(sources).toContainText('Poster wording is editable and is not officially verified.');
  await page.getByRole('button', { name: 'Sections', exact: true }).click();
  await expect(page.locator('.section-select')).toHaveCount(sectionCount);
  await expect(
    page.getByRole('button', { name: '☰ Enrollment Snapshot', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
