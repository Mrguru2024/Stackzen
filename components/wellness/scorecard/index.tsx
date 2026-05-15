'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import {
  WellnessScorecardProps,
  WellnessScore,
  Recommendation,
  ChartData,
} from '@/lib/types/wellness';

// Register ChartJS components
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), {
  ssr: false,
});

export default function WellnessScorecard({
  userData,
  onScoreUpdate,
  showRecommendations = true,
  className = '',
}: WellnessScorecardProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  const calculatedScore = 75; // Default/mock value for testing

  useEffect(() => {
    if (showRecommendations) {
      const _recs = generateRecommendations(calculatedScore);
      setRecommendations(_recs);
    }

    const _chart = createChartData(calculatedScore);
    setChartData(_chart);

    onScoreUpdate?.(calculatedScore);
  }, [userData, showRecommendations, onScoreUpdate]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800 ${className}`}>
      {/* Score Overview */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col items-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative h-48 w-48">
            <Doughnut
              data={chartData}
              options={{
                cutout: '70%',
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: true },
                },
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="text-4xl font-bold"
                  style={{ color: chartData.datasets[0].backgroundColor[0] }}
                >
                  {chartData.datasets[0].data[0]}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {
                    SCORE_RANGES[Math.floor(((chartData.datasets[0].data[0] - 0) / 100) * 3)]
                      ?.status
                  }
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col justify-center">
          <h2 className="mb-4 text-2xl font-semibold">Financial Wellness Score</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {SCORE_RANGES[Math.floor(((chartData.datasets[0].data[0] - 0) / 100) * 3)]?.description}
          </p>
          <div className="space-y-2">
            {Object.entries(SCORE_CATEGORIES).map(([id, category]) => (
              <div key={id} className="flex items-center">
                <div className="w-32 text-sm">{category.name}</div>
                <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(chartData.datasets[0].data[Object.entries(SCORE_CATEGORIES).findIndex(([k, v]) => v.name === category.name) + 1] / category.maxScore) * 100}%`,
                      backgroundColor:
                        chartData.datasets[0].backgroundColor[
                          Object.entries(SCORE_CATEGORIES).findIndex(
                            ([k, v]) => v.name === category.name
                          ) + 1
                        ],
                    }}
                  />
                </div>
                <div className="w-12 text-right text-sm">
                  {
                    chartData.datasets[0].data[
                      Object.entries(SCORE_CATEGORIES).findIndex(
                        ([k, v]) => v.name === category.name
                      ) + 1
                    ]
                  }
                  /{category.maxScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-xl font-semibold">Recommendations</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700"
              >
                <div className="mb-2 flex items-center">
                  <span
                    className={`mr-2 h-2 w-2 rounded-full ${
                      rec.priority === 'high'
                        ? 'bg-red-500'
                        : rec.priority === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                  />
                  <h4 className="font-medium">{rec.title}</h4>
                </div>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                <ul className="space-y-1 text-sm">
                  {rec.actionItems.map((item, i) => (
                    <li key={i} className="flex items-center">
                      <span className="mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function _calculateWellnessScore(_: WellnessScorecardProps['userData']): WellnessScore {
  // Implementation will be moved to a separate utility file
  // This is a placeholder that returns a mock score
  return {
    totalScore: 75,
    status: 'Stable',
    color: '#4299e1',
    description: 'Your finances are stable. Focus on optimization and growth strategies.',
    categoryScores: {
      income: { score: 15, maxScore: 20, name: 'Income Management', percentage: 75 },
      savings: { score: 18, maxScore: 20, name: 'Savings Rate', percentage: 90 },
      debt: { score: 16, maxScore: 20, name: 'Debt Management', percentage: 80 },
      emergency: { score: 12, maxScore: 15, name: 'Emergency Fund', percentage: 80 },
      investments: { score: 10, maxScore: 15, name: 'Investment Growth', percentage: 67 },
      goals: { score: 4, maxScore: 10, name: 'Goal Progress', percentage: 40 },
    },
    timestamp: new Date().toISOString(),
  };
}

function generateRecommendations(_: WellnessScore): Recommendation[] {
  // Implementation will be moved to a separate utility file
  // This is a placeholder that returns mock recommendations
  return [
    {
      category: 'savings',
      title: 'Increase Emergency Fund',
      description: 'Your emergency fund could be stronger. Aim for 3-6 months of expenses.',
      priority: 'high',
      actionItems: [
        'Set up automatic transfers to savings',
        'Review monthly expenses for savings opportunities',
        'Consider a high-yield savings account',
      ],
    },
  ];
}

function createChartData(score: WellnessScore): ChartData {
  if (!score || !score.categoryScores) return { labels: [], datasets: [] };
  const _categories = Object.entries(score.categoryScores);
  return {
    labels: _categories.map(([, data]) => data.name),
    datasets: [
      {
        label: 'Category Scores',
        data: _categories.map(([, data]) => data.score),
        backgroundColor: _categories.map(() => score.color),
        borderColor: _categories.map(() => '#ffffff'),
        borderWidth: 2,
      },
    ],
  };
}
