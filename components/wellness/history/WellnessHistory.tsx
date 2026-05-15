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
} from 'recharts';
import { Card } from '@/components/ui/card';
import { WellnessScore } from '@/lib/types/wellness';

interface WellnessHistoryProps {
  scores: WellnessScore[];
  className?: string;
}

export default function WellnessHistory({ scores, className = '' }: WellnessHistoryProps) {
  const _chartData = useMemo(() => {
    return scores.map(score => ({
      date: new Date(score.timestamp).toLocaleDateString(),
      score: score.totalScore,
      status: score.status,
    }));
  }, [scores]);

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return '#4AE66C';
      case 'good':
        return '#5E2DEB';
      case 'fair':
        return '#F79C42';
      case 'at-risk':
        return '#FF4B4B';
      default:
        return '#5E2DEB';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Wellness Score History</h3>
        <div className="h-[300px]">
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
              <Line
                type="monotone"
                dataKey="score"
                stroke={_getStatusColor(_chartData[0]?.status)}
                strokeWidth={2}
                dot={{
                  fill: 'var(--background)',
                  stroke: _getStatusColor(_chartData[0]?.status),
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: _getStatusColor(_chartData[0]?.status),
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center space-x-4">
          {['excellent', 'good', 'fair', 'at-risk'].map(status => (
            <div key={status} className="flex items-center">
              <div
                className="mr-2 h-3 w-3 rounded-full"
                style={{ backgroundColor: _getStatusColor(status) }}
              />
              <span className="text-sm capitalize">{status}</span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
