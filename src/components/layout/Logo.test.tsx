import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from './Logo';

/**
 * @file Logo.test.tsx
 * @description Tests for the Logo component.
 * Covers: rendering without crashing, displaying the logo text.
 */

describe('Logo Component', () => {
  it('renders correctly', () => {
    render(<Logo />);
    expect(screen.getByText(/CORE/i)).toBeInTheDocument();
    expect(screen.getByText(/CONTROL/i)).toBeInTheDocument();
  });
});
