import { createClient } from '@/lib/supabase/client';
// const _rateLimiter = ... // Unused

export type SecurityEvent = {
  type: 'login_attempt' | 'password_change' | '2fa_setup' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: Date;
};

export type SecurityAlert = {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  metadata: Record<string, any>;
};

export class SecurityMonitor {
  private static readonly SUSPICIOUS_PATTERNS = {
    rapidAttempts: {
      threshold: 3,
      windowMs: 60000, // 1 minute
    },
    multipleIPs: {
      threshold: 2,
      windowMs: 3600000, // 1 hour
    },
    mixedAuthTypes: {
      threshold: 2,
      windowMs: 300000, // 5 minutes
    },
    failedAttempts: {
      threshold: 5,
      windowMs: 900000, // 15 minutes
    },
  };

  static async logEvent(userId: string, event: SecurityEvent): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from('security_events').insert({
      user_id: userId,
      event_type: event.type,
      severity: event.severity,
      details: event.details,
      timestamp: event.timestamp.toISOString(),
    });

    if (error) {
      console.error('Failed to log security event:', error);
    }
  }

  static async analyzeActivity(
    userId: string,
    ipAddress: string,
    userAgent: string,
    attemptType: 'password' | 'magic_link' | 'oauth'
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    const now = new Date();

    // Get recent security events
    const supabase = createClient();
    const { data: events, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Failed to fetch security events:', error);
      return alerts;
    }

    // Check for rapid attempts
    const recentAttempts = events.filter(
      e =>
        e.event_type === 'login_attempt' &&
        now.getTime() - new Date(e.timestamp).getTime() <
          this.SUSPICIOUS_PATTERNS.rapidAttempts.windowMs
    );

    if (recentAttempts.length >= this.SUSPICIOUS_PATTERNS.rapidAttempts.threshold) {
      alerts.push({
        type: 'rapid_attempts',
        message: 'Multiple login attempts detected in a short time period',
        severity: 'high',
        timestamp: now,
        metadata: {
          attempts: recentAttempts.length,
          timeWindow: this.SUSPICIOUS_PATTERNS.rapidAttempts.windowMs,
        },
      });
    }

    // Check for multiple IP addresses
    const uniqueIPs = new Set(
      events
        .filter(e => e.event_type === 'login_attempt')
        .map(e => e.details.ipAddress)
        .filter(Boolean)
    );

    if (uniqueIPs.size >= this.SUSPICIOUS_PATTERNS.multipleIPs.threshold) {
      alerts.push({
        type: 'multiple_ips',
        message: 'Login attempts from multiple IP addresses detected',
        severity: 'high',
        timestamp: now,
        metadata: {
          ipCount: uniqueIPs.size,
          ips: Array.from(uniqueIPs),
        },
      });
    }

    // Check for mixed authentication types
    const recentAuthTypes = new Set(
      events
        .filter(
          e =>
            e.event_type === 'login_attempt' &&
            now.getTime() - new Date(e.timestamp).getTime() <
              this.SUSPICIOUS_PATTERNS.mixedAuthTypes.windowMs
        )
        .map(e => e.details.attemptType)
    );

    if (recentAuthTypes.size >= this.SUSPICIOUS_PATTERNS.mixedAuthTypes.threshold) {
      alerts.push({
        type: 'mixed_auth_types',
        message: 'Multiple authentication methods used in a short time period',
        severity: 'medium',
        timestamp: now,
        metadata: {
          authTypes: Array.from(recentAuthTypes),
        },
      });
    }

    // Check for failed attempts
    const failedAttempts = events.filter(
      e =>
        e.event_type === 'login_attempt' &&
        e.details.success === false &&
        now.getTime() - new Date(e.timestamp).getTime() <
          this.SUSPICIOUS_PATTERNS.failedAttempts.windowMs
    );

    if (failedAttempts.length >= this.SUSPICIOUS_PATTERNS.failedAttempts.threshold) {
      alerts.push({
        type: 'failed_attempts',
        message: 'Multiple failed login attempts detected',
        severity: 'critical',
        timestamp: now,
        metadata: {
          attempts: failedAttempts.length,
          timeWindow: this.SUSPICIOUS_PATTERNS.failedAttempts.windowMs,
        },
      });
    }

    // Check for unusual user agent changes
    const recentUserAgents = new Set(
      events
        .filter(
          e =>
            e.event_type === 'login_attempt' &&
            now.getTime() - new Date(e.timestamp).getTime() < 3600000 // 1 hour
        )
        .map(e => e.details.userAgent)
    );

    if (recentUserAgents.size > 1) {
      alerts.push({
        type: 'user_agent_change',
        message: 'Login attempts from different browsers/devices detected',
        severity: 'medium',
        timestamp: now,
        metadata: {
          userAgents: Array.from(recentUserAgents),
        },
      });
    }

    // Log the current attempt
    await this.logEvent(userId, {
      type: 'login_attempt',
      severity: alerts.length > 0 ? 'high' : 'low',
      details: {
        ipAddress,
        userAgent,
        attemptType,
        success: false,
        alerts: alerts.map(a => a.type),
      },
      timestamp: now,
    });

    return alerts;
  }

  static async getSecurityScore(userId: string): Promise<number> {
    const supabase = createClient();

    // Get user's security settings and events
    const { data: security, error: securityError } = await supabase
      .from('user_security')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (securityError) {
      console.error('Failed to fetch security settings:', securityError);
      return 0;
    }

    let score = 0;

    // 2FA enabled
    if (security.two_factor_enabled) score += 30;

    // Strong password (assuming this is tracked)
    if (security.password_strength >= 8) score += 20;

    // Recent security events
    const { data: events, error: eventsError } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!eventsError && events) {
      // Deduct points for suspicious activities
      const suspiciousEvents = events.filter(
        e => e.severity === 'high' || e.severity === 'critical'
      );
      score -= suspiciousEvents.length * 5;
    }

    return Math.max(0, Math.min(100, score));
  }
}
