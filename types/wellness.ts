export interface WellnessScore {
  category: string;
  score: number;
  maxScore: number;
}

export interface WellnessRecommendation {
  category: string;
  title: string;
  description: string;
  actions: string[];
}

export interface WellnessData {
  wellnessScores: WellnessScore[];
  recommendations: WellnessRecommendation[];
}
