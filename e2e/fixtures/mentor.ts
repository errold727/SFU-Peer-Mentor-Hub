import { test as base } from '@playwright/test';

// Existing feature tests exercise the mentor workspace explicitly. Fresh-access
// and role-guard tests intentionally import raw Playwright instead of this fixture.
export const test = base.extend({
  page: async ({ page }, runFixture) => {
    await page.addInitScript(() => sessionStorage.setItem('pmh-role', 'mentor'));
    await runFixture(page);
  },
});
export { expect } from '@playwright/test';
export type { Page, Locator } from '@playwright/test';
