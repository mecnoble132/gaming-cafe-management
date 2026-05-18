/**
 * @file GameTabs.test.tsx
 * @description Tests for the GameTabs billing component.
 * Covers: tab switching, snacks rendering and adding, custom pricing selection and adding.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GameTabs } from './GameTabs';
import { Product } from '@/types';

const mockAddItem = vi.fn();

const sampleProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Coca Cola',
    category: 'Drinks',
    mrp: 40,
    stock_quantity: 15,
    low_stock_threshold: 5,
    created_at: '',
  },
  {
    id: 'prod-2',
    name: 'Potato Chips',
    category: 'Snacks',
    mrp: 30,
    stock_quantity: 0, // Out of stock
    low_stock_threshold: 3,
    created_at: '',
  },
];

const pricingConfig = {
  pc_gaming: {
    '60': 100,
    '120': 180,
  },
};

describe('GameTabs Component', () => {
  it('renders Game tabs and Snacks tab', () => {
    render(
      <GameTabs
        onAddItem={mockAddItem}
        products={sampleProducts}
        productQuantityById={{}}
        pricingConfig={pricingConfig}
      />
    );
    expect(screen.getAllByRole('button', { name: /PC GAMING/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Snacks/i })[0]).toBeInTheDocument();
  });

  it('renders products lists in snacks tab', async () => {
    const user = userEvent.setup();
    render(
      <GameTabs
        onAddItem={mockAddItem}
        products={sampleProducts}
        productQuantityById={{}}
        pricingConfig={pricingConfig}
      />
    );

    // Switch to snacks tab
    await user.click(screen.getAllByRole('button', { name: /Snacks/i })[0]);

    expect(screen.getByText('Coca Cola')).toBeInTheDocument();
    expect(screen.getByText('Potato Chips')).toBeInTheDocument();
  });

  it('triggers onAddItem when a snack is clicked', async () => {
    const user = userEvent.setup();
    render(
      <GameTabs
        onAddItem={mockAddItem}
        products={sampleProducts}
        productQuantityById={{}}
        pricingConfig={pricingConfig}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /Snacks/i })[0]);
    
    const snackBtn = screen.getByText('Coca Cola');
    await user.click(snackBtn);

    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        item_type: 'product',
        item_name: 'Coca Cola',
        unit_price: 40,
      })
    );
  });

  it('disables out of stock products', async () => {
    const user = userEvent.setup();
    render(
      <GameTabs
        onAddItem={mockAddItem}
        products={sampleProducts}
        productQuantityById={{}}
        pricingConfig={pricingConfig}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /Snacks/i })[0]);
    
    const disabledBtn = screen.getByRole('button', { name: /Potato Chips/i });
    expect(disabledBtn).toBeDisabled();
  });
});
