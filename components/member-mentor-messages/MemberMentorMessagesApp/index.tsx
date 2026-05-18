'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  MentorMessagingPanel,
  type MentorMessagingApiBase,
} from '@/components/mentors/MentorMessagingPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Video } from 'lucide-react';

const memberMessagingApi: MentorMessagingApiBase = {
  conversations: '/api/member/mentor-messages/conversations',
  messages: id => `/api/member/mentor-messages/conversations/${id}/messages`,
  stream: id => `/api/member/mentor-messages/conversations/${id}/stream`,
};

export function MemberMentorMessagesApp() {
  const { toast } = useToast();
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);

  const sessions = useQuery({
    queryKey: ['member', 'mentor-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/member/mentor-sessions', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load sessions');
      return res.json() as Promise<{
        sessions: Array<{
          id: string;
          scheduledAt: string;
          status: string;
          sessionType: string;
          meetingUrl: string | null;
          mentor: { id: string; name: string };
        }>;
      }>;
    },
  });

  const joinSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/member/mentor-sessions/${sessionId}/room`, {
        method: 'POST',
      });
      const data = (await res.json()) as { roomUrl?: string; error?: string; note?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not join session');
      if (data.note) {
        toast({ title: 'Demo video room', description: data.note });
      }
      if (data.roomUrl) window.open(data.roomUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast({
        title: 'Video unavailable',
        description: error instanceof Error ? error.message : 'Try again',
        variant: 'destructive',
      });
    }
  };

  const openChatWithMentor = async (mentorId: string) => {
    try {
      const res = await fetch('/api/member/mentor-messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId }),
      });
      const data = (await res.json()) as { conversationId?: string; error?: string };
      if (!res.ok || !data.conversationId) {
        throw new Error(data.error ?? 'Could not open chat');
      }
      setActiveConvoId(data.conversationId);
    } catch (error) {
      toast({
        title: 'Messaging unavailable',
        description: error instanceof Error ? error.message : 'Book a session first',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mentor messages</h1>
        <p className="text-muted-foreground">
          Reply to your mentors in real time. Need a new coach?{' '}
          <Link href="/financial-mentorship" className="text-primary underline">
            Browse mentors
          </Link>
          .
        </p>
      </div>

      {(sessions.data?.sessions ?? []).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.data?.sessions.map(s => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{s.mentor.name}</p>
                  <p className="text-muted-foreground">
                    {new Date(s.scheduledAt).toLocaleString()} · {s.sessionType}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{s.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => void joinSession(s.id)}>
                    <Video className="mr-2 h-4 w-4" />
                    {s.meetingUrl ? 'Join video' : 'Open video room'}
                  </Button>
                  <Button size="sm" onClick={() => void openChatWithMentor(s.mentor.id)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <MentorMessagingPanel
        api={memberMessagingApi}
        peerLabel="Mentor"
        inboxTitle="Your mentors"
        emptyInboxHint="When a mentor messages you, the thread appears here. Book a session to start chatting."
        initialConversationId={activeConvoId}
      />
    </div>
  );
}
