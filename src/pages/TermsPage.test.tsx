/**
 * @file TermsPage.test.tsx
 * @description Tests for the TermsPage component.
 * Covers: rendering legally accurate clauses, and triggering onBack when Back is clicked.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TermsPage from './TermsPage';

const mockBack = vi.fn();

describe('TermsPage Component', () => {
  it('renders Terms of Service content correctly', () => {
    render(<TermsPage onBack={mockBack} />);
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText(/Who the agreement is with/i)).toBeInTheDocument();
    expect(screen.getByText(/Warranty Disclaimer/i)).toBeInTheDocument();
    expect(screen.getByText(/Limitation of Liability/i)).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<TermsPage onBack={mockBack} />);

    const backBtn = screen.getByRole('button', { name: /Back/i });
    await user.click(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });
});
