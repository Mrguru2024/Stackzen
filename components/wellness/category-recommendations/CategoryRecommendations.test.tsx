import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryRecommendations from './index';
import { _WELLNESS_CATEGORY_VALUES } from '@/lib/constants/wellness';

const mockScores = [{ timestamp: Date.now(), categoryScores: { Savings: 80, Spending: 60 } }];

describe('CategoryRecommendations', () => {
  it('renders recommendations for each category', () => {
    render(<CategoryRecommendations scores={mockScores} />);

    _WELLNESS_CATEGORY_VALUES.forEach(category => {
      expect(screen.getByText(new RegExp(category, 'i'))).toBeInTheDocument();
    });
  });

  it('handles empty scores array', () => {
    render(<CategoryRecommendations scores={[]} />);
    // The component may render nothing or a fallback UI; adjust as needed
    // For now, just check that it does not crash
    expect(screen.queryByText(/category insights/i)).not.toBeInTheDocument();
  });
});
