/**
 * @file auth.spec.ts
 * @description Covers end-to-end user flows for authentication including:
 * - Redirects/visiting the landing page
 * - Input validation checks (empty inputs)
 * - Sign in with invalid credentials
 * - Successful sign in and redirect
 * - Multi-step registration (Sign Up) flow with Terms & Privacy Policy agreement
 * - Logging out successfully
 */
import { test, expect } from '@playwright/test';
import { loginAs, STORAGE_STATE_PATH } from './helpers/auth';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'mecnoble132@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

test.describe('Authentication Flows', () => {

  test.beforeEach(async ({ page }) => {
    const useMockAuth = TEST_EMAIL === 'mecnoble132@gmail.com' && TEST_PASSWORD === 'TestPassword123!';
    if (useMockAuth) {
      // Intercept Token
      await page.route('**/auth/v1/token*', async route => {
        const request = route.request();
        if (request.method() === 'OPTIONS') {
          await route.fulfill({
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization'
            }
          });
          return;
        }

        let email = '';
        try {
          const postData = JSON.parse(request.postData() || '{}');
          email = postData.email || '';
        } catch (err) {}

        if (email === TEST_EMAIL) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              access_token: 'mock-access-token',
              token_type: 'bearer',
              expires_in: 3600,
              refresh_token: 'mock-refresh-token',
              user: {
                id: 'mock-user-uuid',
                email: TEST_EMAIL,
                email_confirmed_at: new Date().toISOString(),
                confirmed_at: new Date().toISOString(),
                role: 'authenticated',
                aud: 'authenticated',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            })
          });
        } else {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              error: 'invalid_grant',
              error_description: 'Invalid login credentials'
            })
          });
        }
      });

      // Intercept Profiles Fetch
      await page.route('**/rest/v1/profiles*', async route => {
        const request = route.request();
        if (request.method() === 'OPTIONS') {
          await route.fulfill({
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization'
            }
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            id: 'mock-profile-id',
            tenant_id: 'mock-tenant-id',
            role: 'owner',
            email: TEST_EMAIL,
            tenants: {
              id: 'mock-tenant-id',
              name: 'E2E Playwright Cafe',
              slug: 'playwright-staging',
              onboarding_completed: true
            }
          })
        });
      });

      // Intercept Tenants Fetch
      await page.route('**/rest/v1/tenants*', async route => {
        const request = route.request();
        if (request.method() === 'OPTIONS') {
          await route.fulfill({
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization'
            }
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            id: 'mock-tenant-id',
            name: 'E2E Playwright Cafe',
            slug: 'playwright-staging',
            onboarding_completed: true
          })
        });
      });
    }
  });
  
  test('Visiting the app as unauthenticated user renders landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('CoreControl · Gaming Cafe Management');
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Free Trial' })).toBeVisible();
  });

  test('Login form shows validation errors on empty fields', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Log In' }).click();

    const submitBtn = page.getByRole('button', { name: 'Sign in', exact: true });
    await submitBtn.click();

    const emailInput = page.getByPlaceholder('admin@cafe.com');
    const isRequired = await emailInput.evaluate((el: HTMLInputElement) => el.required);
    expect(isRequired).toBe(true);
  });

  test('Login fails and shows error message with wrong credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Log In' }).click();

    await page.getByPlaceholder('admin@cafe.com').fill('wrong@email.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword123');

    const authPromise = page.waitForResponse(
      response => response.url().includes('/auth/v1/token') && response.status() === 400,
      { timeout: 5000 }
    );
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await authPromise;

    await expect(page.locator('text=Invalid login credentials')).toBeVisible();
  });

  test('Login succeeds with valid credentials and redirects to dashboard/onboarding', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
    await page.context().storageState({ path: STORAGE_STATE_PATH });
  });

  test('Sign up flow creates a new account successfully with terms agreement', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Free Trial' }).click();

    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    const randomEmail = `test_${Math.floor(Math.random() * 1000000)}@corecontrol.test`;
    await page.getByPlaceholder('admin@cafe.com').fill(randomEmail);
    await page.getByPlaceholder('••••••••').fill('SecurePassword123!');

    const signUpBtn = page.getByRole('button', { name: 'Create Account', exact: true });
    await expect(signUpBtn).toBeDisabled();

    // The checkbox uses sr-only (visually hidden) — use JS .click() on the input to avoid
    // accidentally triggering the "Terms of Service" or "Privacy Policy" buttons inside the label.
    await page.locator('input[type="checkbox"]').evaluate((el: HTMLInputElement) => el.click());
    await expect(signUpBtn).toBeEnabled();

    // Setup signup interception for local mock resilience
    const useMockAuth = TEST_EMAIL === 'mecnoble132@gmail.com' && TEST_PASSWORD === 'TestPassword123!';
    if (useMockAuth) {
      await page.route('**/auth/v1/signup*', async route => {
        const request = route.request();
        if (request.method() === 'OPTIONS') {
          await route.fulfill({
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization'
            }
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            user: {
              id: 'mock-user-uuid',
              email: randomEmail,
              role: 'authenticated',
              aud: 'authenticated',
              confirmed_at: new Date().toISOString()
            }
          })
        });
      });
    }

    const responsePromise = page.waitForResponse(
      response => response.url().includes('/auth/v1/signup') && response.status() === 200,
      { timeout: 10000 }
    );
    await signUpBtn.click();
    await responsePromise;

    await expect(page.locator('text=Registration successful')).toBeVisible();
  });

  test('Logged-in user can log out successfully', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);

    const logoutBtn = page.getByRole('button', { name: 'Logout' });
    await logoutBtn.click();

    // After signOut the auth state change fires and the app re-renders.
    // It lands on the AuthPage because the path state might be /login. 
    // Expect the login form's "Welcome Back" heading instead of the landing page's "Log In" button.
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible({ timeout: 15000 });
  });
});
