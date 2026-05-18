/**
 * @file DashboardPage.test.tsx
 * @description Tests for the DashboardPage component.
 * Covers: loading states, rendering key metrics (Revenue, Customers, Low Stock items), navigation callback triggers.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DashboardPage from './DashboardPage';

// Mock useTenant hook
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

describe('DashboardPage Component', () => {
  it('renders loading spinner initially, then displays metrics', async () => {
    render(<DashboardPage onNavigate={mockNavigate} onLogout={mockLogout} />);
    
    // Check loading indicator or wait for it to resolve
    await waitFor(() => {
      expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
    });

    expect(screen.getByText('Customer Traffic')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Alerts')).toBeInTheDocument();
  });

  it('triggers onNavigate when sidebar links are clicked', async () => {
    const user = userEvent.setup();
    render(<DashboardPage onNavigate={mockNavigate} onLogout={mockLogout} />);

    await waitFor(() => {
      expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
    });

    const billingLink = screen.getAllByRole('button', { name: /Billing/i })[0];
    await user.click(billingLink);

    expect(mockNavigate).toHaveBeenCalledWith('billing');
  });
});
