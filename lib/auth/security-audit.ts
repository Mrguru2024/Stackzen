/**
 * @deprecated Server writes use `lib/security/audit-log.ts` (Prisma only).
 * Reads prefer Prisma via `GET /api/security/audit-events` or `lib/security/audit-query.ts`.
 * Legacy Supabase `security_audit_log` may still exist for historical rows — not written here.
 */
import { AUDIT_ACTIONS } from '@/lib/security/audit-catalog';
import { writeAuditLog } from '@/lib/security/audit-log';
import { queryAuditLogs } from '@/lib/security/audit-query';

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
  details: Record<string, unknown>;
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

const LEGACY_ACTION_MAP: Record<string, SecurityEventType> = {
  [AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS]: 'login_success',
  [AUDIT_ACTIONS.AUTH_LOGIN_FAILED]: 'login_failure',
  [AUDIT_ACTIONS.AUTH_2FA_ENABLED]: '2fa_enable',
  [AUDIT_ACTIONS.AUTH_2FA_DISABLED]: '2fa_disable',
  [AUDIT_ACTIONS.SECURITY_SETTINGS_CHANGED]: 'security_settings_changed',
  [AUDIT_ACTIONS.THREAT_DETECTED]: 'threat_detected',
  [AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY]: 'suspicious_activity',
  [AUDIT_ACTIONS.SESSION_CREATED]: 'device_added',
  [AUDIT_ACTIONS.SESSION_REVOKED]: 'device_removed',
};

function mapRowToSecurityEvent(row: {
  id: string;
  userId: string | null;
  action: string;
  severity: string;
  details: unknown;
  ipAddress: string | null;
  createdAt: Date;
}): SecurityEvent {
  const details =
    row.details && typeof row.details === 'object' && !Array.isArray(row.details)
      ? (row.details as Record<string, unknown>)
      : {};

  const eventType =
    LEGACY_ACTION_MAP[row.action] ??
    (row.action.startsWith('auth.login') ? 'login_attempt' : 'suspicious_activity');

  return {
    id: row.id,
    user_id: row.userId ?? '',
    event_type: eventType,
    severity: row.severity as SecurityEventSeverity,
    details,
    ip_address: row.ipAddress ?? undefined,
    user_agent: typeof details.userAgent === 'string' ? details.userAgent : undefined,
    location: details.location as SecurityEvent['location'],
    device_info: details.deviceInfo as SecurityEvent['device_info'],
    created_at: row.createdAt.toISOString(),
  };
}

const LEGACY_TO_AUDIT_ACTION: Partial<Record<SecurityEventType, string>> = {
  login_success: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
  login_failure: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
  '2fa_enable': AUDIT_ACTIONS.AUTH_2FA_ENABLED,
  '2fa_disable': AUDIT_ACTIONS.AUTH_2FA_DISABLED,
  security_settings_changed: AUDIT_ACTIONS.SECURITY_SETTINGS_CHANGED,
  threat_detected: AUDIT_ACTIONS.THREAT_DETECTED,
  suspicious_activity: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
};

export class SecurityAudit {
  private static async logEvent(
    userId: string,
    eventType: SecurityEventType,
    severity: SecurityEventSeverity,
    details: Record<string, unknown>,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      location?: SecurityEvent['location'];
      deviceInfo?: SecurityEvent['device_info'];
    }
  ): Promise<void> {
    const action = LEGACY_TO_AUDIT_ACTION[eventType] ?? `legacy.${eventType}`;

    await writeAuditLog({
      userId,
      action,
      severity,
      details: {
        ...details,
        userAgent: metadata?.userAgent,
        location: metadata?.location,
        deviceInfo: metadata?.deviceInfo,
        legacyEventType: eventType,
      },
      ipAddress: metadata?.ipAddress,
    });
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
    const actions = options?.eventTypes
      ?.map(t => LEGACY_TO_AUDIT_ACTION[t])
      .filter((a): a is string => Boolean(a));

    const { rows } = await queryAuditLogs({
      userId,
      startDate: options?.startDate,
      endDate: options?.endDate,
      severity: options?.severity?.length === 1 ? options.severity[0] : undefined,
      skip: options?.offset,
      take: options?.limit ?? 50,
    });

    let mapped = rows.map(mapRowToSecurityEvent);

    if (actions?.length) {
      mapped = mapped.filter(e => {
        const action = LEGACY_TO_AUDIT_ACTION[e.event_type];
        return action && actions.includes(action);
      });
    }

    if (options?.severity && options.severity.length > 1) {
      mapped = mapped.filter(e => options.severity!.includes(e.severity));
    }

    return mapped;
  }

  static async getEventStats(userId: string): Promise<{
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecurityEventSeverity, number>;
    recentThreats: number;
  }> {
    const { rows } = await queryAuditLogs({ userId, take: 500 });

    const eventsByType = {} as Record<SecurityEventType, number>;
    const eventsBySeverity = {} as Record<SecurityEventSeverity, number>;

    for (const row of rows) {
      const event = mapRowToSecurityEvent(row);
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    }

    const recentThreats = rows.filter(
      r => r.severity === 'error' || r.severity === 'critical'
    ).length;

    return {
      totalEvents: rows.length,
      eventsByType,
      eventsBySeverity,
      recentThreats,
    };
  }

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
    changes: Record<string, unknown>,
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
