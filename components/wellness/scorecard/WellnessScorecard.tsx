'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Progress from '@/components/ui/progress';

interface WellnessScorecardProps {
  score: number;
  category: string;
  description?: string;
}

export function WellnessScorecard({ score, category, description }: WellnessScorecardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{category}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Score</span>
            <span className="text-2xl font-bold">{score}%</span>
          </div>
          <Progress value={score} className="h-2" />
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
