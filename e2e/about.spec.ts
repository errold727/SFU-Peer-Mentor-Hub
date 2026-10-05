import { expect, test, type Locator, type Page } from './fixtures/mentor';
import AxeBuilder from '@axe-core/playwright';
import { FEEDBACK_RESPONDER_URL } from '../src/config/feedback';

const headings = [
  'Supporting FASS Peer Mentorship',
  'Created by Errol Dai',
  'Data Sources & Credits',
  'Beta Feedback',
];
const disclosures = [
  'About local poster drafts',
  'Resource information providers',
  'Open-source tools & asset credits',
];

async function tabTo(page: Page, target: Locator) {
  // Exercise the actual tab sequence, including links inside expanded disclosures.
  for (let count = 0; count < 80; count++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((node) => node === document.activeElement)) return;
  }
  throw new Error(`Control is not keyboard reachable: ${await target.textContent()}`);
}

async function expectVisibleFocus(target: Locator) {
  await expect(target).toBeFocused();
  await expect(target).toBeVisible();
  expect(
    await target.evaluate((node) => {
      const style = getComputedStyle(node);
      return (
        node.matches(':focus-visible') &&
        ((style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) ||
          style.boxShadow !== 'none')
      );
    }),
    'Keyboard focus must have a visible indicator',
  ).toBe(true);
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`about: content, keyboard, privacy and accessibility at ${viewport.width}px`, async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize(viewport);
    const externalRequests: string[] = [];
    const errors: string[] = [];
    const firstParty = new URL(baseURL!).origin;
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (['http:', 'https:'].includes(url.protocol) && url.origin !== firstParty)
        externalRequests.push(url.href);
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('./#/about');
    await expect(page.getByRole('heading', { level: 1, name: 'About', exact: true })).toBeVisible();
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main h2')).toHaveText(headings);
    await expect(page.locator('main details')).toHaveCount(disclosures.length);
    await expect(page.locator('main details[open]')).toHaveCount(0);
    await expect(page.locator('main iframe')).toHaveCount(0);

    const navigation = page.getByRole('navigation', {
      name: 'Main navigation',
      includeHidden: true,
    });
    for (const [name, href] of [
      ['Home', '#/'],
      ['Resources', '#/resources'],
      ['Poster Maker', '#/poster'],
      ['Course Planner', '#/course-planner'],
      ['About', '#/about'],
    ])
      await expect(
        navigation.getByRole('link', { name, exact: true, includeHidden: true }),
      ).toHaveAttribute('href', href);
    await expect(
      navigation.getByRole('link', { name: 'About', exact: true, includeHidden: true }),
    ).toHaveAttribute('aria-current', 'page');

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content', exact: true });
    await expectVisibleFocus(skip);
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();

    for (const label of disclosures) {
      const summary = page.locator('main summary').filter({ hasText: label });
      await expect(summary).toHaveText(label);
      const details = page.locator('main details').filter({
        has: page.locator('summary').filter({ hasText: label }),
      });
      await tabTo(page, summary);
      await expectVisibleFocus(summary);
      await page.keyboard.press('Enter');
      await expect(details).toHaveAttribute('open', '');
      await expect(summary).toBeFocused();
      await page.keyboard.press('Space');
      await expect(details).not.toHaveAttribute('open', '');
      await expect(summary).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(details).toHaveAttribute('open', '');
    }
    await expect(page.locator('main details[open]')).toHaveCount(disclosures.length);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      'All open disclosures must fit the viewport',
    ).toBe(true);

    const feedback = page.getByRole('link', { name: 'Share Feedback ↗', exact: true });
    if (!FEEDBACK_RESPONDER_URL)
      throw new Error('This acceptance test expects configured feedback.');
    await expect(feedback).toHaveAttribute('href', FEEDBACK_RESPONDER_URL);
    for (const link of await page.locator('main a[href^="https://"]').all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      const rel = (await link.getAttribute('rel'))?.split(/\s+/) ?? [];
      expect(rel).toContain('noreferrer');
      expect(rel).toContain('noopener');
    }
    await tabTo(page, feedback);
    await expectVisibleFocus(feedback);
    // Merely reading About and opening disclosures must not contact form/credit providers.
    // Deliberately do not activate the feedback link or visit the external form.
    expect(externalRequests).toEqual([]);
    const analysis = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      analysis.violations.map((violation) => ({
        id: violation.id,
        targets: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([]);

    if (viewport.width < 600) {
      const toggle = page.getByRole('button', { name: 'Toggle navigation' });
      await tabTo(page, toggle);
      await expectVisibleFocus(toggle);
      await page.keyboard.press('Space');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    }
    const resources = navigation.getByRole('link', { name: 'Resources', exact: true });
    await tabTo(page, resources);
    await expectVisibleFocus(resources);
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'SFU Resource Hub', exact: true }),
    ).toBeVisible();
    // Reload checks the hash route and begins a fresh keyboard traversal without
    // skipping hundreds of Resource Hub controls by moving focus programmatically.
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'SFU Resource Hub', exact: true }),
    ).toBeVisible();
    if (viewport.width < 600) {
      const toggle = page.getByRole('button', { name: 'Toggle navigation' });
      await tabTo(page, toggle);
      await page.keyboard.press('Enter');
    }
    await tabTo(page, navigation.getByRole('link', { name: 'About', exact: true }));
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'About', exact: true })).toBeVisible();
    expect(externalRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}
