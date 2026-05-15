'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Clock,
  MessageCircle,
  Settings,
  Users,
  AlertCircle,
} from 'lucide-react';

interface VideoRoomProps {
  sessionId: string;
  mentorName: string;
  userName: string;
  duration: number; // in minutes
  onSessionEnd: () => void;
}

export default function VideoRoom({
  sessionId,
  mentorName,
  userName,
  duration,
  onSessionEnd,
}: VideoRoomProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // in seconds
  const [isSessionEnding, setIsSessionEnding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate joining the meeting
    const timer = setTimeout(() => {
      setIsJoined(true);
      setIsLoading(false);
      setParticipants([
        { id: 1, name: mentorName, isMentor: true },
        { id: 2, name: userName, isMentor: false },
      ]);
    }, 2000);

    return () => clearTimeout(timer);
  }, [mentorName, userName]);

  // Timer countdown
  useEffect(() => {
    if (!isJoined || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsSessionEnding(true);
          setTimeout(() => {
            onSessionEnd();
          }, 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isJoined, timeRemaining, onSessionEnd]);

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };

  const leaveCall = () => {
    onSessionEnd();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      {/* Header */}
      <div className="border-b bg-white p-4 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Session with {mentorName}</h1>
            <p className="text-sm text-gray-600">Session ID: {sessionId}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{participants.length} participants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative flex-1">
        <div ref={videoRef} className="flex h-full w-full items-center justify-center bg-gray-800">
          {isLoading ? (
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
              <p className="text-white">Connecting to session...</p>
            </div>
          ) : (
            <div className="text-center text-white">
              <div className="mb-4">
                <AlertCircle className="mx-auto mb-4 h-16 w-16 text-yellow-400" />
                <h3 className="mb-2 text-xl font-bold">Video Session</h3>
                <p className="mb-4 text-gray-300">This is a demo video session interface.</p>
                <p className="text-sm text-gray-400">
                  In production, this would integrate with Daily.co or Zoom for real video calls.
                </p>
              </div>

              {/* Participant List */}
              <div className="mt-8">
                <h4 className="mb-2 font-semibold">Participants:</h4>
                <div className="space-y-2">
                  {participants.map(participant => (
                    <div key={participant.id} className="flex items-center justify-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${participant.isMentor ? 'bg-green-400' : 'bg-blue-400'}`}
                      ></div>
                      <span>{participant.name}</span>
                      {participant.isMentor && (
                        <Badge variant="secondary" className="text-xs">
                          Mentor
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Session Ending Warning */}
        {isSessionEnding && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <Card className="w-96">
              <CardContent className="p-6 text-center">
                <h3 className="mb-2 text-lg font-bold">Session Ending</h3>
                <p>Your session time is up. You will be disconnected shortly.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-t bg-white p-4 dark:bg-gray-800">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleMic}
            variant={isMicOn ? 'default' : 'destructive'}
            size="icon"
            className="h-12 w-12 rounded-full"
            disabled={isLoading}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            onClick={toggleVideo}
            variant={isVideoOn ? 'default' : 'destructive'}
            size="icon"
            className="h-12 w-12 rounded-full"
            disabled={isLoading}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            onClick={leaveCall}
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full"
            disabled={isLoading}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            disabled={isLoading}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            disabled={isLoading}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
