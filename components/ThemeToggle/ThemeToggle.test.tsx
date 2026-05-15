import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from './index';
import { ThemeProvider } from '@/components/theme-provider';

describe('ThemeToggle (re-export)', () => {
  it('renders dropdown trigger', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeToggle />
      </ThemeProvider>
    );
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });
});
