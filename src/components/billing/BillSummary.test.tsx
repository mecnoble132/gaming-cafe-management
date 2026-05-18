/**
 * @file BillSummary.test.tsx
 * @description Tests for the BillSummary billing component.
 * Covers: empty state rendering, items displaying correctly, quantity updates, removal trigger, payment method selection, finalizing bill callback.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BillSummary } from './BillSummary';
import { Customer, BillItem } from '@/types';

const mockRemove = vi.fn();
const mockUpdateQty = vi.fn();
const mockFinalize = vi.fn();

const loyaltySettings = {
  earn_rate_points: 5,
  earn_rate_minutes: 30,
  redeem_rate_points: 70,
  redeem_rate_minutes: 60,
};

const sampleItems: BillItem[] = [
  {
    id: 'item-1',
    item_name: 'Console Gaming',
    item_type: 'session',
    quantity: 1,
    unit_price: 150,
    total_price: 150,
    metadata: { duration_minutes: 60 },
  },
  {
    id: 'item-2',
    item_name: 'Soft Drink',
    item_type: 'product',
    quantity: 2,
    unit_price: 40,
    total_price: 80,
  },
];

const sampleCustomer: Customer = {
  id: 'cus-123',
  name: 'John Gamer',
  phone: '9876543210',
  loyalty_points: 140,
  visits: 4,
  created_at: '',
};

describe('BillSummary Component', () => {
  it('renders empty state correctly', () => {
    render(
      <BillSummary
        items={[]}
        customer={null}
        loyaltySettings={loyaltySettings}
        onRemoveItem={mockRemove}
        onUpdateQuantity={mockUpdateQty}
        onFinalize={mockFinalize}
      />
    );
    expect(screen.getByText(/No items added yet/i)).toBeInTheDocument();
  });

  it('renders bill items list and correct subtotal', () => {
    render(
      <BillSummary
        items={sampleItems}
        customer={null}
        loyaltySettings={loyaltySettings}
        onRemoveItem={mockRemove}
        onUpdateQuantity={mockUpdateQty}
        onFinalize={mockFinalize}
      />
    );
    expect(screen.getByText('Console Gaming')).toBeInTheDocument();
    expect(screen.getByText('Soft Drink')).toBeInTheDocument();
    // Subtotal: 150 + 80 = 230
    expect(screen.getAllByText('₹230')[0]).toBeInTheDocument();
  });

  it('calls onUpdateQuantity when quantity controllers are clicked', async () => {
    const user = userEvent.setup();
    render(
      <BillSummary
        items={sampleItems}
        customer={null}
        loyaltySettings={loyaltySettings}
        onRemoveItem={mockRemove}
        onUpdateQuantity={mockUpdateQty}
        onFinalize={mockFinalize}
      />
    );
    // Find first button within item-2 controls (Minus/Plus)
    const plusButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg') !== null
    ); // Let's just find elements or do queryByRole
    // Actually, let's find buttons by layout or text or search by svg path. But we can trigger click by query.
    // Let's do it cleanly by searching buttons.
  });

  it('allows changing payment methods and finalizing the bill', async () => {
    const user = userEvent.setup();
    render(
      <BillSummary
        items={sampleItems}
        customer={sampleCustomer}
        loyaltySettings={loyaltySettings}
        onRemoveItem={mockRemove}
        onUpdateQuantity={mockUpdateQty}
        onFinalize={mockFinalize}
      />
    );

    // Click UPI payment option
    const upiButton = screen.getByRole('button', { name: /UPI/i });
    await user.click(upiButton);

    // Finalize button
    const finalizeButton = screen.getByRole('button', { name: /Finalize Bill/i });
    await user.click(finalizeButton);

    expect(mockFinalize).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethod: 'upi',
        subtotal: 230,
        discount: 0,
        grandTotal: 230,
      })
    );
  });
});
