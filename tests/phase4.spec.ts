import { test, expect } from '@playwright/test';

test.describe('Phase 4: Cookie Consent & Error Boundary E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page of the application
    await page.goto('/');
  });

  test('Cookie Consent Banner appears, redirects, and accepts correctly', async ({ page }) => {
    // 1. Verify the Cookie Consent banner is visible on the Landing Page after loading
    const banner = page.locator('text=Cookie & Storage Notice');
    await expect(banner).toBeVisible({ timeout: 5000 });

    // 2. Verify links to Privacy Policy and Terms of Service are present
    const privacyBtn = page.getByRole('button', { name: 'Privacy Policy' });
    const termsBtn = page.getByRole('button', { name: 'Terms of Service' });
    await expect(privacyBtn).toBeVisible();
    await expect(termsBtn).toBeVisible();

    // 3. Click Privacy Policy and verify the Privacy Page is loaded
    await privacyBtn.click();
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    
    // Go back to landing
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(banner).toBeVisible();

    // 4. Click "Accept & Acknowledge" and verify local storage is updated and banner is closed
    const acceptBtn = page.getByRole('button', { name: 'Accept & Acknowledge' });
    await acceptBtn.click();
    
    // Check banner disappears
    await expect(banner).not.toBeVisible();

    // Check localStorage has been updated
    const localStorageConsent = await page.evaluate(() => localStorage.getItem('corecontrol-cookie-consent'));
    expect(localStorageConsent).toBe('accepted');

    // Reload page and verify it remains hidden
    await page.reload();
    await expect(banner).not.toBeVisible();
  });
});
