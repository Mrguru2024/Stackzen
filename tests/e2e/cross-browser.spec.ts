import { test, expect } from '@playwright/test';

// Test configuration for different browsers
test.describe('Cross-browser testing', () => {
  // Test data
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
  };

  // Common test setup
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Authentication tests
  test('Login flow works across browsers', async ({ page }) => {
    // Click login button
    await page.click('button:has-text("Login")');

    // Fill login form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Verify successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  // Dashboard tests
  test('Dashboard loads correctly', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Login")');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Verify dashboard elements
    await expect(page.locator('text=Income Overview')).toBeVisible();
    await expect(page.locator('text=Expense Breakdown')).toBeVisible();
    await expect(page.locator('text=Recent Transactions')).toBeVisible();
  });

  // Quote generation tests
  test('Quote generation works', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Login")');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Navigate to quotes
    await page.click('text=Quotes');
    await page.click('button:has-text("New Quote")');

    // Fill quote form
    await page.fill('input[name="service"]', 'Consulting');
    await page.fill('input[name="area"]', '100');
    await page.fill('input[name="margin"]', '20');
    await page.click('button:has-text("Generate")');

    // Verify quote generation
    await expect(page.locator('text=Quote Generated')).toBeVisible();
    await expect(page.locator('text=Download PDF')).toBeVisible();
  });

  // Responsive design tests
  test('Responsive layout works', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toHaveClass(/mobile/);

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('nav')).toHaveClass(/tablet/);

    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('nav')).toHaveClass(/desktop/);
  });

  // Dark mode tests
  test('Dark mode toggle works', async ({ page }) => {
    // Toggle dark mode
    await page.click('button[aria-label="Toggle theme"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Toggle back to light mode
    await page.click('button[aria-label="Toggle theme"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
