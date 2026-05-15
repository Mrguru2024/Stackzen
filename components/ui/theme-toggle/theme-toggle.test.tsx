import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from './index';
import { ThemeProvider } from '@/components/theme-provider';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {ui}
    </ThemeProvider>
  );
}

describe('ThemeToggle', () => {
  it('renders dropdown trigger (Radix menu content is portal-mounted; covered in E2E)', () => {
    renderWithTheme(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });
});
