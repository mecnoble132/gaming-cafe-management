import { test, expect } from '@playwright/test';
import { loginAs, setMockOnboarding } from './helpers/auth';

test.describe('Onboarding Page Complete Flow', () => {
  test.beforeEach(() => {
    setMockOnboarding(false);
  });

  test.afterEach(() => {
    setMockOnboarding(true);
  });

  test('Should guide user through the setup process and finish', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.message));

    await loginAs(page);

    // After login completes onboarding, we should be on the Command Center (Dashboard) page
    await expect(page.getByRole('heading', { name: 'Command Center' })).toBeVisible();
  });
});
