import React, { useState } from 'react';
import Image from 'next/image';
import { Star, CheckCircle, BadgeCheck, Globe, Calendar } from 'lucide-react';
import { Button } from '@/components/ui';
import MentorProfileModal from '../MentorProfile/MentorProfileModal';

export interface Mentor {
  id: string;
  name: string;
  bio: string;
  specialties: string[];
  rating: number;
  totalSessions: number;
  hourlyRate: number;
  isCertified: boolean;
  isVerified: boolean;
  yearsOfExperience: number;
  credentials: string[];
  headshotUrl?: string;
  languages: string[];
  availability: string[];
}

interface MentorCardProps {
  mentor: Mentor;
  viewMode: 'grid' | 'list';
}

const MentorCard: React.FC<MentorCardProps> = ({ mentor, viewMode }) => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <div
        className={`flex rounded-lg bg-white p-6 shadow dark:bg-gray-900 ${
          viewMode === 'list'
            ? 'flex-row items-center gap-6'
            : 'flex-col items-center gap-4 text-center'
        } transition hover:shadow-lg`}
      >
        <Image
          src={mentor.headshotUrl || '/avatars/default.jpg'}
          alt={mentor.name}
          width={80}
          height={80}
          className="mb-2 rounded-full border-2 border-primary object-cover"
        />
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-center gap-2 md:justify-start">
            <span className="text-lg font-semibold dark:text-white">{mentor.name}</span>
            {mentor.isCertified && (
              <span title="StackZen Certified">
                <BadgeCheck className="h-5 w-5 text-green-500" />
              </span>
            )}
            {mentor.isVerified && (
              <span title="Verified Mentor">
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </span>
            )}
          </div>
          <div className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
            {mentor.bio}
          </div>
          <div className="mb-2 flex flex-wrap justify-center gap-2 md:justify-start">
            {mentor.specialties.map(s => (
              <span
                key={s}
                className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="mb-2 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400 md:justify-start">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400" /> {mentor.rating.toFixed(1)}
            </span>
            <span>• {mentor.totalSessions} sessions</span>
            <span>• {mentor.yearsOfExperience} yrs exp</span>
            <span>• ${mentor.hourlyRate}/hr</span>
          </div>
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            {mentor.credentials.map(c => (
              <span key={c} className="rounded bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
                {c}
              </span>
            ))}
          </div>
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Globe className="h-4 w-4" />
            {mentor.languages.join(', ')}
          </div>
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Calendar className="h-4 w-4" />
            <span>Available: {mentor.availability.join(', ')}</span>
          </div>
          <Button
            className="w-full md:w-auto"
            onClick={e => {
              e.stopPropagation();
              setShowProfile(true);
            }}
          >
            View Profile & Book
          </Button>
        </div>
      </div>

      <MentorProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        mentor={mentor}
        onBooked={() => setShowProfile(false)}
      />
    </>
  );
};

export default MentorCard;
