import {
  UserFinancialData,
  WellnessScore,
  Recommendation,
  ScoreCategory,
  ScoreRange,
} from '../types/wellness.ts';

const SCORE_CATEGORIES: Record<string, ScoreCategory> = {
  INCOME_MANAGEMENT: { id: 'income', name: 'Income Management', maxScore: 20 },
  SAVINGS_RATE: { id: 'savings', name: 'Savings Rate', maxScore: 20 },
  DEBT_MANAGEMENT: { id: 'debt', name: 'Debt Management', maxScore: 20 },
  EMERGENCY_FUND: { id: 'emergency', name: 'Emergency Fund', maxScore: 15 },
  INVESTMENT_STRATEGY: {
    id: 'investments',
    name: 'Investment Growth',
    maxScore: 15,
  },
  FINANCIAL_GOALS: { id: 'goals', name: 'Goal Progress', maxScore: 10 },
};

const SCORE_RANGES: ScoreRange[] = [
  {
    min: 0,
    max: 40,
    status: 'At Risk',
    color: '#e53e3e',
    description:
      'Your financial wellness needs immediate attention. Focus on building a strong foundation.',
  },
  {
    min: 41,
    max: 60,
    status: 'Improving',
    color: '#f6ad55',
    description: "You're on the right track, but there's room for improvement in key areas.",
  },
  {
    min: 61,
    max: 80,
    status: 'Stable',
    color: '#4299e1',
    description: 'Your finances are stable. Focus on optimization and growth strategies.',
  },
  {
    min: 81,
    max: 100,
    status: 'Excellent',
    color: '#48bb78',
    description:
      'Excellent financial wellness! Continue your current strategies and consider wealth building.',
  },
];

export function calculateWellnessScore(userData: UserFinancialData): WellnessScore {
  const { incomeData, savingsData, debtData, emergencyFund, investmentData, goals } = userData;

  // Calculate individual category scores
  const incomeScore = calculateIncomeScore(incomeData);
  const savingsScore = calculateSavingsScore(savingsData);
  const debtScore = calculateDebtScore(debtData);
  const emergencyScore = calculateEmergencyScore(emergencyFund);
  const investmentScore = calculateInvestmentScore(investmentData);
  const goalsScore = calculateGoalsScore(goals);

  // Calculate total score (out of 100)
  const scores = {
    [SCORE_CATEGORIES.INCOME_MANAGEMENT.id]: {
      score: incomeScore,
      maxScore: SCORE_CATEGORIES.INCOME_MANAGEMENT.maxScore,
      name: SCORE_CATEGORIES.INCOME_MANAGEMENT.name,
      percentage: (incomeScore / SCORE_CATEGORIES.INCOME_MANAGEMENT.maxScore) * 100,
    },
    [SCORE_CATEGORIES.SAVINGS_RATE.id]: {
      score: savingsScore,
      maxScore: SCORE_CATEGORIES.SAVINGS_RATE.maxScore,
      name: SCORE_CATEGORIES.SAVINGS_RATE.name,
      percentage: (savingsScore / SCORE_CATEGORIES.SAVINGS_RATE.maxScore) * 100,
    },
    [SCORE_CATEGORIES.DEBT_MANAGEMENT.id]: {
      score: debtScore,
      maxScore: SCORE_CATEGORIES.DEBT_MANAGEMENT.maxScore,
      name: SCORE_CATEGORIES.DEBT_MANAGEMENT.name,
      percentage: (debtScore / SCORE_CATEGORIES.DEBT_MANAGEMENT.maxScore) * 100,
    },
    [SCORE_CATEGORIES.EMERGENCY_FUND.id]: {
      score: emergencyScore,
      maxScore: SCORE_CATEGORIES.EMERGENCY_FUND.maxScore,
      name: SCORE_CATEGORIES.EMERGENCY_FUND.name,
      percentage: (emergencyScore / SCORE_CATEGORIES.EMERGENCY_FUND.maxScore) * 100,
    },
    [SCORE_CATEGORIES.INVESTMENT_STRATEGY.id]: {
      score: investmentScore,
      maxScore: SCORE_CATEGORIES.INVESTMENT_STRATEGY.maxScore,
      name: SCORE_CATEGORIES.INVESTMENT_STRATEGY.name,
      percentage: (investmentScore / SCORE_CATEGORIES.INVESTMENT_STRATEGY.maxScore) * 100,
    },
    [SCORE_CATEGORIES.FINANCIAL_GOALS.id]: {
      score: goalsScore,
      maxScore: SCORE_CATEGORIES.FINANCIAL_GOALS.maxScore,
      name: SCORE_CATEGORIES.FINANCIAL_GOALS.name,
      percentage: (goalsScore / SCORE_CATEGORIES.FINANCIAL_GOALS.maxScore) * 100,
    },
  };

  const totalScore = Math.round(
    Object.values(scores).reduce((sum, category) => sum + category.score, 0)
  );

  // Determine status based on score range
  const statusRange =
    SCORE_RANGES.find(range => totalScore >= range.min && totalScore <= range.max) ||
    SCORE_RANGES[0];

  return {
    totalScore,
    status: statusRange.status,
    color: statusRange.color,
    description: statusRange.description,
    categoryScores: scores,
    timestamp: new Date().toISOString(),
  };
}

