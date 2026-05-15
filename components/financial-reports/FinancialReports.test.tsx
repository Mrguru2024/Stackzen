import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        financialReports: [
          { id: 1, name: 'Monthly Report', date: '2023-01-01' },
          { id: 2, name: 'Annual Report', date: '2023-01-02' },
        ],
      }),
    },
  },
}));
import FinancialReports from './index.tsx';
describe('FinancialReports', () => {
  it('renders report summary and breakdown', async () => {
    render(<FinancialReports />);
    expect(await screen.findByText(/Financial Reports/i)).toBeInTheDocument();
    expect(screen.getByText('Total Reports: 2')).toBeInTheDocument();
    expect(screen.getByText('Monthly Report - 2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('Annual Report - 2023-01-02')).toBeInTheDocument();
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });
  it('shows empty state if no reports', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { user: { findFirst: jest.fn().mockResolvedValue({ financialReports: [] }) } },
    }));
    render(<FinancialReports />);
    expect(await screen.findByText(/No reports yet/i)).toBeInTheDocument();
  });
});
