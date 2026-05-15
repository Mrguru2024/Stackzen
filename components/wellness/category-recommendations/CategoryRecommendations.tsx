'use client';

import React from 'react';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import Progress from '@/components/ui/progress';
import { WellnessScore } from '@/lib/types/wellness';
import { _WELLNESS_CATEGORY_VALUES } from '@/lib/constants/wellness';
// import { generateCategoryRecommendations } from '@/lib/wellness-utils';
const generateCategoryRecommendations = () => [];

interface CategoryRecommendationsProps {
  scores: WellnessScore[];
  className?: string;
}

const _CATEGORY_COLORS = {
  income: '#4AE66C',
  savings: '#5E2DEB',
  debt: '#FF4B4B',
  emergency: '#F79C42',
  investments: '#00B4D8',
  goals: '#9D4EDD',
};

export default function CategoryRecommendations({
  scores,
  className = '',
}: CategoryRecommendationsProps) {
  const latestScore = scores[scores.length - 1] || { categoryScores: {} };
  const _recommendations = generateCategoryRecommendations(latestScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="p-6">
        <h3 className="mb-6 text-lg font-semibold">Category Insights</h3>
        <div className="space-y-6">
          {_WELLNESS_CATEGORY_VALUES.map((category, index) => {
            const _score = latestScore.categoryScores[category];
            const _categoryRecs = _recommendations[category];
            const _color = _CATEGORY_COLORS[category as keyof typeof _CATEGORY_COLORS];

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="mr-2 h-3 w-3 rounded-full"
                      style={{ backgroundColor: _color }}
                    />
                    <h4 className="font-medium capitalize">{category}</h4>
                  </div>
                  <span className="text-sm font-medium">{_score}%</span>
                </div>
                <Progress
                  value={_score}
                  className="h-2"
                  style={
                    {
                      backgroundColor: `${_color}20`,
                      '--progress-foreground': _color,
                    } as any
                  }
                />
                <div className="space-y-2">
                  {_categoryRecs.map((rec, i) => (
                    <div key={i} className="flex items-start text-sm text-muted-foreground">
                      <span className="mr-2 mt-1">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
