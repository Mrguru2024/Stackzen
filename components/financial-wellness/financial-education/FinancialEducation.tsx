'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'course' | 'podcast';
  duration?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  url: string;
}

interface FinancialEducationProps {
  resources?: Resource[];
  onResourceClick?: (resource: Resource) => void;
}

export default function FinancialEducation({
  resources = [],
  onResourceClick,
}: FinancialEducationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const _filteredResources = resources.filter(resource => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesLevel = selectedLevel === 'all' || resource.level === selectedLevel;
    return matchesSearch && matchesType && matchesLevel;
  });

  const _getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'article':
        return '📄';
      case 'video':
        return '🎥';
      case 'course':
        return '📚';
      case 'podcast':
        return '🎧';
      default:
        return '📄';
    }
  };

  const _getLevelColor = (level: Resource['level']) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-blue-500';
      case 'advanced':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Education</h2>
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex gap-2">
          {['all', 'article', 'video', 'course', 'podcast'].map(type => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              onClick={() => setSelectedType(type)}
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          {['all', 'beginner', 'intermediate', 'advanced'].map(level => (
            <Button
              key={level}
              variant={selectedLevel === level ? 'default' : 'outline'}
              onClick={() => setSelectedLevel(level)}
              className="capitalize"
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {_filteredResources.map(resource => (
          <Card
            key={resource.id}
            className="cursor-pointer p-4 transition-shadow hover:shadow-lg"
            onClick={() => onResourceClick?.(resource)}
          >
            <div className="mb-2 flex items-start gap-2">
              <span className="text-2xl">{_getTypeIcon(resource.type)}</span>
              <div className="flex-1">
                <h3 className="font-semibold">{resource.title}</h3>
                <div className="mt-1 flex gap-2">
                  <Badge className={`${_getLevelColor(resource.level)} capitalize text-white`}>
                    {resource.level}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {resource.category}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="mb-2 text-sm text-gray-600">{resource.description}</p>
            {resource.duration && (
              <p className="text-sm text-gray-500">Duration: {resource.duration}</p>
            )}
          </Card>
        ))}
      </div>
    </Card>
  );
}
