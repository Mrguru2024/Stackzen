import { createClient } from '@/lib/supabase/client';

export type SecurityEventType =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'password_change'
  | '2fa_enable'
  | '2fa_disable'
  | 'device_added'
  | 'device_removed'
  | 'location_blocked'
  | 'suspicious_activity'
  | 'security_settings_changed'
  | 'vpn_detected'
  | 'proxy_detected'
  | 'tor_detected'
  | 'threat_detected';

export type SecurityEventSeverity = 'info' | 'warning' | 'error' | 'critical';

export type SecurityEvent = {
  id: string;
  user_id: string;
  event_type: SecurityEventType;
  severity: SecurityEventSeverity;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  location?: {
    country: string;
    city: string;
    isp?: string;
  };
  device_info?: {
    fingerprint: string;
    type: string;
    browser: string;
  };
  created_at: string;
};

export class SecurityAudit {
  private static async logEvent(
    userId: string,
    eventType: SecurityEventType,
    severity: SecurityEventSeverity,
    details: Record<string, any>,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      location?: SecurityEvent['location'];
      deviceInfo?: SecurityEvent['device_info'];
    }
  ): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from('security_audit_log').insert({
      user_id: userId,
      event_type: eventType,
      severity,
      details,
      ip_address: metadata?.ipAddress,
      user_agent: metadata?.userAgent,
      location: metadata?.location,
      device_info: metadata?.deviceInfo,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error logging security event:', error);
      throw new Error('Failed to log security event');
    }
  }

  static async getEvents(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      eventTypes?: SecurityEventType[];
      severity?: SecurityEventSeverity[];
      limit?: number;
      offset?: number;
    }
  ): Promise<SecurityEvent[]> {
    const supabase = createClient();

    let query = supabase
      .from('security_audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    if (options?.eventTypes?.length) {
      query = query.in('event_type', options.eventTypes);
    }

    if (options?.severity?.length) {
      query = query.in('severity', options.severity);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching security events:', error);
      throw new Error('Failed to fetch security events');
    }

    return data as SecurityEvent[];
  }

  static async getEventStats(userId: string): Promise<{
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecurityEventSeverity, number>;
    recentThreats: number;
  }> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('security_audit_log')
      .select('event_type, severity')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching security event stats:', error);
      throw new Error('Failed to fetch security event stats');
    }

    const eventsByType: Record<SecurityEventType, number> = {} as Record<SecurityEventType, number>;
    const eventsBySeverity: Record<SecurityEventSeverity, number> = {} as Record<
      SecurityEventSeverity,
      number
    >;

    const rows = (data ?? []) as {
      event_type: SecurityEventType;
      severity: SecurityEventSeverity;
    }[];

    rows.forEach(event => {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    const recentThreats = rows.filter(
      event => event.severity === 'error' || event.severity === 'critical'
    ).length;

    return {
      totalEvents: rows.length,
      eventsByType,
      eventsBySeverity,
      recentThreats,
    };
  }

  // Helper methods for common events
  static async logLoginAttempt(
    userId: string,
    success: boolean,
    metadata: {
      ipAddress: string;
      userAgent: string;
      location?: SecurityEvent['location'];
      deviceInfo?: SecurityEvent['device_info'];
    }
  ): Promise<void> {
    await this.logEvent(
      userId,
      success ? 'login_success' : 'login_failure',
      success ? 'info' : 'warning',
      { success },
      metadata
    );
  }

  static async logSecuritySettingsChange(
    userId: string,
    changes: Record<string, any>,
    metadata: {
      ipAddress: string;
      userAgent: string;
      location?: SecurityEvent['location'];
      deviceInfo?: SecurityEvent['device_info'];
    }
  ): Promise<void> {
    await this.logEvent(userId, 'security_settings_changed', 'info', { changes }, metadata);
  }

  static async logThreatDetection(
    userId: string,
    threatDetails: {
      type: string;
      level: 'warning' | 'error' | 'critical';
      description: string;
    },
    metadata: {
      ipAddress: string;
      userAgent: string;
      location?: SecurityEvent['location'];
      deviceInfo?: SecurityEvent['device_info'];
    }
  ): Promise<void> {
    await this.logEvent(
      userId,
      'threat_detected',
      threatDetails.level as SecurityEventSeverity,
      threatDetails,
      metadata
    );
  }
}
