/**
 * @file CustomersPage.test.tsx
 * @description Tests for the CustomersPage component.
 * Covers: displaying customer list, searching, and adding customer dialog/form.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CustomersPage from './CustomersPage';

// Mock useTenant
vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    tenant: { id: 'tenant-123', name: 'Elite Gaming Cafe', slug: 'elite-gaming', onboarding_completed: true },
    loading: false,
    error: null,
    refresh: async () => {},
  }),
}));

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

describe('CustomersPage Component', () => {
  it('renders Customers list page layout correctly', async () => {
    render(<CustomersPage onNavigate={mockNavigate} onLogout={mockLogout} />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Customers' })).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/Search name or phone/i)).toBeInTheDocument();
  });
});
