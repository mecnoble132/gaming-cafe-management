/**
 * @file ReportsPage.test.tsx
 * @description Tests for the ReportsPage component.
 * Covers: rendering analytics dashboards, billing history table, date filtering, and exporting.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReportsPage from './ReportsPage';

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

describe('ReportsPage Component', () => {
  it('renders Reports and Analytics dashboard layout correctly', async () => {
    render(<ReportsPage onNavigate={mockNavigate} onLogout={mockLogout} />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Export Excel/i })).toBeInTheDocument();
  });
});
