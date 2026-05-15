import React from 'react';
import { render, screen } from '@testing-library/react';
import FinancialAssessmentScorecard from './FinancialAssessmentScorecard';

const mockAssessment = {
  overallScore: 75,
  categories: {
    income: {
      score: 80,
      metrics: { stability: 85, growth: 75, diversity: 80 },
    },
    savings: {
      score: 70,
      metrics: { emergency: 65, retirement: 75, shortTerm: 70 },
    },
    debt: {
      score: 65,
      metrics: { utilization: 70, payments: 60, types: 65 },
    },
    investments: {
      score: 85,
      metrics: { diversification: 90, returns: 80, risk: 85 },
    },
  },
  recommendations: [
    'Increase emergency fund to 6 months of expenses',
    'Diversify income sources',
    'Review investment portfolio allocation',
  ],
};

describe('FinancialAssessmentScorecard', () => {
  it('renders overall score', () => {
    render(<FinancialAssessmentScorecard assessment={mockAssessment} />);
    // There may be multiple elements with the score value, so check that at least one exists
    const elements = screen.getAllByText('75');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders category scores', () => {
    render(<FinancialAssessmentScorecard assessment={mockAssessment} />);
    const incomeScores = screen.getAllByText('80');
    expect(incomeScores[0]).toBeInTheDocument(); // income score
    const savingsScores = screen.getAllByText('70');
    expect(savingsScores[0]).toBeInTheDocument(); // savings score
    const debtScores = screen.getAllByText('65');
    expect(debtScores[0]).toBeInTheDocument(); // debt score
    const investmentScores = screen.getAllByText('85');
    expect(investmentScores[0]).toBeInTheDocument(); // investments score
  });

  it('renders recommendations', () => {
    render(<FinancialAssessmentScorecard assessment={mockAssessment} />);
    mockAssessment.recommendations.forEach(recommendation => {
      const elements = screen.getAllByText((content, node) =>
        node?.textContent?.includes(recommendation)
      );
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('renders metrics for each category', () => {
    render(<FinancialAssessmentScorecard assessment={mockAssessment} />);

    // Check income metrics
    expect(screen.getByText('stability')).toBeInTheDocument();
    const stabilityScores = screen.getAllByText('85');
    expect(stabilityScores[0]).toBeInTheDocument();

    // Check savings metrics
    expect(screen.getByText('emergency')).toBeInTheDocument();
    const emergencyScores = screen.getAllByText('65');
    expect(emergencyScores[0]).toBeInTheDocument();

    // Check debt metrics
    expect(screen.getByText('utilization')).toBeInTheDocument();
    const utilizationScores = screen.getAllByText('70');
    expect(utilizationScores[0]).toBeInTheDocument();

    // Check investment metrics
    expect(screen.getByText('diversification')).toBeInTheDocument();
    const diversificationScores = screen.getAllByText('90');
    expect(diversificationScores[0]).toBeInTheDocument();
  });
});
