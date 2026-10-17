import { test, expect, fillEnquiry } from './fixtures.js';

for (const pathname of ['/', '/contact.html?service=control-panel']) {
  test(`an acknowledged enquiry remains confirmed: ${pathname}`, async ({ page }) => {
    let submissions = 0;
    await page.route('https://formsubmit.co/**', route => {
      submissions++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":"true"}' });
    });
    await page.goto(pathname, { waitUntil: 'domcontentloaded' });
    await fillEnquiry(page);
    await page.locator('#consultation-form button[type=submit]').click();
    await expect(page.locator('#form-success')).toBeVisible();
    await expect(page.locator('#form-success')).toBeFocused();
    await expect(page.locator('#consultation-form')).toBeHidden();
    expect(submissions).toBe(1);
  });
}

test('invalid email and file URL do not send an enquiry', async ({ page }) => {
  let submissions = 0;
  await page.route('https://formsubmit.co/**', route => { submissions++; return route.abort(); });
  await page.goto('/contact.html', { waitUntil: 'domcontentloaded' });
  await fillEnquiry(page);
  await page.locator('#email').fill('invalid-email');
  await page.locator('#consultation-form button[type=submit]').click();
  await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#email')).toBeFocused();
  await page.locator('#email').fill('qa@example.invalid');
  await page.locator('#file_link').fill('not-a-url');
  await page.locator('#consultation-form button[type=submit]').click();
  await expect(page.locator('#file_link')).toHaveAttribute('aria-invalid', 'true');
  expect(submissions).toBe(0);
});

for (const [name, status, contentType, body] of [
  ['provider refusal', 200, 'application/json', '{"success":"false"}'],
  ['missing acknowledgement', 200, 'application/json', '{}'],
  ['server error', 500, 'application/json', '{"success":"true"}'],
  ['activation HTML', 200, 'text/html', '<p>Activation needed</p>'],
]) {
  test(`${name} preserves the enquiry and exposes contact alternatives`, async ({ page }) => {
    await page.route('https://formsubmit.co/**', route => route.fulfill({ status, contentType, body }));
    await page.goto('/contact.html', { waitUntil: 'domcontentloaded' });
    await fillEnquiry(page);
    await page.locator('#consultation-form button[type=submit]').click();
    await expect(page.locator('#form-error')).toBeVisible();
    await expect(page.locator('#form-error a[href="mailto:company@advancedmechanix.com"]')).toBeVisible();
    await expect(page.locator('#email')).toHaveValue('qa@example.invalid');
    await expect(page.locator('#consultation-form button[type=submit]')).toBeEnabled();
  });
}

test('cost comparison uses supplied figures and handles higher external budgets', async ({ page }) => {
  await page.goto('/cost-calculator.html', { waitUntil: 'domcontentloaded' });
  for (const [id, value] of Object.entries({ 'internal-hours': 100, 'internal-rate': 100,
    'external-hours': 120, 'external-rate': 60, 'external-extra': 1000 })) {
    await page.locator(`#${id}`).fill(String(value));
  }
  await page.locator('#cost-comparison button[type=submit]').click();
  await expect(page.locator('#internal-total')).toHaveText('$10,000.00');
  await expect(page.locator('#external-total')).toHaveText('$8,200.00');
  await expect(page.locator('#comparison-difference')).toHaveText('$1,800.00');
  await page.locator('#external-rate').fill('100');
  await expect(page.locator('#comparison-results')).toBeHidden();
  await page.locator('#cost-comparison button[type=submit]').click();
  await expect(page.locator('#comparison-label')).toHaveText('External budget is higher by');
  await expect(page.locator('#comparison-difference')).toHaveText('$3,000.00');
  await page.locator('#internal-hours').fill('-1');
  await page.locator('#cost-comparison button[type=submit]').click();
  await expect(page.locator('#comparison-error')).toBeVisible();
});

for (const [pagePath, file] of [
  ['/bim-execution-plan-template.html', 'bim-project-brief.txt'],
  ['/offshore-drafting-vendor-checklist.html', 'industrial-design-vendor-checklist.txt'],
]) {
  test(`the resource is a real ungated download: ${file}`, async ({ page, request }) => {
    await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#consultation-form')).toHaveCount(0);
    await expect(page.locator(`a[download][href="/downloads/${file}"]`)).toBeVisible();
    const response = await request.get(`/downloads/${file}`);
    expect(response.ok()).toBeTruthy();
    expect(await response.text()).toContain('Project:');
  });
}

test('mobile navigation and sticky contact respect the enquiry form', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toBeFocused();
  await page.locator('#consultation-form').scrollIntoViewIfNeeded();
  await expect(page.locator('.mobile-cta-bar')).toHaveClass(/is-hidden/);
});
