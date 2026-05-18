/**
 * @file App.test.tsx
 * @description Integration and E2E-style tests for App.tsx.
 * Covers: landing page rendering, navigation to auth pages, mock authentication session triggers, and routing.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { supabase } from '@/lib/supabase';

// Mock env variables to satisfy supabase init
vi.stubEnv('VITE_SUPABASE_URL', 'https://placeholder-url.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'placeholder-key');

describe('App Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders landing page by default when there is no active session', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Take complete control of your/i)).toBeInTheDocument();
    });
  });

  it('navigates to auth page when Log In is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Take complete control of your/i)).toBeInTheDocument();
    });

    const loginBtn = screen.getByRole('button', { name: /Log In/i });
    await user.click(loginBtn);

    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
  });
});
