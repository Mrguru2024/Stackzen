'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useMentorConversationStream } from '@/hooks/useMentorConversationStream';
import { Loader2, Send } from 'lucide-react';

export type MentorMessagingApiBase = {
  conversations: string;
  messages: (conversationId: string) => string;
  stream: (conversationId: string) => string;
};

export interface MentorMessagingPanelProps {
  api: MentorMessagingApiBase;
  peerLabel: string;
  inboxTitle?: string;
  emptyInboxHint?: string;
  enabled?: boolean;
  initialConversationId?: string | null;
}

type ConversationRow = {
  id: string;
  member?: { name: string | null };
  mentor?: { name: string };
  lastMessage: { body: string } | null;
};

export function MentorMessagingPanel({
  api,
  peerLabel,
  inboxTitle = 'Inbox',
  emptyInboxHint = 'No conversations yet.',
  enabled = true,
  initialConversationId = null,
}: MentorMessagingPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeConvoId, setActiveConvoId] = useState<string | null>(initialConversationId);
  const [messageDraft, setMessageDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (initialConversationId) {
      setActiveConvoId(initialConversationId);
    }
  }, [initialConversationId]);

  const conversations = useQuery({
    queryKey: ['mentor-messaging', api.conversations],
    queryFn: async () => {
      const res = await fetch(api.conversations, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load inbox');
      return res.json() as Promise<{ conversations: ConversationRow[] }>;
    },
    enabled,
    refetchInterval: false,
  });

  const messages = useQuery({
    queryKey: ['mentor-messaging', 'messages', activeConvoId],
    queryFn: async () => {
      const res = await fetch(api.messages(activeConvoId!), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load messages');
      return res.json() as Promise<{
        messages: Array<{ id: string; body: string; isMine: boolean }>;
      }>;
    },
    enabled: enabled && Boolean(activeConvoId),
    refetchInterval: false,
  });

  const refreshMessages = useCallback(() => {
    if (!activeConvoId) return;
    void queryClient.invalidateQueries({
      queryKey: ['mentor-messaging', 'messages', activeConvoId],
    });
    void queryClient.invalidateQueries({ queryKey: ['mentor-messaging', api.conversations] });
  }, [activeConvoId, api.conversations, queryClient]);

  useMentorConversationStream(
    activeConvoId,
    activeConvoId ? api.stream(activeConvoId) : null,
    refreshMessages
  );

  const sendMessage = async () => {
    if (!activeConvoId || !messageDraft.trim()) return;
    setSending(true);
    try {
      const res = await fetch(api.messages(activeConvoId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: messageDraft }),
      });
      if (!res.ok) throw new Error('Send failed');
      setMessageDraft('');
      refreshMessages();
    } catch {
      toast({ title: 'Message not sent', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const peerName = (row: ConversationRow) =>
    row.member?.name ?? row.mentor?.name ?? peerLabel;

  if (!enabled) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Messaging is unavailable.
        </CardContent>
      </Card>
    );
  }

  if (conversations.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">{inboxTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(conversations.data?.conversations ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyInboxHint}</p>
          ) : (
            conversations.data?.conversations.map(row => (
              <button
                key={row.id}
                type="button"
                className={`w-full rounded-md border p-2 text-left text-sm hover:bg-muted ${
                  activeConvoId === row.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setActiveConvoId(row.id)}
              >
                <p className="font-medium">{peerName(row)}</p>
                <p className="truncate text-muted-foreground">
                  {row.lastMessage?.body ?? 'No messages yet'}
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!activeConvoId ? (
            <p className="text-sm text-muted-foreground">Select a conversation to reply.</p>
          ) : (
            <>
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-3">
                {messages.isLoading ? (
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  (messages.data?.messages ?? []).map(m => (
                    <div
                      key={m.id}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        m.isMine ? 'ml-8 bg-primary text-primary-foreground' : 'mr-8 bg-muted'
                      }`}
                    >
                      {m.body}
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={messageDraft}
                  onChange={e => setMessageDraft(e.target.value)}
                  placeholder={`Reply to your ${peerLabel.toLowerCase()}…`}
                  rows={2}
                  className="min-h-[60px] flex-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <Button
                  type="button"
                  disabled={sending || !messageDraft.trim()}
                  onClick={() => void sendMessage()}
                  className="self-end"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
