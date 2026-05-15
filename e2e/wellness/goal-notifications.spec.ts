import { test, expect } from '@playwright/test';

test.describe('Goal Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('/api/wellness/score', async route => {
      await route.fulfill({
        status: 200,
        json: {
          currentScore: {
            id: '1',
            userId: 'user1',
            totalScore: 85,
            status: 'good',
            color: 'green',
            description: "You're doing great!",
            categoryScores: [
              { category: 'savings', score: 90 },
              { category: 'investments', score: 85 },
              { category: 'debt', score: 80 },
            ],
          },
          historicalScores: [
            { date: '2024-01-01', score: 75 },
            { date: '2024-02-01', score: 80 },
            { date: '2024-03-01', score: 85 },
          ],
        },
      });
    });

    await page.route('/api/wellness/goals', async route => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: '1',
            category: 'savings',
            name: 'Emergency Fund',
            target: 10000,
            current: 10000,
            deadline: new Date('2024-12-31').toISOString(),
            completed: false,
          },
          {
            id: '2',
            category: 'investments',
            name: 'Stock Portfolio',
            target: 50000,
            current: 25000,
            deadline: new Date('2024-06-30').toISOString(),
            completed: false,
          },
          {
            id: '3',
            category: 'debt',
            name: 'Credit Card Payoff',
            target: 8000,
            current: 4000,
            deadline: new Date('2024-09-30').toISOString(),
            completed: false,
          },
        ],
      });
    });

    // Navigate to wellness dashboard
    await page.goto('/wellness');
  });

  test('displays notifications for completed goals and milestones', async ({ page }) => {
    // Wait for notifications to load
    await page.waitForSelector('[data-testid="goal-notification"]');

    // Verify completed goal notification
    const _completedNotification = page.getByText('🎉 Goal Completed!');
    await expect(completedNotification).toBeVisible();
    await expect(page.getByText('Emergency Fund')).toBeVisible();
    await expect(page.getByText('Target: $10,000')).toBeVisible();

    // Verify milestone notification
    const _milestoneNotification = page.getByText('🎯 Milestone Achieved!');
    await expect(milestoneNotification).toBeVisible();
    await expect(page.getByText('Credit Card Payoff')).toBeVisible();
    await expect(page.getByText('50% Complete')).toBeVisible();
  });

  test('handles goal updates and reflects changes in notifications', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="goal-notification"]');

    // Mock goal update
    await page.route('/api/wellness/goals', async route => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: '1',
            category: 'savings',
            name: 'Emergency Fund',
            target: 10000,
            current: 12000,
            deadline: new Date('2024-12-31').toISOString(),
            completed: false,
          },
          // ... other goals
        ],
      });
    });

    // Trigger a goal update
    await page.click('[data-testid="refresh-goals"]');

    // Verify updated notification
    await expect(page.getByText('$12,000 / $10,000')).toBeVisible();
  });

  test('dismisses notifications when dismiss button is clicked', async ({ page }) => {
    // Wait for notifications to load
    await page.waitForSelector('[data-testid="goal-notification"]');

    // Get initial notification count
    const _initialCount = await page.locator('[data-testid="goal-notification"]').count();

    // Click dismiss button on first notification
    await page.click('[data-testid="dismiss-notification"]');

    // Verify notification is removed
    const _newCount = await page.locator('[data-testid="goal-notification"]').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('handles virtual scrolling for many notifications', async ({ page }) => {
    // Mock many goals
    const _manyGoals = Array.from({ length: 20 }, (_, i) => ({
      id: `goal-${i}`,
      category: 'savings',
      name: `Goal ${i}`,
      target: 10000,
      current: i % 2 === 0 ? 10000 : 5000,
      deadline: new Date('2024-12-31').toISOString(),
      completed: false,
    }));

    await page.route('/api/wellness/goals', async route => {
      await route.fulfill({
        status: 200,
        json: manyGoals,
      });
    });

    // Refresh goals
    await page.click('[data-testid="refresh-goals"]');

    // Wait for notifications to load
    await page.waitForSelector('[data-testid="goal-notification"]');

    // Verify virtual scrolling container
    const _container = page.locator('[data-testid="notifications-container"]');
    await expect(container).toHaveCSS('height', '400px');
    await expect(container).toHaveCSS('overflow', 'auto');

    // Scroll through notifications
    await container.evaluate(el => {
      el.scrollTop = 1000;
    });

    // Verify smooth scrolling
    await expect(page.locator('[data-testid="goal-notification"]').first()).toBeVisible();
  });

  test('displays appropriate animations for notifications', async ({ page }) => {
    // Wait for notifications to load
    await page.waitForSelector('[data-testid="goal-notification"]');

    // Verify entrance animation
    const _notification = page.locator('[data-testid="goal-notification"]').first();
    await expect(notification).toHaveCSS('opacity', '1');
    await expect(notification).toHaveCSS('transform', 'translateY(0px)');

    // Click dismiss and verify exit animation
    await page.click('[data-testid="dismiss-notification"]');
    await expect(notification).toHaveCSS('opacity', '0');
  });

  test('handles error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/wellness/goals', async route => {
      await route.fulfill({
        status: 500,
        json: { error: 'Internal Server Error' },
      });
    });

    // Refresh goals
    await page.click('[data-testid="refresh-goals"]');

    // Verify error message
    await expect(page.getByText('Error loading wellness data')).toBeVisible();
  });

  test('maintains accessibility during interactions', async ({ page }) => {
    // Wait for notifications to load
    await page.waitForSelector('[data-testid="goal-notification"]');

    // Verify ARIA labels
    await expect(page.getByLabelText('Dismiss Emergency Fund notification')).toBeVisible();

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.getByLabelText('Dismiss Emergency Fund notification')).toBeFocused();

    // Test keyboard interaction
    await page.keyboard.press('Enter');
    await expect(page.getByLabelText('Dismiss Emergency Fund notification')).not.toBeVisible();
  });

  test('handles dark mode correctly', async ({ page }) => {
    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"]');

    // Wait for notifications to load
    await page.waitForSelector('[data-testid="goal-notification"]');

    // Verify dark mode styles
    const _notification = page.locator('[data-testid="goal-notification"]').first();
    await expect(notification).toHaveClass(/dark:bg-green-900\/20/);
    await expect(notification).toHaveClass(/dark:text-green-300/);
  });

  test('handles responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for notifications to load
    await page.waitForSelector('[data-testid="goal-notification"]');

    // Verify mobile layout
    const _container = page.locator('[data-testid="notifications-container"]');
    await expect(container).toHaveCSS('width', '100%');
    await expect(container).toHaveCSS('padding', '1rem');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verify tablet layout
    await expect(container).toHaveCSS('max-width', '768px');
  });
});
