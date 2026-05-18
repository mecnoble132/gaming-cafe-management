/**
 * @file CustomerStrip.test.tsx
 * @description Tests for the CustomerStrip billing component.
 * Covers: rendering selected customer, search flow, dropdown list, new customer creation form.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CustomerStrip } from './CustomerStrip';
import { Customer } from '@/types';

const mockSelect = vi.fn();
const mockClear = vi.fn();
const mockCreate = vi.fn();

const sampleCustomers: Customer[] = [
  { id: '1', name: 'John Doe', phone: '9876543210', loyalty_points: 120, visits: 3, created_at: '' },
  { id: '2', name: 'Alice Smith', phone: '8765432109', loyalty_points: 50, visits: 1, created_at: '' }
];

describe('CustomerStrip Component', () => {
  it('renders search input when no customer is selected', () => {
    render(
      <CustomerStrip
        selectedCustomer={null}
        allCustomers={sampleCustomers}
        onSelectCustomer={mockSelect}
        onClearCustomer={mockClear}
        onCreateCustomer={mockCreate}
      />
    );
    expect(screen.getByPlaceholderText(/Search by name or phone number/i)).toBeInTheDocument();
  });

  it('renders selected customer correctly', () => {
    render(
      <CustomerStrip
        selectedCustomer={sampleCustomers[0]}
        allCustomers={sampleCustomers}
        onSelectCustomer={mockSelect}
        onClearCustomer={mockClear}
        onCreateCustomer={mockCreate}
      />
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('9876543210')).toBeInTheDocument();
    expect(screen.getByText('120 GG pts')).toBeInTheDocument();
  });

  it('calls onClearCustomer when "Change" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CustomerStrip
        selectedCustomer={sampleCustomers[0]}
        allCustomers={sampleCustomers}
        onSelectCustomer={mockSelect}
        onClearCustomer={mockClear}
        onCreateCustomer={mockCreate}
      />
    );
    await user.click(screen.getByText(/Change/i));
    expect(mockClear).toHaveBeenCalled();
  });

  it('filters and displays customer options on search input', async () => {
    const user = userEvent.setup();
    render(
      <CustomerStrip
        selectedCustomer={null}
        allCustomers={sampleCustomers}
        onSelectCustomer={mockSelect}
        onClearCustomer={mockClear}
        onCreateCustomer={mockCreate}
      />
    );

    const input = screen.getByPlaceholderText(/Search by name or phone number/i);
    await user.type(input, 'Alice');

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('submits new customer creation payload correctly', async () => {
    const user = userEvent.setup();
    render(
      <CustomerStrip
        selectedCustomer={null}
        allCustomers={sampleCustomers}
        onSelectCustomer={mockSelect}
        onClearCustomer={mockClear}
        onCreateCustomer={mockCreate}
      />
    );

    // Open create form
    await user.click(screen.getByRole('button', { name: /new/i }));
    
    // Fill form
    await user.type(screen.getByPlaceholderText(/Name \(optional\)/i), 'Bob Builder');
    await user.type(screen.getByPlaceholderText(/Phone number \(required\)/i), '5551234');
    
    const submitBtn = screen.getByRole('button', { name: /Attach Bob Builder/i });
    await user.click(submitBtn);

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Bob Builder',
      phone: '5551234',
      whatsapp_number: '5551234'
    });
  });
});
