'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';

interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  rating: number;
  availability: string;
  imageUrl?: string;
}

interface FinancialMentorshipProps {
  mentors?: Mentor[];
  onConnect?: (mentorId: string) => void;
}

export default function FinancialMentorship({ mentors = [], onConnect }: FinancialMentorshipProps) {
  const [selectedExpertise, setSelectedExpertise] = React.useState<string>('all');

  const _filteredMentors =
    selectedExpertise === 'all'
      ? mentors
      : mentors.filter(mentor => mentor.expertise.includes(selectedExpertise));

  const _expertiseOptions = ['all', ...new Set(mentors.flatMap(m => m.expertise))];

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Mentorship</h2>
        <div className="flex gap-2">
          {_expertiseOptions.map(expertise => (
            <Button
              key={expertise}
              variant={selectedExpertise === expertise ? 'default' : 'outline'}
              onClick={() => setSelectedExpertise(expertise)}
              className="capitalize"
            >
              {expertise}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {_filteredMentors.map(mentor => (
          <Card key={mentor.id} className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                {mentor.imageUrl ? (
                  <AvatarImage src={mentor.imageUrl} alt={mentor.name} />
                ) : null}
                <AvatarFallback>{mentor.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{mentor.name}</h3>
                <div className="my-2 flex flex-wrap gap-1">
                  {mentor.expertise.map(exp => (
                    <Badge key={exp} variant="secondary" className="capitalize">
                      {exp}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Rating: {mentor.rating}/5</span>
                  <span>•</span>
                  <span>{mentor.availability}</span>
                </div>
                <Button className="mt-4 w-full" onClick={() => onConnect?.(mentor.id)}>
                  Connect
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
