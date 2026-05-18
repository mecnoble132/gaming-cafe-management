/**
 * @file SettingsPage.test.tsx
 * @description Tests for the SettingsPage component.
 * Covers: displaying configuration tables, custom stations list, pricing structure, loyalty program rules.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SettingsPage from './SettingsPage';

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

describe('SettingsPage Component', () => {
  it('renders Settings panel layout correctly', async () => {
    render(<SettingsPage onNavigate={mockNavigate} onLogout={mockLogout} />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });

    expect(screen.getByText(/Stations/i)).toBeInTheDocument();
    expect(screen.getByText(/Pricing & Game Types/i)).toBeInTheDocument();
    expect(screen.getByText(/GG Points System/i)).toBeInTheDocument();
  });
});
