import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { createRedisClient, withRedisFallback } from '@/lib/redis-client';

const redis = createRedisClient(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();

// Session configuration
const SESSION_DURATION = 24 * 60 * 60; // 24 hours
const MAX_CONCURRENT_SESSIONS = 3;
const SESSION_REFRESH_INTERVAL = 30 * 60; // 30 minutes

export class SessionService {
  // Create a new session
  static async createSession(userId: string, userAgent: string): Promise<string> {
    const sessionId = uuidv4();
    const sessionData = {
      userId,
      userAgent,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };

    // Store session in Redis
    await withRedisFallback(
      () => redis.set(`session:${userId}:${sessionId}`, JSON.stringify(sessionData), 'EX', SESSION_DURATION),
      'OK'
    );

    // Add to user's active sessions
    await withRedisFallback(() => redis.sadd(`user_sessions:${userId}`, sessionId), 0);

    // Check and limit concurrent sessions
    await this.limitConcurrentSessions(userId);

    // Log session creation
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SESSION_CREATED',
        details: {
          sessionId,
          userAgent,
        },
      },
    });

    return sessionId;
  }

  // Validate and refresh session
  static async validateSession(userId: string, sessionId: string): Promise<boolean> {
    const session = await withRedisFallback(() => redis.get(`session:${userId}:${sessionId}`), null);
    if (!session) {
      return false;
    }

    const now = Date.now();

    // Check if session needs refresh
    if (now - sessionData.lastActive > SESSION_REFRESH_INTERVAL * 1000) {
      sessionData.lastActive = now;
      await withRedisFallback(
        () => redis.set(`session:${userId}:${sessionId}`, JSON.stringify(sessionData), 'EX', SESSION_DURATION),
        'OK'
      );
    }

    return true;
  }

  // End a session
  static async endSession(userId: string, sessionId: string): Promise<void> {
    await withRedisFallback(() => redis.del(`session:${userId}:${sessionId}`), 0);
    await withRedisFallback(() => redis.srem(`user_sessions:${userId}`, sessionId), 0);

    // Log session end
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SESSION_ENDED',
        details: {
          sessionId,
        },
      },
    });
  }

  // End all sessions for a user
  static async endAllSessions(userId: string): Promise<void> {
    const sessions = await withRedisFallback(() => redis.smembers(`user_sessions:${userId}`), []);

    for (const sessionId of sessions) {
      await this.endSession(userId, sessionId);
    }

    // Log all sessions ended
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ALL_SESSIONS_ENDED',
        details: {
          sessionCount: sessions.length,
        },
      },
    });
  }

  // Get active sessions for a user
  static async getActiveSessions(
    userId: string
  ): Promise<Array<{ sessionId: string; userAgent: string; lastActive: number }>> {
    const sessions = await withRedisFallback(() => redis.smembers(`user_sessions:${userId}`), []);
    const activeSessions = [];

    for (const sessionId of sessions) {
      const session = await withRedisFallback(() => redis.get(`session:${userId}:${sessionId}`), null);
      if (session) {
        const sessionData = JSON.parse(session);
        activeSessions.push({
          sessionId,
          userAgent: sessionData.userAgent,
          lastActive: sessionData.lastActive,
        });
      }
    }

    return activeSessions;
  }

  // Limit concurrent sessions
  private static async limitConcurrentSessions(userId: string): Promise<void> {
    const sessions = await withRedisFallback(() => redis.smembers(`user_sessions:${userId}`), []);

    if (sessions.length > MAX_CONCURRENT_SESSIONS) {
      // Sort sessions by last active time
      const sessionDetails = await Promise.all(
        sessions.map(async sessionId => {
          const session = await withRedisFallback(() => redis.get(`session:${userId}:${sessionId}`), null);
          return {
            sessionId,
            lastActive: session ? JSON.parse(session).lastActive : 0,
          };
        })
      );

      sessionDetails.sort((a, b) => a.lastActive - b.lastActive);

      // Remove oldest sessions
      const sessionsToRemove = sessionDetails.slice(0, sessions.length - MAX_CONCURRENT_SESSIONS);
      for (const { sessionId } of sessionsToRemove) {
        await this.endSession(userId, sessionId);
      }
    }
  }

  // Check for suspicious session activity
  static async checkSuspiciousActivity(userId: string, sessionId: string): Promise<boolean> {
    const session = await withRedisFallback(() => redis.get(`session:${userId}:${sessionId}`), null);
    if (!session) {
      return false;
    }

    const now = Date.now();

    // Check for rapid session creation
    const recentSessions = await prisma.auditLog.findMany({
      where: {
        userId,
        action: 'SESSION_CREATED',
        createdAt: {
          gte: new Date(now - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (recentSessions.length > 5) {
      // Log suspicious activity
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SUSPICIOUS_SESSION_ACTIVITY',
          details: {
            sessionId,
            recentSessionCount: recentSessions.length,
          },
        },
      });
      return true;
    }

    return false;
  }
}
