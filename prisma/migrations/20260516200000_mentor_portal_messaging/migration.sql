-- Mentor portal messaging
CREATE TABLE IF NOT EXISTS "MentorConversation" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "memberUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MentorMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MentorConversation_mentorId_memberUserId_key" ON "MentorConversation"("mentorId", "memberUserId");
CREATE INDEX IF NOT EXISTS "MentorConversation_mentorId_idx" ON "MentorConversation"("mentorId");
CREATE INDEX IF NOT EXISTS "MentorConversation_memberUserId_idx" ON "MentorConversation"("memberUserId");
CREATE INDEX IF NOT EXISTS "MentorMessage_conversationId_createdAt_idx" ON "MentorMessage"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "MentorMessage_senderUserId_idx" ON "MentorMessage"("senderUserId");

ALTER TABLE "MentorConversation" ADD CONSTRAINT "MentorConversation_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorConversation" ADD CONSTRAINT "MentorConversation_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorMessage" ADD CONSTRAINT "MentorMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "MentorConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorMessage" ADD CONSTRAINT "MentorMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
