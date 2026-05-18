/**
 * @file PageHeader.test.tsx
 * @description Tests for the PageHeader component.
 * Covers: rendering without crashing, displaying the page title, displaying the cafe name, rendering actions.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PageHeader } from './PageHeader';

// Mock useTenant
vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    tenant: { id: 'tenant-123', name: 'Elite Gaming Cafe', slug: 'elite-gaming', onboarding_completed: true },
    loading: false,
    error: null,
    refresh: async () => {},
  }),
}));

describe('PageHeader Component', () => {
  it('renders correctly with title and tenant name', () => {
    render(<PageHeader title="Overview" />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Elite Gaming Cafe')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <PageHeader 
        title="Overview" 
        actions={<button data-testid="action-btn">Click Me</button>} 
      />
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });
});
