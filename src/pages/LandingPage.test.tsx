/**
 * @file LandingPage.test.tsx
 * @description Tests for the LandingPage component.
 * Covers: rendering landing content, CTA buttons, routing callback triggers (Log In, Start Free Trial).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LandingPage from './LandingPage';

const mockStart = vi.fn();
const mockShowTerms = vi.fn();
const mockShowPrivacy = vi.fn();

describe('LandingPage Component', () => {
  it('renders landing page hero and core elements', () => {
    render(
      <LandingPage
        onStart={mockStart}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );
    expect(screen.getByText(/Stop juggling spreadsheets/i)).toBeInTheDocument();
    expect(screen.getByText(/Simple, transparent pricing/i)).toBeInTheDocument();
  });

  it('calls onStart(false) when Log In button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LandingPage
        onStart={mockStart}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );

    const loginBtn = screen.getByRole('button', { name: /Log In/i });
    await user.click(loginBtn);
    expect(mockStart).toHaveBeenCalledWith(false);
  });

  it('calls onStart(true) when Start Free Trial button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LandingPage
        onStart={mockStart}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );

    const trialBtn = screen.getAllByRole('button', { name: /Start Free Trial|Start Your Free Trial|Start 7-Day Free Trial/i })[0];
    await user.click(trialBtn);
    expect(mockStart).toHaveBeenCalledWith(true);
  });

  it('calls onShowTerms when Terms of Service link in footer is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LandingPage
        onStart={mockStart}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );

    const termsBtn = screen.getByRole('button', { name: /Terms of Service/i });
    await user.click(termsBtn);
    expect(mockShowTerms).toHaveBeenCalled();
  });

  it('calls onShowPrivacy when Privacy Policy link in footer is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LandingPage
        onStart={mockStart}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );

    const privacyBtn = screen.getByRole('button', { name: /Privacy Policy/i });
    await user.click(privacyBtn);
    expect(mockShowPrivacy).toHaveBeenCalled();
  });
});
