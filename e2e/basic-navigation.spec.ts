import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on home page (adjust selector based on your actual content)
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Page title should contain expected text
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });
});
