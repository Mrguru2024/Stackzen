'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { WellnessScore } from '@/lib/types/wellness';
import { _WELLNESS_CATEGORY_VALUES } from '@/lib/constants/wellness';

interface CategoryTrendsProps {
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

export function CategoryTrends({ scores, className = '' }: CategoryTrendsProps) {
  const _chartData = useMemo(() => {
    return scores.map(score => ({
      date: new Date(score.timestamp).toLocaleDateString(),
      ...score.categoryScores,
    }));
  }, [scores]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Category Trends</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={_chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-sm text-muted-foreground"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                domain={[0, 100]}
                className="text-sm text-muted-foreground"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Legend />
              {_WELLNESS_CATEGORY_VALUES.map(category => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={_CATEGORY_COLORS[category as keyof typeof _CATEGORY_COLORS]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
          {_WELLNESS_CATEGORY_VALUES.map(category => (
            <div key={category} className="flex items-center">
              <div
                className="mr-2 h-3 w-3 rounded-full"
                style={{
                  backgroundColor: _CATEGORY_COLORS[category as keyof typeof _CATEGORY_COLORS],
                }}
              />
              <span className="text-sm capitalize">{category}</span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
