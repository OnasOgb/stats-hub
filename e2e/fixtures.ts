import { test as base, expect, Page } from '@playwright/test';

// Extend test fixture with custom helpers
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Helper to login and navigate to dashboard
    await page.goto('/auth/login');

    // Fill login form with test credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Log In")');

    // Wait for navigation to complete
    await page.waitForURL('**/hub');

    // Provide the authenticated page to the test
    await use(page);
  },
});

export { expect };

// Helper to seed test data (called before tests if needed)
export async function seedTestUser() {
  // This can be expanded to create test data in the database
  // For now, it's a placeholder for future implementation
  return {
    id: 'user-test-123',
    email: 'test@example.com',
    name: 'Test User',
  };
}

// Helper to cleanup after tests
export async function cleanupTestData() {
  // This can be expanded to clean up test data from database
  // For now, it's a placeholder for future implementation
}
