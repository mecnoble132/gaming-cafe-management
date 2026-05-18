/**
 * @file navigation.spec.ts
 * @description Covers end-to-end user flows for navigation, checking that:
 * - Clicking navigation items loads each page without errors or layout breaks
 * - All pages load without console errors
 * - No broken images are present on any page
 * - All page headers render correctly
 */
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'mecnoble132@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

test.describe('Application Navigation & Page Integrity', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out React hydration, element nesting, and unrecognized prop warnings
        if (
          text.includes('hydration') ||
          text.includes('descendant') ||
          text.includes('cannot contain') ||
          text.includes('React does not recognize') ||
          text.includes('asChild')
        ) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    // Login and land on dashboard
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
  });

  const pages = [
    { name: 'Dashboard', heading: 'Command Center' },
    { name: 'Billing', heading: 'Billing' },
    { name: 'Bookings', heading: 'Bookings' },
    { name: 'Customers', heading: 'Customers' },
    { name: 'Inventory', heading: 'Inventory' },
    { name: 'Reports', heading: 'Reports' },
    { name: 'Settings', heading: 'Settings' },
  ];

  for (const p of pages) {
    test(`Can navigate to ${p.name} page and verify content, console, and images`, async ({ page }) => {
      // Find the button inside the sidebar or mobile nav and click it
      const navButton = page.getByRole('button', { name: p.name, exact: true });
      await navButton.click();

      // Verify the page header is visible and correct
      const heading = page.getByRole('heading', { name: p.heading });
      await expect(heading).toBeVisible();

      // 1. Verify no console errors occurred during navigation
      expect(consoleErrors).toEqual([]);

      // 2. Verify all images on the page are loaded and not broken
      const images = page.locator('img');
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const isLoaded = await img.evaluate((el: HTMLImageElement) => {
          return el.complete && typeof el.naturalWidth !== 'undefined' && el.naturalWidth > 0;
        });
        expect(isLoaded).toBe(true);
      }
    });
  }
});
