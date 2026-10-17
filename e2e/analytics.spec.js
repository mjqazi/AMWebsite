import { test, expect, fillEnquiry } from './fixtures.js';

test.beforeEach(async ({ page, request }) => {
  // Exercise the production origin against local source; no live leads or
  // analytics events leave the test browser.
  await page.route('https://advancedmechanix.com/**', async route => {
    const url = new URL(route.request().url());
    const response = await request.get('http://127.0.0.1:4456' + url.pathname + url.search);
    await route.fulfill({ response });
  });
  await page.route(/https:\/\/[^/]*google-analytics\.com\//, route => route.abort());
});

test('analytics stays blocked before permission and after declining across pages', async ({ page }) => {
  let loads = 0;
  await page.route('https://www.googletagmanager.com/**', route => { loads++; return route.fulfill({ body: '' }); });
  await page.goto('https://advancedmechanix.com/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('region', { name: 'Analytics preferences', exact: true })).toBeVisible();
  expect(loads).toBe(0);
  await page.getByRole('button', { name: 'Decline analytics', exact: true }).click();
  await page.goto('https://advancedmechanix.com/contact.html', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('region', { name: 'Analytics preferences', exact: true })).toBeHidden();
  expect(loads).toBe(0);
  expect(await page.evaluate(() => typeof window.gtag)).toBe('undefined');
});

test('permission enables one tag and tracks an acknowledged enquiry without form contents', async ({ page }) => {
  let loads = 0;
  await page.route('https://www.googletagmanager.com/**', route => { loads++; return route.fulfill({ body: '' }); });
  await page.route('https://formsubmit.co/**', route => route.fulfill({ contentType: 'application/json', body: '{"success":true}' }));
  await page.goto('https://advancedmechanix.com/contact.html?service=electrical&email=private@example.invalid#private', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  await expect.poll(() => loads).toBe(1);
  await fillEnquiry(page);
  await page.locator('#consultation-form button[type=submit]').click();
  await expect(page.locator('#form-success')).toBeVisible();
  const calls = await page.evaluate(() => window.dataLayer.map(args => Array.from(args)));
  const config = calls.find(args => args[0] === 'config');
  expect(config[2].page_location).toBe('https://advancedmechanix.com/contact.html');
  expect(config[2].allow_google_signals).toBe(false);
  expect(calls.find(args => args[0] === 'event' && args[1] === 'generate_lead')).toBeTruthy();
  expect(JSON.stringify(calls)).not.toMatch(/qa@example|private@example|Intercepted QA enquiry|Local browser QA/);
});

test('withdrawing permission clears analytics cookies and blocks the tag after reload', async ({ page, context }) => {
  let loads = 0;
  await page.route('https://www.googletagmanager.com/**', route => { loads++; return route.fulfill({ body: '' }); });
  await page.goto('https://advancedmechanix.com/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  await expect.poll(() => loads).toBe(1);
  await context.addCookies([{ name: '_ga', value: 'test-only', domain: '.advancedmechanix.com', path: '/' }]);
  await page.getByRole('button', { name: 'Analytics preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Decline analytics', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Analytics preferences', exact: true })).toBeHidden();
  expect((await context.cookies()).filter(cookie => cookie.name.startsWith('_ga'))).toHaveLength(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('am-analytics-choice-v1')).value)).toBe('denied');
  expect(loads).toBe(1);
});

test('an expired analytics choice does not silently re-enable measurement', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('am-analytics-choice-v1', JSON.stringify({ value: 'granted', time: 0 })));
  let loads = 0;
  await page.route('https://www.googletagmanager.com/**', route => { loads++; return route.fulfill({ body: '' }); });
  await page.goto('https://advancedmechanix.com/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('region', { name: 'Analytics preferences', exact: true })).toBeVisible();
  expect(loads).toBe(0);
});