function calculateIncomeScore(incomeData: UserFinancialData['incomeData']): number {
  let score = 0;
  const { sources = [], allocation = {} } = incomeData;

  // Multiple income sources (up to 5 points)
  score += Math.min(sources.length * 2, 5);

  // Income allocation adherence to 40/30/30 or custom split (up to 10 points)
  const hasAllocation = allocation.needs && allocation.savings && allocation.investments;

  if (hasAllocation) {
    // Check if user is sticking to their allocation targets
    const allocTarget = {
      needs: allocation.needsTarget || 40,
      savings: allocation.savingsTarget || 30,
      investments: allocation.investmentsTarget || 30,
    };

    // Calculate deviation from targets (lower is better)
    const needsDev = Math.abs(allocation.needs - allocTarget.needs);
    const savingsDev = Math.abs(allocation.savings - allocTarget.savings);
    const investmentsDev = Math.abs(allocation.investments - allocTarget.investments);

    // Average deviation from target (0-100 scale)
    const avgDeviation = (needsDev + savingsDev + investmentsDev) / 3;

    // Convert to score (lower deviation = higher score)
    const deviationScore = Math.max(0, 10 - avgDeviation / 2);
    score += Math.round(deviationScore);
  }

  // Income stability (up to 5 points)
  if (incomeData.monthsWithIncome) {
    // The more months with consistent income, the better (up to 12 months)
    score += Math.min(Math.floor(incomeData.monthsWithIncome / 2.4), 5);
  }

  return Math.min(score, SCORE_CATEGORIES.INCOME_MANAGEMENT.maxScore);
}

function calculateSavingsScore(savingsData: UserFinancialData['savingsData']): number {
  let score = 0;
  const { rate = 0, totalSavings = 0, monthlyIncome = 0 } = savingsData;

  // Savings rate (up to 15 points)
  // 15% or higher is considered excellent
  if (rate >= 15) {
    score += 15;
  } else if (rate >= 10) {
    score += 10;
  } else if (rate >= 5) {
    score += 5;
  } else if (rate > 0) {
    score += 2;
  }

  // Total savings relative to monthly income (up to 5 points)
  if (monthlyIncome > 0 && totalSavings > 0) {
    // Calculate months of income saved
    const monthsOfIncomeSaved = totalSavings / monthlyIncome;

    if (monthsOfIncomeSaved >= 6) {
      score += 5;
    } else if (monthsOfIncomeSaved >= 3) {
      score += 3;
    } else if (monthsOfIncomeSaved >= 1) {
      score += 1;
    }
  }

  return Math.min(score, SCORE_CATEGORIES.SAVINGS_RATE.maxScore);
}

function calculateDebtScore(debtData: UserFinancialData['debtData']): number {
  let score = 0;
  const { totalDebt = 0, monthlyPayments = 0, monthlyIncome = 1 } = debtData;

  // Debt-to-income ratio (up to 10 points)
  const debtToIncomeRatio = monthlyPayments / monthlyIncome;
  if (debtToIncomeRatio <= 0.1) {
    score += 10;
  } else if (debtToIncomeRatio <= 0.2) {
    score += 7;
  } else if (debtToIncomeRatio <= 0.3) {
    score += 4;
  } else if (debtToIncomeRatio <= 0.4) {
    score += 2;
  }

  // Total debt relative to annual income (up to 10 points)
  const annualIncome = monthlyIncome * 12;
  const debtToAnnualIncome = totalDebt / annualIncome;
  if (debtToAnnualIncome <= 0.5) {
    score += 10;
  } else if (debtToAnnualIncome <= 1) {
    score += 7;
  } else if (debtToAnnualIncome <= 2) {
    score += 4;
  } else if (debtToAnnualIncome <= 3) {
    score += 2;
  }

  return Math.min(score, SCORE_CATEGORIES.DEBT_MANAGEMENT.maxScore);
}

function calculateEmergencyScore(emergencyFund: UserFinancialData['emergencyFund']): number {
  const { months = 0 } = emergencyFund;

  // Emergency fund coverage (up to 15 points)
  if (months >= 6) {
    return 15;
  } else if (months >= 4) {
    return 12;
  } else if (months >= 3) {
    return 10;
  } else if (months >= 2) {
    return 7;
  } else if (months >= 1) {
    return 4;
  }

  return 0;
}

