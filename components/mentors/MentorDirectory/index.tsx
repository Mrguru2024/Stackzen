'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Search, Star, Clock, DollarSign, Users } from 'lucide-react';
import MentorCard, { type Mentor } from './MentorCard';
import MentorFilters from './MentorFilters';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function MentorDirectory() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [showCertifiedOnly, setShowCertifiedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMentors = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/mentors', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load mentors');
        }

        const data = (await response.json()) as Mentor[];
        if (isMounted) {
          setMentors(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load mentors');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadMentors();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter mentors based on search and filters
  const filteredMentors = useMemo(() => mentors.filter(mentor => {
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecialty = !selectedSpecialty || mentor.specialties.includes(selectedSpecialty);

    const matchesPrice =
      !priceRange ||
      (priceRange === 'under-100' && mentor.hourlyRate < 100) ||
      (priceRange === '100-150' && mentor.hourlyRate >= 100 && mentor.hourlyRate <= 150) ||
      (priceRange === '150-200' && mentor.hourlyRate > 150 && mentor.hourlyRate <= 200) ||
      (priceRange === 'over-200' && mentor.hourlyRate > 200);

    const matchesCertified = !showCertifiedOnly || mentor.isCertified;

    return matchesSearch && matchesSpecialty && matchesPrice && matchesCertified;
  }), [mentors, priceRange, searchTerm, selectedSpecialty, showCertifiedOnly]);

  const specialties = useMemo(() => Array.from(new Set(mentors.flatMap(m => m.specialties))), [mentors]);
  const averageRating = useMemo(() => {
    if (mentors.length === 0) return 0;
    return mentors.reduce((sum, mentor) => sum + mentor.rating, 0) / mentors.length;
  }, [mentors]);
  const totalSessions = useMemo(
    () => mentors.reduce((sum, mentor) => sum + mentor.totalSessions, 0),
    [mentors]
  );
  const averageRate = useMemo(() => {
    if (mentors.length === 0) return 0;
    return mentors.reduce((sum, mentor) => sum + mentor.hourlyRate, 0) / mentors.length;
  }, [mentors]);
  const gridClassName =
    viewMode === 'grid' ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4';

  let resultsContent: React.ReactNode;
  if (isLoading) {
    resultsContent = (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Loading mentors...</p>
        </CardContent>
      </Card>
    );
  } else if (error) {
    resultsContent = (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  } else if (filteredMentors.length === 0) {
    resultsContent = (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No mentors found matching your criteria.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchTerm('');
              setSelectedSpecialty('');
              setPriceRange('');
              setShowCertifiedOnly(false);
            }}
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>
    );
  } else {
    resultsContent = (
      <div className={gridClassName}>
        {filteredMentors.map(mentor => (
          <MentorCard key={mentor.id} mentor={mentor} viewMode={viewMode} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Mentors</p>
                <p className="text-2xl font-bold">{mentors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Rate</p>
                <p className="text-2xl font-bold">${Math.round(averageRate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search mentors by name, specialty, or expertise..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Filters */}
      <MentorFilters
        specialties={specialties}
        selectedSpecialty={selectedSpecialty}
        setSelectedSpecialty={setSelectedSpecialty}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        showCertifiedOnly={showCertifiedOnly}
        setShowCertifiedOnly={setShowCertifiedOnly}
      />

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredMentors.length} of {mentors.length} mentors
          </p>
        </div>

        {resultsContent}
      </div>
    </div>
  );
}
