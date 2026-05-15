export interface FinancialScore {
  id: string;
  userId: string;
  score: number;
  categoryScores: {
    income: number;
    savings: number;
    debt: number;
    emergency: number;
    investments: number;
    goals: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  category: keyof FinancialScore['categoryScores'];
  name: string;
  target: number;
  current: number;
  deadline: Date;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface SpendingGuardrail {
  id: string;
  userId: string;
  category: string;
  limit: number;
  current: number;
  period: 'daily' | 'weekly' | 'monthly';
  notifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialAssessment {
  id: string;
  userId: string;
  score: number;
  categories: {
    income: {
      score: number;
      metrics: {
        stability: number;
        growth: number;
        diversity: number;
      };
    };
    savings: {
      score: number;
      metrics: {
        emergency: number;
        retirement: number;
        shortTerm: number;
      };
    };
    debt: {
      score: number;
      metrics: {
        utilization: number;
        payments: number;
        types: number;
      };
    };
    investments: {
      score: number;
      metrics: {
        diversification: number;
        returns: number;
        risk: number;
      };
    };
  };
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}
