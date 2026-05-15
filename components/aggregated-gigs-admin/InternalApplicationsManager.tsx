import React from 'react';
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useGigApplications } from '@/lib/hooks/useGigApplications';

interface GigApplication {
  id: string;
  gigId: string;
  userId: string;
  status: string;
  data: {
    name: string;
    email: string;
    phone?: string;
    portfolio?: string;
    coverLetter: string;
    experience: string;
    availability: string;
    rate?: string;
    additionalInfo?: string;
  };
  createdAt: string;
  updatedAt: string;
  gig: {
    title: string;
  };
  user: {
    name: string;
    email: string;
  };
}

export default function InternalApplicationsManager() {
  const [selectedApplication, setSelectedApplication] = useState<GigApplication | null>(null);
  const { applications, isLoading, updateStatus } = useGigApplications();

  if (isLoading) {
    return <div className="py-8 text-center">Loading applications...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h2 className="mb-6 text-2xl font-bold dark:text-white">Internal Applications</h2>

      <div className="grid gap-6">
        {applications?.map(app => (
          <div key={app.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold dark:text-white">{app.gig.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Applied by {app.user.name} ({app.user.email})
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedApplication(app)}
                  className="hover:bg-primary-dark rounded bg-primary px-3 py-1 text-sm text-white"
                >
                  View Details
                </button>
                <select
                  value={app.status}
                  onChange={e => updateStatus.mutate({ id: app.id, status: e.target.value })}
                  className="rounded border px-3 py-1 text-sm dark:bg-gray-800 dark:text-white"
                  aria-label="Update application status"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Application Details Modal */}
      <Dialog
        open={!!selectedApplication}
        onClose={() => setSelectedApplication(null)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center px-4">
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <div className="relative z-10 mx-auto w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            {selectedApplication && (
              <>
                <Dialog.Title className="mb-4 text-xl font-bold dark:text-white">
                  Application Details
                </Dialog.Title>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold dark:text-white">Personal Information</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Name: {selectedApplication.data.name}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Email: {selectedApplication.data.email}
                    </p>
                    {selectedApplication.data.phone && (
                      <p className="text-gray-600 dark:text-gray-300">
                        Phone: {selectedApplication.data.phone}
                      </p>
                    )}
                    {selectedApplication.data.portfolio && (
                      <p className="text-gray-600 dark:text-gray-300">
                        Portfolio:{' '}
                        <a
                          href={selectedApplication.data.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {selectedApplication.data.portfolio}
                        </a>
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold dark:text-white">Cover Letter</h4>
                    <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                      {selectedApplication.data.coverLetter}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold dark:text-white">Experience</h4>
                    <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                      {selectedApplication.data.experience}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold dark:text-white">Availability</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {selectedApplication.data.availability}
                      </p>
                    </div>
                    {selectedApplication.data.rate && (
                      <div>
                        <h4 className="font-semibold dark:text-white">Expected Rate</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedApplication.data.rate}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedApplication.data.additionalInfo && (
                    <div>
                      <h4 className="font-semibold dark:text-white">Additional Information</h4>
                      <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                        {selectedApplication.data.additionalInfo}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      onClick={() => setSelectedApplication(null)}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
