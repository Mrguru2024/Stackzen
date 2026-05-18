'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Button } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  CheckCircle,
  Clock,
  DollarSign,
  Star,
  Eye,
  Check,
  X,
  Loader2,
  Power,
} from 'lucide-react';

interface MentorApplication {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  credentials: string[];
  yearsOfExperience: number;
  hourlyRate: number;
  isCertified: boolean;
  isVerified: boolean;
  isActive: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'setup' | 'live';
  applicationStatus?: string;
  createdAt: string;
  totalSessions: number;
  rating: number;
  headshotUrl?: string | null;
  licenseUrl?: string | null;
  idUrl?: string | null;
  documentsComplete?: boolean;
  rejectionReason?: string | null;
}

type MentorAction = 'APPROVE' | 'REJECT' | 'CERTIFY' | 'VERIFY' | 'ACTIVATE' | 'DEACTIVATE';

function resolveMentorStatus(isVerified: boolean, isActive: boolean): MentorApplication['status'] {
  if (!isActive && !isVerified) return 'rejected';
  if (isVerified) return 'approved';
  return 'pending';
}

export default function AdminMentorManagement() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [actingOnMentorId, setActingOnMentorId] = useState<string | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<MentorApplication | null>(null);

  const loadMentors = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/mentors', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load mentors');
      }

      const data = (await response.json()) as MentorApplication[];
      setApplications(data);
    } catch (error) {
      console.error('Unable to load mentors', error);
      toast({
        title: 'Could not load mentor data',
        description: 'Try refreshing the page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadMentors();
  }, [loadMentors]);

  const pendingApplications = useMemo(
    () => applications.filter(app => app.status === 'pending'),
    [applications]
  );
  const approvedMentors = useMemo(
    () => applications.filter(app => app.status !== 'pending' && app.status !== 'rejected'),
    [applications]
  );
  const certifiedMentors = useMemo(
    () => approvedMentors.filter(mentor => mentor.isCertified),
    [approvedMentors]
  );

  const runAction = useCallback(
    async (mentorId: string, action: MentorAction) => {
      setActingOnMentorId(mentorId);
      try {
        const response = await fetch('/api/admin/mentors', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mentorId, action }),
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(errorPayload?.error || 'Update failed');
        }

        const updated = (await response.json()) as {
          id: string;
          isVerified: boolean;
          isActive: boolean;
          isCertified: boolean;
        };

        setApplications(prev =>
          prev.map(app => {
            if (app.id !== updated.id) return app;

            const status = resolveMentorStatus(updated.isVerified, updated.isActive);

            return {
              ...app,
              isVerified: updated.isVerified,
              isActive: updated.isActive,
              isCertified: updated.isCertified,
              status,
            };
          })
        );
        setSelectedMentor(prev => {
          if (prev?.id !== updated.id) return prev;
          const status = resolveMentorStatus(updated.isVerified, updated.isActive);
          return {
            ...prev,
            isVerified: updated.isVerified,
            isActive: updated.isActive,
            isCertified: updated.isCertified,
            status,
          };
        });

        await loadMentors();
        toast({
          title: 'Mentor updated',
          description: `Action ${action.toLowerCase()} completed.`,
        });
      } catch (error) {
        console.error('Mentor action failed', error);
        toast({
          title: 'Action failed',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setActingOnMentorId(null);
      }
    },
    [loadMentors, toast]
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Mentors</p>
                <p className="text-2xl font-bold">{approvedMentors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Certified</p>
                <p className="text-2xl font-bold">{certifiedMentors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingApplications.length}</p>
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
                <p className="text-2xl font-bold">
                  $
                  {Math.round(
                    approvedMentors.reduce((sum, m) => sum + m.hourlyRate, 0) /
                      approvedMentors.length || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="mentors">Active Mentors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingApplications.slice(0, 3).map(app => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <h4 className="font-medium">{app.name}</h4>
                        <p className="text-sm text-gray-600">{app.specialties.join(', ')}</p>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Mentors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...approvedMentors]
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 3)
                    .map(mentor => (
                      <div
                        key={mentor.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <h4 className="font-medium">{mentor.name}</h4>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Star className="h-4 w-4 text-yellow-400" />
                            {mentor.rating.toFixed(1)} ({mentor.totalSessions} sessions)
                          </div>
                        </div>
                        <Badge variant={mentor.isCertified ? 'default' : 'outline'}>
                          {mentor.isCertified ? 'Certified' : 'Direct'}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
          <div className="space-y-4">
            {pendingApplications.map(app => (
              <Card key={app.id}>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{app.name}</h3>
                      <p className="text-gray-600">{app.email}</p>
                    </div>
                    <Badge variant="outline">Pending Review</Badge>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 font-medium">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {app.specialties.map(s => (
                          <Badge key={s} variant="secondary">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 font-medium">Credentials</h4>
                      <div className="flex flex-wrap gap-2">
                        {app.credentials.map(c => (
                          <Badge key={c} variant="outline">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Experience:</span>
                      <p className="font-medium">{app.yearsOfExperience} years</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Rate:</span>
                      <p className="font-medium">${app.hourlyRate}/hr</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Applied:</span>
                      <p className="font-medium">{new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mb-4 rounded-md border bg-muted/40 p-3 text-sm">
                    <p className="mb-2 font-medium">Vetting documents</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild disabled={!app.headshotUrl}>
                        <a href={app.headshotUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                          Headshot
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild disabled={!app.licenseUrl}>
                        <a href={app.licenseUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                          License
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild disabled={!app.idUrl}>
                        <a href={app.idUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                          Government ID
                        </a>
                      </Button>
                      {!app.documentsComplete ? (
                        <Badge variant="destructive">Documents incomplete</Badge>
                      ) : (
                        <Badge variant="default">Ready to review</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => runAction(app.id, 'APPROVE')}
                      disabled={actingOnMentorId === app.id || !app.documentsComplete}
                      className="flex-1"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      disabled={actingOnMentorId === app.id}
                      onClick={() => runAction(app.id, 'REJECT')}
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setSelectedMentor(app)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingApplications.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-sm text-gray-600">
                  No pending mentor applications.
                </CardContent>
              </Card>
            )}
          </div>
          )}
        </TabsContent>

        <TabsContent value="mentors" className="space-y-4">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
          <div className="space-y-4">
            {approvedMentors.map(mentor => (
              <Card key={mentor.id}>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{mentor.name}</h3>
                      <p className="text-gray-600">{mentor.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {mentor.isCertified && <Badge variant="default">Certified</Badge>}
                      {mentor.isVerified && <Badge variant="outline">Verified</Badge>}
                      <Badge variant={mentor.isActive ? 'secondary' : 'destructive'}>
                        {mentor.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 font-medium">Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Rating:</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400" />
                            {mentor.rating.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sessions:</span>
                          <span>{mentor.totalSessions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate:</span>
                          <span>${mentor.hourlyRate}/hr</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 font-medium">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {mentor.specialties.map(s => (
                          <Badge key={s} variant="secondary">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!mentor.isCertified && (
                      <Button
                        onClick={() => runAction(mentor.id, 'CERTIFY')}
                        variant="outline"
                        disabled={actingOnMentorId === mentor.id}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Certify
                      </Button>
                    )}
                    {!mentor.isVerified && (
                      <Button
                        onClick={() => runAction(mentor.id, 'VERIFY')}
                        variant="outline"
                        disabled={actingOnMentorId === mentor.id}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verify
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() =>
                        runAction(mentor.id, mentor.isActive ? 'DEACTIVATE' : 'ACTIVATE')
                      }
                      disabled={actingOnMentorId === mentor.id}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {mentor.isActive ? 'Suspend' : 'Reactivate'}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setSelectedMentor(mentor)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {approvedMentors.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-sm text-gray-600">
                  No approved mentors yet.
                </CardContent>
              </Card>
            )}
          </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedMentor)} onOpenChange={() => setSelectedMentor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mentor Profile</DialogTitle>
          </DialogHeader>
          {selectedMentor && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{selectedMentor.name}</h3>
                  <p className="text-sm text-gray-600">{selectedMentor.email}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={selectedMentor.isVerified ? 'default' : 'outline'}>
                    {selectedMentor.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                  <Badge variant={selectedMentor.isCertified ? 'default' : 'outline'}>
                    {selectedMentor.isCertified ? 'Certified' : 'Not certified'}
                  </Badge>
                  <Badge variant={selectedMentor.isActive ? 'secondary' : 'destructive'}>
                    {selectedMentor.isActive ? 'Active' : 'Suspended'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Experience</p>
                  <p className="font-medium">{selectedMentor.yearsOfExperience} years</p>
                </div>
                <div>
                  <p className="text-gray-500">Hourly rate</p>
                  <p className="font-medium">${selectedMentor.hourlyRate}/hr</p>
                </div>
                <div>
                  <p className="text-gray-500">Rating</p>
                  <p className="font-medium">{selectedMentor.rating.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Completed sessions</p>
                  <p className="font-medium">{selectedMentor.totalSessions}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-gray-500">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMentor.specialties.map(specialty => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-gray-500">Credentials</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMentor.credentials.map(credential => (
                    <Badge key={credential} variant="outline">
                      {credential}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t pt-4">
                {!selectedMentor.isVerified && (
                  <Button
                    onClick={() => runAction(selectedMentor.id, 'APPROVE')}
                    disabled={actingOnMentorId === selectedMentor.id}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                )}
                {selectedMentor.isVerified && (
                  <Button
                    variant="outline"
                    onClick={() => runAction(selectedMentor.id, 'REJECT')}
                    disabled={actingOnMentorId === selectedMentor.id}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                )}
                {!selectedMentor.isCertified && (
                  <Button
                    variant="outline"
                    onClick={() => runAction(selectedMentor.id, 'CERTIFY')}
                    disabled={actingOnMentorId === selectedMentor.id}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Certify
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    runAction(selectedMentor.id, selectedMentor.isActive ? 'DEACTIVATE' : 'ACTIVATE')
                  }
                  disabled={actingOnMentorId === selectedMentor.id}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {selectedMentor.isActive ? 'Suspend' : 'Reactivate'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
