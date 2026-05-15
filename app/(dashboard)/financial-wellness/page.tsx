'use client';

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui';

type JourneyMilestone = {
  id: string;
  title: string;
  description: string;
  completionPercentage: number;
  completed: boolean;
};

type JourneyData = {
  milestones: JourneyMilestone[];
  achievements: { id: string; title: string; description: string }[];
};

type MentorshipData = {
  mentors: {
    id: string;
    name: string;
    specialization: string;
    rating: number;
    sessionsCompleted: number;
  }[];
  upcomingSessions: { id: string; date: string; time: string; status: string }[];
};

export default function FinancialWellnessPage() {
  const [journey, setJourney] = useState<JourneyData | null>(null);
  const [mentorship, setMentorship] = useState<MentorshipData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [journeyRes, mentorshipRes] = await Promise.all([
          fetch('/api/financial-journey'),
          fetch('/api/financial-mentorship'),
        ]);
        if (journeyRes.ok) {
          setJourney(await journeyRes.json());
        }
        if (mentorshipRes.ok) {
          setMentorship(await mentorshipRes.json());
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const completionScore = useMemo(() => {
    if (!journey?.milestones?.length) return 0;
    return Math.round(
      journey.milestones.reduce((sum, milestone) => sum + milestone.completionPercentage, 0) /
        journey.milestones.length
    );
  }, [journey]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between pb-8 pt-6">
        <h1 className="text-3xl font-bold">Financial Wellness</h1>
        <ThemeToggle />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wellness Score</CardTitle>
            <CardDescription>Calculated from progress across milestones.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isLoading ? '...' : `${completionScore}%`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Mentors</CardTitle>
            <CardDescription>Verified experts ready for coaching.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isLoading ? '...' : (mentorship?.mentors.length ?? 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
            <CardDescription>Scheduled mentorship sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading ? '...' : (mentorship?.upcomingSessions.length ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progress Milestones</CardTitle>
            <CardDescription>Live overview from your financial journey profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {journey?.milestones?.map(milestone => (
              <div key={milestone.id} className="rounded-lg border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">{milestone.title}</p>
                  <Badge variant={milestone.completed ? 'default' : 'outline'}>
                    {milestone.completionPercentage}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{milestone.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Action Center</CardTitle>
            <CardDescription>Direct links to core workflows with real persistence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/goals">Manage Savings Goals</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/income/challenges">Join Financial Challenges</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/mentors">Book a Mentor Session</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/income/investments/portfolio">Review Investment Portfolio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
