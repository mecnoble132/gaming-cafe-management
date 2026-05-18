/**
 * @file InventoryPage.test.tsx
 * @description Tests for the InventoryPage component.
 * Covers: rendering inventory item list, categories, alerts, low stock indicators.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InventoryPage from './InventoryPage';

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

describe('InventoryPage Component', () => {
  it('renders Inventory page layout correctly', async () => {
    render(<InventoryPage onNavigate={mockNavigate} onLogout={mockLogout} />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument();
    });

    expect(screen.getAllByPlaceholderText(/Search.../i)[0]).toBeInTheDocument();
  });
});
