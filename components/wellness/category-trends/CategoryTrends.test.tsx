import React from 'react';
import { render, screen } from '@testing-library/react';
import { CategoryTrends } from './CategoryTrends';
import { _WELLNESS_CATEGORIES } from '@/lib/constants';

// Mock recharts to avoid canvas issues in tests
jest.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ dataKey }: { dataKey: string }) => <div data-testid={`bar-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

const mockScores = [{ timestamp: Date.now(), categoryScores: { Savings: 80, Spending: 60 } }];

describe('CategoryTrends', () => {
  const mockData = _WELLNESS_CATEGORIES.map(category => ({
    category,
    value: Math.random() * 100,
  }));

  it('renders the chart with data', () => {
    render(<CategoryTrends data={mockData} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders bars for each category', () => {
    render(<CategoryTrends data={mockData} />);

    mockData.forEach(item => {
      expect(screen.getByTestId(`bar-${item.category}`)).toBeInTheDocument();
    });
  });

  it('renders empty state when no data', () => {
    render(<CategoryTrends data={[]} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });
});
