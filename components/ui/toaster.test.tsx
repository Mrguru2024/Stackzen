import React from 'react';
import { render, screen } from '@testing-library/react';
import { Toaster } from './toaster.tsx';
import { ToastProvider } from './toast.tsx';
import { ToastProvider } from './toast';
import { Toaster } from './toaster';

describe('Toaster', () => {
  it('renders without crashing', () => {
    render(
      <ToastProvider>
        <Toaster />
      </ToastProvider>
    );
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('renders with custom position', () => {
    render(
      <ToastProvider>
        <Toaster position="top-right" />
      </ToastProvider>
    );
    const toaster = screen.getByTestId('toaster');
    expect(toaster).toHaveClass('top-0', 'right-0');
  });

  it('renders with custom duration', () => {
    render(
      <ToastProvider>
        <Toaster duration={5000} />
      </ToastProvider>
    );
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });
});
