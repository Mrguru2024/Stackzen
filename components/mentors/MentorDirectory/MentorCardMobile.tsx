import React from 'react';
import Image from 'next/image';
import { Star, CheckCircle, BadgeCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Mentor } from './MentorCard';

interface MentorCardMobileProps {
  mentor: Mentor;
  onViewProfile: (mentor: Mentor) => void;
}

const MentorCardMobile: React.FC<MentorCardMobileProps> = ({ mentor, onViewProfile }) => {
  return (
    <div
      className="cursor-pointer space-y-3 rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900"
      onClick={() => onViewProfile(mentor)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Image
          src={mentor.headshotUrl || '/avatars/default.jpg'}
          alt={mentor.name}
          width={64}
          height={64}
          className="h-16 w-16 flex-shrink-0 rounded-full border-2 border-primary object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold">{mentor.name}</h3>
            {mentor.isCertified && <BadgeCheck className="h-4 w-4 flex-shrink-0 text-green-500" />}
            {mentor.isVerified && <CheckCircle className="h-4 w-4 flex-shrink-0 text-blue-500" />}
          </div>
          <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{mentor.bio}</p>
        </div>
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
      </div>

      {/* Specialties */}
      <div className="flex flex-wrap gap-1">
        {mentor.specialties.slice(0, 2).map(specialty => (
          <Badge key={specialty} variant="secondary" className="text-xs">
            {specialty}
          </Badge>
        ))}
        {mentor.specialties.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{mentor.specialties.length - 2} more
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-400" />
          <span>{mentor.rating.toFixed(1)}</span>
          <span>•</span>
          <span>{mentor.totalSessions} sessions</span>
        </div>
        <div className="text-right">
          <span className="font-semibold text-primary">${mentor.hourlyRate}/hr</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 border-t pt-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={e => {
            e.stopPropagation();
            onViewProfile(mentor);
          }}
        >
          View Profile
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={e => {
            e.stopPropagation();
            // Quick book functionality
          }}
        >
          Quick Book
        </Button>
      </div>
    </div>
  );
};

export default MentorCardMobile;
