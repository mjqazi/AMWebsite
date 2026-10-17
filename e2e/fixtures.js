import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // No test may send a genuine enquiry. Individual tests override this route
    // with explicit success/error fixtures where needed.
    await page.route('https://formsubmit.co/**', route => route.abort('blockedbyclient'));
    await use(page);
  },
});
export { expect };

export async function fillEnquiry(page) {
  await page.locator('#name').fill('Local browser QA');
  await page.locator('#email').fill('qa@example.invalid');
  await page.locator('#message').fill('Intercepted QA enquiry. No real email is sent.');
}
