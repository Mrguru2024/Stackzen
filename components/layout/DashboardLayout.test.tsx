import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardLayout from './DashboardLayout.tsx';
import Sidebar from '../Sidebar';
import '@testing-library/jest-dom';
import { SessionProvider } from 'next-auth/react';

const _mockSession = {
  data: {
    user: {
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    },
  },
  status: 'authenticated',
};

const renderWithSession = ui => render(ui);

describe('DashboardLayout', () => {
  it('renders children', () => {
    renderWithSession(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithSession(
      <DashboardLayout>
        <div />
      </DashboardLayout>
    );
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Challenges')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('opens and closes the mobile sidebar', () => {
    renderWithSession(
      <DashboardLayout>
        <div />
      </DashboardLayout>
    );
    // Open sidebar
    const openBtn = screen.getByLabelText('Open sidebar');
    fireEvent.click(openBtn);
    expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
    // Close sidebar
    const closeBtn = screen.getByLabelText('Close sidebar');
    fireEvent.click(closeBtn);
    expect(screen.queryByLabelText('Close sidebar')).not.toBeInTheDocument();
  });
});
