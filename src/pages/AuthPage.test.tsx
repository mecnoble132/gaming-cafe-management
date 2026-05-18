/**
 * @file AuthPage.test.tsx
 * @description Tests for the AuthPage component.
 * Covers: Login flow, Sign up flow, toggle sign in / sign up, terms validation, back navigation, Terms/Privacy callbacks.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AuthPage from './AuthPage';

// Mock env vars to satisfy supabase init
vi.stubEnv('VITE_SUPABASE_URL', 'https://placeholder-url.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'placeholder-key');

const mockBack = vi.fn();
const mockShowTerms = vi.fn();
const mockShowPrivacy = vi.fn();

describe('AuthPage Component', () => {
  it('renders Welcome Back form by default', () => {
    render(
      <AuthPage
        initialIsSignUp={false}
        onBack={mockBack}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );
    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@cafe.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('renders Create Account form when initialIsSignUp is true', () => {
    render(
      <AuthPage
        initialIsSignUp={true}
        onBack={mockBack}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByText(/I agree to the/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeDisabled(); // Disables because terms unchecked
  });

  it('allows user to switch between sign in and sign up', async () => {
    const user = userEvent.setup();
    render(
      <AuthPage
        initialIsSignUp={false}
        onBack={mockBack}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Register your cafe/i });
    await user.click(toggleBtn);
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();

    const toggleBackBtn = screen.getByRole('button', { name: /Already have an account/i });
    await user.click(toggleBackBtn);
    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
  });

  it('enables the signup button only when terms are agreed to', async () => {
    const user = userEvent.setup();
    render(
      <AuthPage
        initialIsSignUp={true}
        onBack={mockBack}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );

    const signupBtn = screen.getByRole('button', { name: /Create Account/i });
    expect(signupBtn).toBeDisabled();

    const termsCheckbox = screen.getByRole('checkbox');
    await user.click(termsCheckbox);
    expect(signupBtn).toBeEnabled();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AuthPage
        initialIsSignUp={false}
        onBack={mockBack}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );

    const backBtn = screen.getByRole('button', { name: /Back/i });
    await user.click(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });

  it('calls onShowTerms when Terms link is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AuthPage
        initialIsSignUp={true}
        onBack={mockBack}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );

    const termsLink = screen.getByRole('button', { name: /Terms of Service/i });
    await user.click(termsLink);
    expect(mockShowTerms).toHaveBeenCalled();
  });

  it('calls onShowPrivacy when Privacy link is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AuthPage
        initialIsSignUp={true}
        onBack={mockBack}
        onShowTerms={mockShowTerms}
        onShowPrivacy={mockShowPrivacy}
      />
    );

    const privacyLink = screen.getByRole('button', { name: /Privacy Policy/i });
    await user.click(privacyLink);
    expect(mockShowPrivacy).toHaveBeenCalled();
  });
});
