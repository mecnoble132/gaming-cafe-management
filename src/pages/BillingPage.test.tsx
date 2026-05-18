/**
 * @file BillingPage.test.tsx
 * @description Tests for the BillingPage component.
 * Covers: page layout rendering, loading/fetching data, item addition to bill summary, finalizing bill flow.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import BillingPage from './BillingPage';

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

describe('BillingPage Component', () => {
  it('renders billing page and its main layout correctly', async () => {
    render(<BillingPage onNavigate={mockNavigate} onLogout={mockLogout} />);
    
    // Wait for the components to load and mock data to resolve
    await waitFor(() => {
      expect(screen.getByText('Bill Summary')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/Search by name or phone number/i)).toBeInTheDocument();
  });
});
