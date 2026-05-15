import React from 'react';
import { render, screen } from '@testing-library/react';
import WellnessHistory from './WellnessHistory.tsx';
import { WellnessScore } from '@/lib/types/wellness';

// Mock recharts to avoid canvas issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('WellnessHistory', () => {
  const mockScores: WellnessScore[] = [
    {
      id: '1',
      userId: 'user1',
      totalScore: 85,
      status: 'good',
      color: '#5E2DEB',
      description: 'Good financial health',
      timestamp: new Date('2024-01-01').toISOString(),
      categoryScores: {},
      recommendations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'user1',
      totalScore: 90,
      status: 'excellent',
      color: '#4AE66C',
      description: 'Excellent financial health',
      timestamp: new Date('2024-02-01').toISOString(),
      categoryScores: {},
      recommendations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('renders the component with title', () => {
    render(<WellnessHistory scores={mockScores} />);
    expect(screen.getByText('Wellness Score History')).toBeInTheDocument();
  });

  it('renders status indicators', () => {
    render(<WellnessHistory scores={mockScores} />);
    expect(screen.getByText('excellent')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
    expect(screen.getByText('fair')).toBeInTheDocument();
    expect(screen.getByText('at-risk')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<WellnessHistory scores={mockScores} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with empty scores array', () => {
    render(<WellnessHistory scores={[]} />);
    expect(screen.getByText('Wellness Score History')).toBeInTheDocument();
  });
});
