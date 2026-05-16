'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import Progress from '@/components/ui/progress';
import { FinancialAssessment } from '@/lib/types/financial-wellness';

interface FinancialAssessmentScorecardProps {
  assessment: FinancialAssessment;
  className?: string;
}

const CATEGORY_COLORS = {
  income: '#4AE66C',
  savings: '#5E2DEB',
  debt: '#FF4B4B',
  investments: '#00B4D8',
};

const mockAssessment = {
  overallScore: 75,
  categoryScores: {
    income: 80,
    savings: 70,
    stability: 85,
  },
  recommendations: [
    'Increase emergency fund to 6 months of expenses',
    'Diversify income sources',
    'Review investment portfolio allocation',
  ],
};

export default function FinancialAssessmentScorecard({
  assessment,
  className = '',
}: FinancialAssessmentScorecardProps) {
  const categories = Object.entries(assessment.categories);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold">Financial Health Score</h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold" style={{ color: getScoreColor(assessment.score) }}>
              {assessment.score}
            </div>
            <div className="flex-1">
              <Progress value={assessment.score} className="h-2" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map(([category, data]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium capitalize">{category}</h4>
                <span
                  className="text-sm"
                  style={{ color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }}
                >
                  {data.score}
                </span>
              </div>
              <Progress
                value={data.score}
                className="h-2"
                style={
                  {
                    backgroundColor: `${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}20`,
                    '--progress-foreground':
                      CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
                  } as any
                }
              />
              <div className="mt-2 grid grid-cols-3 gap-2">
                {Object.entries(data.metrics).map(([metric, value]) => (
                  <div key={metric} className="text-sm">
                    <div className="capitalize text-muted-foreground">{metric}</div>
                    <div className="font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {assessment.recommendations.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-2 font-medium">Recommendations</h4>
            <ul className="space-y-2">
              {assessment.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#4AE66C';
  if (score >= 60) return '#F79C42';
  return '#FF4B4B';
}
