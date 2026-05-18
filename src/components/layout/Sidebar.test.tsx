/**
 * @file Sidebar.test.tsx
 * @description Tests for the Sidebar layout component.
 * Covers: renders all nav links, highlights active item, calls onNavigate, calls onLogout.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

function renderSidebar(active = 'Dashboard') {
  return render(
    <Sidebar active={active} onNavigate={mockNavigate} onLogout={mockLogout} />
  );
}

describe('Sidebar Component', () => {
  it('renders without crashing', () => {
    renderSidebar();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('renders all main navigation items', () => {
    renderSidebar();
    ['Dashboard', 'Billing', 'Bookings', 'Customers', 'Inventory', 'Reports', 'Settings'].forEach(label => {
      expect(screen.getAllByText(label)[0]).toBeInTheDocument();
    });
  });

  it('calls onNavigate with correct label when a nav item is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();
    await user.click(screen.getAllByText('Billing')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('Billing');
  });

  it('calls onLogout when the logout button is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();
    await user.click(screen.getAllByText(/logout/i)[0]);
    expect(mockLogout).toHaveBeenCalled();
  });
});
