import React from 'react';
import { motion } from 'framer-motion';
import { WellnessScore } from '@/types/wellness';

interface WellnessScorecardProps {
  userData: {
    wellnessScores: WellnessScore[];
    recommendations: Array<{
      category: string;
      title: string;
      description: string;
      actions: string[];
    }>;
  };
  className?: string;
}

export default function WellnessScorecard({ userData, className = '' }: WellnessScorecardProps) {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div
        className={`rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800 ${className}`}
        role="status"
      >
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="mb-8 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-48 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { wellnessScores, recommendations } = userData;
  const overallScore = Math.round(
    wellnessScores.reduce((acc, score) => acc + score.score, 0) / wellnessScores.length
  );

  return (
    <div className={`rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800 ${className}`}>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col items-center">
          <div className="relative h-48 w-48">
            <canvas role="img" width={300} height={150} style={{ transform: 'scale(0)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: '#4299e1' }}>
                  {overallScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {overallScore >= 80
                    ? 'Excellent'
                    : overallScore >= 60
                      ? 'Good'
                      : 'Needs Improvement'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="mb-4 text-2xl font-semibold">Financial Wellness Score</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {overallScore >= 80
              ? 'Your finances are in excellent shape. Keep up the good work!'
              : overallScore >= 60
                ? 'Your finances are stable. Focus on optimization and growth strategies.'
                : 'Your finances need attention. Focus on building a strong foundation.'}
          </p>
          <div className="space-y-2">
            {wellnessScores.map(score => (
              <div key={score.category} className="flex items-center">
                <div className="w-32 text-sm">{score.category}</div>
                <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(score.score / score.maxScore) * 100}%`,
                      backgroundColor: '#4299e1',
                    }}
                  />
                </div>
                <div className="w-12 text-right text-sm">
                  {score.score}/{score.maxScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="mb-4 text-xl font-semibold">Recommendations</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700"
            >
              <div className="mb-2 flex items-center">
                <span className="mr-2 h-2 w-2 rounded-full bg-red-500" />
                <h4 className="font-medium">{rec.title}</h4>
              </div>
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
              <ul className="space-y-1 text-sm">
                {rec.actions.map((action, i) => (
                  <li key={i} className="flex items-center">
                    <span className="mr-2">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
