export type IncomeSource = 'job' | 'contract' | 'business' | 'student' | 'unemployed' | 'other';

export type IncomeRange =
  | 'under_1000'
  | '1000_2999'
  | '3000_4999'
  | '5000_7499'
  | '7500_plus'
  | 'prefer_not_to_say';

export type Lifestyle = 'comfortable' | 'stable' | 'struggling' | 'rebuilding' | 'growing';

export type TrackingMethod = 'manual' | 'app' | 'want_to' | 'not_interested';

export type FinancialGoal =
  | 'build_savings'
  | 'eliminate_debt'
  | 'buy_home_vehicle'
  | 'fund_business'
  | 'travel_lifestyle'
  | 'retirement'
  | 'improve_credit'
  | 'invest_wealth'
  | 'survive';

export type FinancialMindset =
  | 'cautious'
  | 'want_to_grow'
  | 'risk_taker'
  | 'overwhelmed'
  | 'disciplined';

export type DebtType =
  | 'credit_cards'
  | 'student_loans'
  | 'personal_loans'
  | 'car_loan'
  | 'medical_bills'
  | 'business_debt'
  | 'none';

export type DebtRange =
  | 'under_1000'
  | '1000_4999'
  | '5000_9999'
  | '10000_24999'
  | '25000_plus'
  | 'prefer_not_to_say';

export type SpendingChallenge =
  | 'groceries'
  | 'housing'
  | 'subscriptions'
  | 'eating_out'
  | 'transportation'
  | 'online_shopping'
  | 'other';

export type GuidanceTone = 'encouraging' | 'direct' | 'gentle' | 'mixed';

export type AccountabilityLevel =
  | 'reminders'
  | 'guidance_alerts'
  | 'full_partner'
  | 'explore_alone';

export type MentorPreference = 'yes_asap' | 'maybe_later' | 'ai_only' | 'already_working';

export type InteractionFrequency = 'daily' | 'weekly' | 'biweekly' | 'on_login' | 'goal_based';

export type ResourcePreference = 'yes' | 'no' | 'verified_only';

export interface OnboardingData {
  // Personal & Lifestyle
  incomeSource: IncomeSource;
  incomeRange: IncomeRange;
  lifestyle: Lifestyle;
  trackingMethod: TrackingMethod;
  financialGoals: FinancialGoal[];
  financialMindset: FinancialMindset;

  // Debt & Spending
  debtTypes: DebtType[];
  debtRange: DebtRange;
  spendingChallenge?: SpendingChallenge;

  // AI & Human Experience
  guidanceTone: GuidanceTone;
  accountabilityLevel: AccountabilityLevel;
  mentorPreference: MentorPreference;
  currentStruggle?: string;
  breakthroughGoal?: string;

  // Smart Logic Setup
  interactionFrequency: InteractionFrequency;
  resourcePreference: ResourcePreference;
  personalPartnerFeedback?: string;

  // Additional fields
  otherIncomeSource?: string;
  otherSpendingChallenge?: string;
  mentorContact?: string;
}