function calculateInvestmentScore(investmentData: UserFinancialData['investmentData']): number {
  let score = 0;
  const { growthRate = 0, diversification = 0 } = investmentData;

  // Investment growth rate (up to 8 points)
  if (growthRate >= 10) {
    score += 8;
  } else if (growthRate >= 7) {
    score += 6;
  } else if (growthRate >= 5) {
    score += 4;
  } else if (growthRate >= 3) {
    score += 2;
  }

  // Portfolio diversification (up to 7 points)
  if (diversification >= 0.8) {
    score += 7;
  } else if (diversification >= 0.6) {
    score += 5;
  } else if (diversification >= 0.4) {
    score += 3;
  } else if (diversification >= 0.2) {
    score += 1;
  }

  return Math.min(score, SCORE_CATEGORIES.INVESTMENT_STRATEGY.maxScore);
}

function calculateGoalsScore(goals: UserFinancialData['goals']): number {
  if (!goals.length) return 0;

  // Calculate average progress across all active goals
  const activeGoals = goals.filter(goal => goal.status === 'active');
  if (!activeGoals.length) return 0;

  const totalProgress = activeGoals.reduce((sum, goal) => {
    const progress = (goal.current / goal.target) * 100;
    return sum + progress;
  }, 0);

  const averageProgress = totalProgress / activeGoals.length;

  // Convert progress to score (up to 10 points)
  if (averageProgress >= 80) {
    return 10;
  } else if (averageProgress >= 60) {
    return 8;
  } else if (averageProgress >= 40) {
    return 6;
  } else if (averageProgress >= 20) {
    return 4;
  } else if (averageProgress > 0) {
    return 2;
  }

  return 0;
}

export function generateRecommendations(score: WellnessScore): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Income Management recommendations
  if (score.categoryScores.income.percentage < 70) {
    recommendations.push({
      category: 'income',
      title: 'Optimize Income Allocation',
      description:
        'Your income allocation could be better balanced. Consider following the 40/30/30 rule or your custom allocation targets.',
      priority: 'high',
      actionItems: [
        'Review your current spending patterns',
        'Set up automatic transfers for savings and investments',
        'Track your allocation adherence monthly',
      ],
    });
  }

  // Savings Rate recommendations
  if (score.categoryScores.savings.percentage < 70) {
    recommendations.push({
      category: 'savings',
      title: 'Increase Savings Rate',
      description: 'Your savings rate could be improved. Aim for at least 15% of your income.',
      priority: 'high',
      actionItems: [
        'Set up automatic transfers to savings',
        'Review monthly expenses for savings opportunities',
        'Consider a high-yield savings account',
      ],
    });
  }

  // Debt Management recommendations
  if (score.categoryScores.debt.percentage < 70) {
    recommendations.push({
      category: 'debt',
      title: 'Reduce Debt Burden',
      description:
        'Your debt-to-income ratio could be improved. Focus on reducing high-interest debt first.',
      priority: 'high',
      actionItems: [
        'Create a debt payoff plan',
        'Consider debt consolidation if applicable',
        'Avoid taking on new debt',
      ],
    });
  }

  // Emergency Fund recommendations
  if (score.categoryScores.emergency.percentage < 70) {
    recommendations.push({
      category: 'emergency',
      title: 'Build Emergency Fund',
      description: 'Your emergency fund could be stronger. Aim for 3-6 months of expenses.',
      priority: 'high',
      actionItems: [
        'Set a monthly savings target for emergency fund',
        'Keep emergency funds in a separate account',
        'Consider a high-yield savings account for emergency funds',
      ],
    });
  }

  // Investment Strategy recommendations
  if (score.categoryScores.investments.percentage < 70) {
    recommendations.push({
      category: 'investments',
      title: 'Improve Investment Strategy',
      description:
        'Your investment strategy could be optimized. Focus on diversification and long-term growth.',
      priority: 'medium',
      actionItems: [
        'Review your asset allocation',
        'Consider index funds for better diversification',
        'Rebalance portfolio if needed',
      ],
    });
  }

  // Financial Goals recommendations
  if (score.categoryScores.goals.percentage < 70) {
    recommendations.push({
      category: 'goals',
      title: 'Accelerate Goal Progress',
      description:
        'Your financial goals could use more attention. Break down large goals into smaller milestones.',
      priority: 'medium',
      actionItems: [
        'Review and update your goals',
        'Set up automatic contributions to goal accounts',
        'Track progress monthly',
      ],
    });
  }

  return recommendations;
}
