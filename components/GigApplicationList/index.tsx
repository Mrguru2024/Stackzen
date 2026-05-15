import React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';

interface Application {
  id: string;
  coverLetter: string;
  proposedBudget: number | null;
  estimatedDuration: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  user: {
    name: string;
    email: string;
    image: string;
  };
}

interface GigApplicationListProps {
  gigId: string;
  applications: Application[];
  onStatusChange?: (applicationId: string, newStatus: string) => Promise<void>;
}

export default function GigApplicationList({
  gigId,
  applications,
  onStatusChange,
}: GigApplicationListProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const _handleStatusChange = async (applicationId: string, newStatus: string) => {
    if (!onStatusChange) return;

    setLoading(applicationId);
    try {
      await onStatusChange(applicationId, newStatus);
    } finally {
      setLoading(null);
    }
  };

  if (applications.length === 0) {
    return <div className="py-8 text-center text-gray-500">No applications yet</div>;
  }

  return (
    <div className="space-y-4">
      {applications.map(application => (
        <div key={application.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src={application.user.image || '/default-avatar.png'}
                alt={application.user.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {application.user.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{application.user.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Applied {formatDistanceToNow(new Date(application.createdAt))} ago
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {application.status === 'PENDING' && session?.user && (
                <>
                  <button
                    onClick={() => _handleStatusChange(application.id, 'ACCEPTED')}
                    disabled={loading === application.id}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading === application.id ? 'Updating...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => _handleStatusChange(application.id, 'REJECTED')}
                    disabled={loading === application.id}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading === application.id ? 'Updating...' : 'Reject'}
                  </button>
                </>
              )}
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  application.status === 'ACCEPTED'
                    ? 'bg-green-100 text-green-800'
                    : application.status === 'REJECTED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {application.status}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Cover Letter</h4>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{application.coverLetter}</p>
          </div>

          {(application.proposedBudget || application.estimatedDuration) && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {application.proposedBudget && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Proposed Budget
                  </h4>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    ${application.proposedBudget}
                  </p>
                </div>
              )}
              {application.estimatedDuration && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Estimated Duration
                  </h4>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    {application.estimatedDuration}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
