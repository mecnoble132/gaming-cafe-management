import { Page, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STORAGE_STATE_PATH = path.join(__dirname, '../../playwright/.auth/user.json');

// Mock data stores
let customersList: any[] = [];
let productsList: any[] = [];

/**
 * Reusable E2E helper to log in a test user. Supports auto-adaptive CORS-compliant network mock routing.
 */
export async function loginAs(page: Page, email?: string, password?: string) {
  const testEmail = email || process.env.TEST_USER_EMAIL || 'mecnoble132@gmail.com';
  const testPassword = password || process.env.TEST_USER_PASSWORD || 'TestPassword123!';

  // Adaptive Interception Check
  const useMockAuth = testEmail === 'mecnoble132@gmail.com' && testPassword === 'TestPassword123!';

  if (useMockAuth) {
    console.log('Enabling CORS-compliant E2E network mocking...');

    // 1. Intercept Token Auth with OPTIONS check
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

      let reqEmail = '';
      try {
        const postData = JSON.parse(request.postData() || '{}');
        reqEmail = postData.email || '';
      } catch (err) {}

      if (reqEmail === testEmail) {
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
              email: testEmail,
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

    // 2. Intercept Signup
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
            email: testEmail,
            role: 'authenticated',
            aud: 'authenticated',
            confirmed_at: new Date().toISOString()
          }
        })
      });
    });

    // 3. Intercept Profile Fetch (returns single object with nested tenants join)
    await page.route('**/rest/v1/profiles*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
          email: testEmail,
          tenants: {
            id: 'mock-tenant-id',
            name: 'E2E Playwright Cafe',
            slug: 'playwright-staging',
            onboarding_completed: true
          }
        })
      });
    });

    // 4. Intercept Tenants Fetch (returns a single object)
    await page.route('**/rest/v1/tenants*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // 5. Intercept Stations
    await page.route('**/rest/v1/stations*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization'
          }
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify([
          { id: 'stn-1', name: 'PC 1', type: 'pc', tenant_id: 'mock-tenant-id' },
          { id: 'stn-2', name: 'PS5 1', type: 'ps5', tenant_id: 'mock-tenant-id' }
        ])
      });
    });

    // 6. Intercept Booking Settings (returns single object)
    await page.route('**/rest/v1/booking_settings*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
          id: 'mock-booking-settings-id',
          opening_time: '09:00',
          closing_time: '23:00',
          slot_minutes: 15,
          tenant_id: 'mock-tenant-id'
        })
      });
    });

    // 7. Intercept Pricing Settings (returns single object)
    await page.route('**/rest/v1/pricing_settings*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
          id: 'mock-pricing-settings-id',
          config: {
            pc: { '30': 50, '60': 100, '90': 150 },
            ps5: { '30': 60, '60': 120, '90': 180 }
          },
          tenant_id: 'mock-tenant-id'
        })
      });
    });

    // 8. Intercept Customers CRUD
    await page.route('**/rest/v1/customers*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }

      const method = request.method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(customersList)
        });
      } else if (method === 'POST') {
        const body = JSON.parse(request.postData() || '{}');
        const newCustomer = { id: `cust-${Date.now()}`, ...body, created_at: new Date().toISOString() };
        customersList.push(newCustomer);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(newCustomer)
        });
      } else if (method === 'PATCH') {
        const body = JSON.parse(request.postData() || '{}');
        customersList = customersList.map(c => c.id === body.id ? { ...c, ...body } : c);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(body)
        });
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ message: 'Deleted' })
        });
      }
    });

    // 9. Intercept Products CRUD
    await page.route('**/rest/v1/products*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }

      const method = request.method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(productsList)
        });
      } else if (method === 'POST') {
        const body = JSON.parse(request.postData() || '{}');
        const newProduct = { id: `prod-${Date.now()}`, ...body, created_at: new Date().toISOString() };
        productsList.push(newProduct);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(newProduct)
        });
      } else if (method === 'PATCH') {
        const body = JSON.parse(request.postData() || '{}');
        productsList = productsList.map(p => p.id === body.id ? { ...p, ...body } : p);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(body)
        });
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ message: 'Deleted' })
        });
      }
    });

    // 10. Intercept Bills
    await page.route('**/rest/v1/bills*', async route => {
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
        body: JSON.stringify([])
      });
    });

    // 11. Intercept Bookings
    await page.route('**/rest/v1/bookings*', async route => {
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
        body: JSON.stringify([])
      });
    });
  }

  // Go to Landing Page
  await page.goto('/');

  // Check if already logged in
  if (await page.getByRole('button', { name: 'Logout' }).isVisible()) {
    return;
  }

  // Click "Log In"
  await page.getByRole('button', { name: 'Log In' }).click();

  // Wait for AuthPage form to load
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

  // Fill in email and password
  await page.getByPlaceholder('admin@cafe.com').fill(testEmail);
  await page.getByPlaceholder('••••••••').fill(testPassword);

  // Submit and wait for redirect
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/auth/v1/token') && response.status() === 200,
    { timeout: 10000 }
  );
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await responsePromise;

  // Let redirect finish
  await page.waitForTimeout(1000);

  // Handle Onboarding dynamically if it is displayed
  if (page.url().includes('onboarding') || await page.locator('text=Set up your gaming cafe').isVisible()) {
    console.log('Onboarding page detected. Automating step-by-step setup...');

    // Step 0: Welcome
    await page.getByPlaceholder('e.g. Neon Arena Gaming Lounge').fill('E2E Playwright Cafe');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(500);

    // Step 1: Stations
    await page.getByPlaceholder('e.g. PC, PS5, VR').fill('PC');
    await page.getByPlaceholder('1').fill('2');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(500);

    // Step 2: Hours/Pricing config
    await page.getByPlaceholder('₹').first().fill('100');
    
    // Complete setup
    const finishPromise = page.waitForResponse(res => res.url().includes('/rest/v1/profiles') || res.url().includes('/rest/v1/stations'));
    await page.getByRole('button', { name: 'Finish Setup' }).click();
    await finishPromise;

    console.log('Onboarding auto-completed!');
    await page.waitForTimeout(1000);
  }

  // Final check to assert user is in the workspace dashboard (SPA without router remains on root URL)
  await expect(page.locator('text=Logout')).toBeVisible();
}
