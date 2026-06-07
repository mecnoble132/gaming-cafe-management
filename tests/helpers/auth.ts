import { Page, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STORAGE_STATE_PATH = path.join(__dirname, '../../playwright/.auth/user.json');

// Mock data stores
let customersList: any[] = [
  { id: 'CUS-MOCK01', name: 'John Doe', phone: '9876543210', loyalty_points: 150, visits: 5 }
];
let productsList: any[] = [];
let stationsList: any[] = [
  { id: 'stn-1', name: 'PC 1', type: 'pc', tenant_id: 'mock-tenant-id' },
  { id: 'stn-2', name: 'PS5 1', type: 'ps5', tenant_id: 'mock-tenant-id' }
];
let bookingsList: any[] = [];
let billsList: any[] = [];
let loyaltySettingsObj: any = {
  id: 'mock-loyalty-settings-id',
  points_per_currency_unit: 10,
  redemption_value: 0.1,
  min_redemption_points: 100,
  tenant_id: 'mock-tenant-id'
};
let pricingSettingsObj: any = {
  id: 'mock-pricing-settings-id',
  config: {
    pc: { '30': 50, '60': 100, '90': 150 },
    ps5: { '30': 60, '60': 120, '90': 180 }
  },
  tenant_id: 'mock-tenant-id'
};
let mockTenantOnboardingCompleted = true;

export function setMockOnboarding(completed: boolean) {
  mockTenantOnboardingCompleted = completed;
}

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

    // 0. Catch-all for any unhandled Supabase REST API routes (LOWEST priority, must be registered FIRST)
    await page.route('**/rest/v1/**', async route => {
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
      // Return a sensible default for any unmatched REST route
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(request.method() === 'GET' ? [] : {})
      });
    });

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
            onboarding_completed: mockTenantOnboardingCompleted
          }
        })
      });
    });

    // 4. Intercept Tenants Fetch (returns a single object)
    await page.route('**/rest/v1/tenants*', async route => {
      const request = route.request();
      const method = request.method();
      if (method === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }

      if (method === 'PATCH') {
        const body = JSON.parse(request.postData() || '{}');
        if (body.onboarding_completed !== undefined) {
          mockTenantOnboardingCompleted = body.onboarding_completed;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify([{
            id: 'mock-tenant-id',
            name: body.name || 'E2E Playwright Cafe',
            slug: 'playwright-staging',
            onboarding_completed: mockTenantOnboardingCompleted
          }])
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
          onboarding_completed: mockTenantOnboardingCompleted
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
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }
      const method = request.method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(stationsList) });
      } else if (method === 'POST') {
        const body = JSON.parse(request.postData() || '{}');
        const newStation = { id: `STN-${Date.now()}`, ...body, created_at: new Date().toISOString() };
        stationsList.push(newStation);
        await route.fulfill({ status: 201, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(newStation) });
      } else if (method === 'DELETE') {
        const url = new URL(request.url());
        const idParam = url.searchParams.get('id');
        const id = idParam ? idParam.replace('eq.', '') : '';
        stationsList = stationsList.filter(s => s.id !== id);
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ message: 'Deleted' }) });
      }
    });

    // 6. Intercept Booking Settings (returns single object)
    await page.route('**/rest/v1/booking_settings*', async route => {
      const request = route.request();
      const method = request.method();
      if (method === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }
      if (method === 'POST') {
        const body = JSON.parse(request.postData() || '{}');
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(body)
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
      const method = request.method();
      if (method === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(pricingSettingsObj) });
      } else if (method === 'POST') {
        const body = JSON.parse(request.postData() || '{}');
        pricingSettingsObj = { ...pricingSettingsObj, ...body };
        await route.fulfill({ status: 201, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(pricingSettingsObj) });
      } else if (method === 'PATCH') {
        const body = JSON.parse(request.postData() || '{}');
        pricingSettingsObj = { ...pricingSettingsObj, ...body };
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify([pricingSettingsObj]) });
      }
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
        const url = new URL(request.url());
        const idParam = url.searchParams.get('id');
        const id = idParam ? idParam.replace('eq.', '') : body.id;
        customersList = customersList.map(c => c.id === id ? { ...c, ...body } : c);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify([body])
        });
      } else if (method === 'DELETE') {
        const url = new URL(request.url());
        const idParam = url.searchParams.get('id');
        const id = idParam ? idParam.replace('eq.', '') : '';
        customersList = customersList.filter(c => c.id !== id);
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
        const url = new URL(request.url());
        const idParam = url.searchParams.get('id');
        const id = idParam ? idParam.replace('eq.', '') : body.id;
        productsList = productsList.map(p => p.id === id ? { ...p, ...body } : p);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify([body])
        });
      } else if (method === 'DELETE') {
        const url = new URL(request.url());
        const idParam = url.searchParams.get('id');
        const id = idParam ? idParam.replace('eq.', '') : '';
        productsList = productsList.filter(p => p.id !== id);
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
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }
      const method = request.method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(billsList) });
      } else if (method === 'POST') {
        const body = JSON.parse(request.postData() || '{}');
        const newBill = { id: `BILL-${Date.now()}`, ...body, created_at: new Date().toISOString() };
        billsList.push(newBill);
        await route.fulfill({ status: 201, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(newBill) });
      }
    });

    // 11. Intercept Bookings
    await page.route('**/rest/v1/bookings*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }
      const method = request.method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(bookingsList) });
      } else if (method === 'POST') {
        const body = JSON.parse(request.postData() || '{}');
        const newBooking = { id: `BKG-${Date.now()}`, ...body, created_at: new Date().toISOString() };
        bookingsList.push(newBooking);
        await route.fulfill({ status: 201, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(newBooking) });
      } else if (method === 'DELETE') {
        const url = new URL(request.url());
        const idParam = url.searchParams.get('id');
        const id = idParam ? idParam.replace('eq.', '') : '';
        bookingsList = bookingsList.filter(b => b.id !== id);
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ message: 'Deleted' }) });
      }
    });
    // 12. Intercept Loyalty Settings
    await page.route('**/rest/v1/loyalty_settings*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }
      const method = request.method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(loyaltySettingsObj) });
      } else if (method === 'PATCH') {
        const body = JSON.parse(request.postData() || '{}');
        loyaltySettingsObj = { ...loyaltySettingsObj, ...body };
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify([loyaltySettingsObj]) });
      }
    });

    // 13. Intercept Bill Items & Loyalty Transactions
    await page.route('**/rest/v1/bill_items*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify([]) });
    });

    await page.route('**/rest/v1/loyalty_transactions*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify([]) });
    });

    // 14. Intercept Logout — ensures signOut clears session immediately without waiting for real Supabase
    // 14. Intercept Logout — ensures signOut clears session immediately without waiting for real Supabase
    await page.route('**/auth/v1/logout*', async route => {
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
        status: 204,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    });

    // 15. Intercept Supabase RPC calls
    await page.route('**/rest/v1/rpc/**', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey, authorization, prefer'
          }
        });
        return;
      }
      // Return a mock bill ID for atomic_finalize_bill and a generic success for other RPCs
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(`BILL-MOCK-${Date.now()}`)
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
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(500);

    // Step 1: Stations
    await page.getByPlaceholder('e.g. PS5, PC, VR').fill('PC');
    await page.locator('input[type="number"]').first().fill('2');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(500);

    // Step 2: Hours/Pricing config
    await page.locator('input[type="number"]').first().fill('100');
    
    // Complete setup
    await page.getByRole('button', { name: 'Finish setup' }).click();
    console.log('Onboarding auto-completed!');
    await page.waitForTimeout(1000);
  }

  // Final check to assert user is in the workspace dashboard (SPA without router remains on root URL)
  await expect(page.locator('text=Logout')).toBeVisible();
}
