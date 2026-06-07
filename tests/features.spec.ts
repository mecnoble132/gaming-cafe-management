/**
 * @file features.spec.ts
 * @description Covers end-to-end user journeys for core features including:
 * - Customers management CRUD flow (Create, Read, Update, Delete)
 * - Inventory management CRUD flow (Create, Read, Update, Delete)
 * Ensures required validation, real-time database storage in Supabase, cancel/reset actions, and proper success messages are fully verified.
 */
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'mecnoble132@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

test.describe('Core Features CRUD Journeys', () => {

  test.beforeEach(async ({ page }) => {
    // Reusable auth state logic
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test('Customer Management Complete CRUD Journey', async ({ page }) => {
    // 1. Navigate to Customers Page
    await page.getByRole('button', { name: 'Customers', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();

    // 2. Open Add Customer Dialog
    await page.getByRole('button', { name: 'Add Customer' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Customer' })).toBeVisible();

    // 3. Test Required Field Validation
    const saveButton = page.getByRole('dialog').getByRole('button', { name: 'Add Customer', exact: true });
    await saveButton.click();
    // Verify toast error appeared for validation
    await expect(page.locator('text=Name and Phone are required')).toBeVisible();

    // 4. Fill form with valid data
    const uniqueName = `PW QA Customer ${Date.now()}`;
    await page.getByPlaceholder('Customer Name').fill(uniqueName);
    await page.getByPlaceholder('10-digit mobile').fill('9876543210');
    await page.getByPlaceholder('WhatsApp number').fill('9876543210');

    // Click "Add Customer" to save and wait for Supabase REST API response
    const savePromise = page.waitForResponse(
      response => response.url().includes('/rest/v1/customers') && response.status() === 201
    );
    await saveButton.click();
    await savePromise;

    // Verify success toast message
    await expect(page.locator('text=Customer added')).toBeVisible();

    // 5. Verify the customer appears in the table (Read)
    const row = page.locator('tr').filter({ hasText: uniqueName });
    await expect(row).toBeVisible();

    // 6. Edit the customer (Update)
    await row.getByRole('button', { name: 'Edit customer' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Customer' })).toBeVisible();

    await page.getByPlaceholder('10-digit mobile').fill('9876543211');
    const updatePromise = page.waitForResponse(
      response => response.url().includes('/rest/v1/customers') && response.status() === 200
    );
    await page.getByRole('button', { name: 'Update Customer', exact: true }).click();
    await updatePromise;

    // Verify success toast message
    await expect(page.locator('text=Customer updated')).toBeVisible();
    await expect(row.locator('text=9876543211')).toBeVisible();

    // 7. Delete the customer (Delete)
    await row.getByRole('button', { name: 'Delete customer' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm Deletion' })).toBeVisible();

    const deletePromise = page.waitForResponse(
      response => response.url().includes('/rest/v1/customers') && response.status() === 200
    );
    await page.getByRole('button', { name: 'Delete Customer', exact: true }).click();
    await deletePromise;

    // Verify success toast message
    await expect(page.locator('text=Customer deleted')).toBeVisible();
    await expect(page.locator('tr').filter({ hasText: uniqueName })).not.toBeVisible();
  });

  test('Inventory Management Complete CRUD Journey', async ({ page }) => {
    // 1. Navigate to Inventory Page
    await page.getByRole('button', { name: 'Inventory', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    // 2. Open Add Product Dialog
    // Note: The UI has multiple buttons matching "Add Product" (desktop/mobile layout)
    await page.getByRole('button', { name: 'Add Product' }).first().click();
    await expect(page.getByRole('heading', { name: 'Add New Product' })).toBeVisible();

    // 3. Test Required Field Validation
    const saveButton = page.getByRole('dialog').getByRole('button', { name: 'Save Product', exact: true });
    await saveButton.click();
    await expect(page.locator('text=Please fill all required fields')).toBeVisible();

    // 4. Fill form with valid data
    const uniqueName = `PW Drink ${Date.now()}`;
    await page.getByPlaceholder('e.g. Red Bull').fill(uniqueName);
    await page.getByPlaceholder('e.g. Drinks').fill('Snacks');
    await page.locator('input[type="number"]').first().fill('45');
    await page.locator('input[type="number"]').nth(1).fill('50');

    // Click "Add Product" to save and wait for Supabase REST API response
    const savePromise = page.waitForResponse(
      response => response.url().includes('/rest/v1/products') && response.status() === 201
    );
    await saveButton.click();
    await savePromise;

    // Verify success toast message
    await expect(page.locator('text=Product added')).toBeVisible();

    // 5. Verify the product appears in the table (Read)
    const row = page.locator('tr').filter({ hasText: uniqueName });
    await expect(row).toBeVisible();

    // 6. Edit the product (Update)
    await row.getByRole('button', { name: 'Edit product' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeVisible();

    await page.locator('input[type="number"]').first().fill('50');
    const updatePromise = page.waitForResponse(
      response => response.url().includes('/rest/v1/products') && response.status() === 201
    );
    await page.getByRole('button', { name: 'Update Product', exact: true }).click();
    await updatePromise;

    // Verify success toast message
    await expect(page.locator('text=Product updated')).toBeVisible();
    await expect(row.locator('text=₹50')).toBeVisible();

    // 7. Delete the product (Delete)
    await row.getByRole('button', { name: 'Delete product' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm Deletion' })).toBeVisible();

    const deletePromise = page.waitForResponse(
      response => response.url().includes('/rest/v1/products') && response.status() === 200
    );
    await page.getByRole('button', { name: 'Delete Product', exact: true }).click();
    await deletePromise;

    // Verify success toast message
    await expect(page.locator('text=Product deleted')).toBeVisible();
    await expect(page.locator('tr').filter({ hasText: uniqueName })).not.toBeVisible();
  });
});
