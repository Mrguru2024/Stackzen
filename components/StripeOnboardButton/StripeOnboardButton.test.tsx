import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StripeOnboardButton from './index';

// Mock fetch
global.fetch = jest.fn();

describe('StripeOnboardButton', () => {
  const _mockUserId = 'test-user-id';
  const _mockOnboardingUrl = 'https://connect.stripe.com/setup/s/test';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the button with correct text', () => {
    render(<StripeOnboardButton userId={_mockUserId} />);
    expect(screen.getByText('Connect Stripe Account')).toBeInTheDocument();
  });

  it('shows loading state when clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: _mockOnboardingUrl }),
    });

    render(<StripeOnboardButton userId={_mockUserId} />);
    const button = screen.getByText('Connect Stripe Account');

    fireEvent.click(button);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('redirects to Stripe onboarding URL on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: _mockOnboardingUrl }),
    });

    const _originalLocation = window.location;
    delete window.location;
    window.location = { href: '' } as any;

    render(<StripeOnboardButton userId={_mockUserId} />);
    const button = screen.getByText('Connect Stripe Account');

    fireEvent.click(button);

    await waitFor(() => {
      expect(window.location.href).toBe(_mockOnboardingUrl);
    });

    window.location = _originalLocation;
  });

  it('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const _consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<StripeOnboardButton userId={_mockUserId} />);
    const button = screen.getByText('Connect Stripe Account');

    fireEvent.click(button);

    await waitFor(() => {
      expect(_consoleSpy).toHaveBeenCalled();
      expect(screen.getByText('Connect Stripe Account')).toBeInTheDocument();
    });

    _consoleSpy.mockRestore();
  });
});
