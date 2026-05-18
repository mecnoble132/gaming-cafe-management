/**
 * @file PrivacyPage.test.tsx
 * @description Tests for the PrivacyPage component.
 * Covers: rendering privacy policies, data collection notices, rights under GDPR/DPDP, and triggering onBack.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import PrivacyPage from './PrivacyPage';

const mockBack = vi.fn();

describe('PrivacyPage Component', () => {
  it('renders Privacy Policy content correctly', () => {
    render(<PrivacyPage onBack={mockBack} />);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText(/Data We Collect About Cafe Owners/i)).toBeInTheDocument();
    expect(screen.getByText(/Data About End Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Rights/i)).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<PrivacyPage onBack={mockBack} />);

    const backBtn = screen.getByRole('button', { name: /Back/i });
    await user.click(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });
});
