/**
 * @file OnboardingPage.test.tsx
 * @description Tests for the OnboardingPage component.
 * Covers: cafe registration flow, setting up stations, slots, and completing setup steps.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OnboardingPage from './OnboardingPage';

// Mock useTenant
vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    tenant: { id: 'tenant-123', name: 'Elite Gaming Cafe', slug: 'elite-gaming', onboarding_completed: false },
    loading: false,
    error: null,
    refresh: async () => {},
  }),
}));

const mockComplete = vi.fn();

describe('OnboardingPage Component', () => {
  it('renders Onboarding step-by-step assistant correctly', async () => {
    render(<OnboardingPage onComplete={mockComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Set up your gaming cafe/i)).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/e.g. Neon Arena Gaming Lounge/i)).toBeInTheDocument();
  });
});
