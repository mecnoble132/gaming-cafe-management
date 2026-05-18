/**
 * @file BookingsPage.test.tsx
 * @description Tests for the BookingsPage component.
 * Covers: page rendering, active scheduler header, navigation, and rendering.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BookingsPage from './BookingsPage';

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

describe('BookingsPage Component', () => {
  it('renders Bookings scheduler view correctly', async () => {
    render(<BookingsPage onNavigate={mockNavigate} onLogout={mockLogout} />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Bookings' })).toBeInTheDocument();
    });

    // Check calendar elements
    expect(screen.getByRole('button', { name: /Today/i })).toBeInTheDocument();
  });
});
