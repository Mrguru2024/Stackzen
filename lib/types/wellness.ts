export interface ScoreCategory {
  id: string;
  name: string;
  maxScore: number;
}

export interface ScoreRange {
  min: number;
  max: number;
  status: 'At Risk' | 'Improving' | 'Stable' | 'Excellent';
  color: string;
  description: string;
}

export interface IncomeData {
  sources: Array<{
    name: string;
    amount: number;
    frequency: 'monthly' | 'weekly' | 'biweekly' | 'annually';
  }>;
  allocation: {
    needs: number;
    savings: number;
    investments: number;
    needsTarget?: number;
    savingsTarget?: number;
    investmentsTarget?: number;
  };
  monthsWithIncome?: number;
}

export interface SavingsData {
  rate: number;
  totalSavings: number;
  monthlyIncome: number;
}

export interface DebtData {
  totalDebt: number;
  monthlyPayments: number;
  monthlyIncome: number;
}

export interface EmergencyFund {
  months: number;
}

export interface InvestmentData {
  growthRate: number;
  diversification: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: Date;
  category: string;
  status: 'active' | 'completed' | 'abandoned';
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  name: string;
  percentage: number;
}

export interface WellnessScore {
  totalScore: number;
  status: ScoreRange['status'];
  color: string;
  description: string;
  categoryScores: Record<string, CategoryScore>;
  timestamp: string;
}

export interface UserFinancialData {
  incomeData: IncomeData;
  savingsData: SavingsData;
  debtData: DebtData;
  emergencyFund: EmergencyFund;
  investmentData: InvestmentData;
  goals: FinancialGoal[];
}

export interface WellnessScorecardProps {
  userData: UserFinancialData;
  onScoreUpdate?: (score: WellnessScore) => void;
  showRecommendations?: boolean;
  showHistory?: boolean;
  className?: string;
}

export interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }>;
}
