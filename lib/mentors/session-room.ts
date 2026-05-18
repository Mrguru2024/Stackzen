import 'server-only';
import { SessionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ensureMentorSessionVideoRoom } from '@/lib/daily/rooms';

export async function provisionSessionVideoRoom(sessionId: string, mentorId: string) {
  const mentorSession = await prisma.mentorSession.findFirst({
    where: { id: sessionId, mentorId },
    select: { id: true, meetingUrl: true, meetingId: true, status: true },
  });

  if (!mentorSession) {
    return { error: 'Session not found' as const };
  }

  const room = await ensureMentorSessionVideoRoom({
    sessionId: mentorSession.id,
    meetingUrl: mentorSession.meetingUrl,
    meetingId: mentorSession.meetingId,
  });

  if (!mentorSession.meetingUrl) {
    await prisma.mentorSession.update({
      where: { id: sessionId },
      data: {
        meetingUrl: room.roomUrl,
        meetingId: room.roomName,
        status:
          mentorSession.status === SessionStatus.SCHEDULED
            ? SessionStatus.CONFIRMED
            : mentorSession.status,
      },
    });
  }

  return {
    roomUrl: room.roomUrl,
    roomName: room.roomName,
    mode: 'video' as const,
    provider: room.provider,
    note: room.note,
  };
}

export async function provisionSessionVideoRoomForMember(sessionId: string, memberUserId: string) {
  const mentorSession = await prisma.mentorSession.findFirst({
    where: { id: sessionId, userId: memberUserId },
    select: { id: true, mentorId: true, meetingUrl: true, meetingId: true, status: true },
  });

  if (!mentorSession) {
    return { error: 'Session not found' as const };
  }

  return provisionSessionVideoRoom(sessionId, mentorSession.mentorId);
}
