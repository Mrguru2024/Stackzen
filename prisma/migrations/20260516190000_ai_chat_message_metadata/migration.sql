-- AI chat message metadata for orchestration (role, provider, conversation threading)
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "role" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "conversationId" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "model" TEXT;

CREATE INDEX IF NOT EXISTS "ChatMessage_userId_conversationId_idx" ON "ChatMessage"("userId", "conversationId");
CREATE INDEX IF NOT EXISTS "ChatMessage_userId_createdAt_idx" ON "ChatMessage"("userId", "createdAt");
