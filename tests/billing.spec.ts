import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Billing Page E2E Tests', () => {
  test('Should search customer, select PC session, and finalize UPI bill successfully', async ({ page }) => {
    await loginAs(page);

    // Nav to Billing if not already active (it is default, but let's click to be sure)
    await page.getByRole('button', { name: 'Billing' }).click();

    // 1. Search and select customer "John Doe"
    await page.getByPlaceholder('Search by name or phone number').fill('John Doe');
    await page.getByRole('button', { name: 'John Doe 9876543210' }).click();

    // Verify customer is selected
    await expect(page.getByRole('heading', { name: 'John Doe' })).toBeVisible();

    // 2. Select PC duration using the select button
    await page.getByRole('button', { name: 'How many minutes?' }).click();
    await page.getByRole('button', { name: '60 Minutes (₹100)' }).click();

    // 3. Add to bill
    await page.getByRole('button', { name: 'Add pc' }).click();

    // Verify it is added to the Bill Summary
    await expect(page.locator('text=PC Session')).toBeVisible();

    // 4. Select UPI payment method
    await page.getByRole('button', { name: 'UPI' }).click();

    // 5. Finalize Bill
    await page.getByRole('button', { name: 'Finalize Bill · ₹100' }).click();

    // Verify success toast
    await expect(page.locator('text=Bill finalized · ₹100 · John Doe')).toBeVisible();
  });
});
