import React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SecurityMetrics } from './SecurityMetrics';

// Simple SVG bar chart helper
function BarChart({ data = [], labels = [] }: { data: number[]; labels: string[] }) {
  const max = Math.max(...(data || [1]), 1);
  return (
    <svg width={320} height={100} className="my-2">
      {(data || []).map((v, i) => (
        <rect
          key={i}
          x={i * 20 + 30}
          y={100 - (v / max) * 80}
          width={14}
          height={(v / max) * 80}
          fill="#2563eb"
        />
      ))}
      {(labels || []).map((l, i) => (
        <text key={l} x={i * 20 + 37} y={95} fontSize={8} textAnchor="middle" fill="#555">
          {l}
        </text>
      ))}
    </svg>
  );
}

// Add a simple line chart for login attempts
function LineChart({ data = [], labels = [] }: { data: number[]; labels: string[] }) {
  const max = Math.max(...(data || [1]), 1);
  const points = (data || []).map((v, i) => `${i * 20 + 30},${100 - (v / max) * 80}`).join(' ');
  return (
    <svg width={320} height={100} className="my-2">
      <polyline fill="none" stroke="#16a34a" strokeWidth="2" points={points} />
      {(data || []).map((v, i) => (
        <circle key={i} cx={i * 20 + 30} cy={100 - (v / max) * 80} r={3} fill="#16a34a" />
      ))}
      {(labels || []).map((l, i) => (
        <text key={l} x={i * 20 + 30} y={95} fontSize={8} textAnchor="middle" fill="#555">
          {l}
        </text>
      ))}
    </svg>
  );
}

/** Buckets critical errors by calendar day for the last 15 days (inclusive). */
function buildLast15DaysErrorChart(criticalErrors: unknown[] | undefined | null): {
  chartLabels: string[];
  chartData: number[];
} {
  const errorCounts: Record<string, number> = {};
  const anchorDate = new Date();
  for (let i = 14; i >= 0; i--) {
    const d = new Date(anchorDate);
    d.setDate(anchorDate.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    errorCounts[key] = 0;
  }
  (criticalErrors || []).forEach((err: any) => {
    const key = new Date(err.createdAt).toISOString().slice(0, 10);
    if (errorCounts[key] !== undefined) errorCounts[key]++;
  });
  const chartLabels = Object.keys(errorCounts).map(k => k.slice(5));
  const chartData = Object.values(errorCounts);
  return { chartLabels, chartData };
}

function AuditLogTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionSearch, setActionSearch] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [scheduleCron, setScheduleCron] = useState('0 0 * * *');

  // Fetch unique actions for filter dropdown
  useEffect(() => {
    fetch('/api/admin/audit-logs?page=1&pageSize=1')
      .then(res => res.json())
      .then(() => {
        // Optionally, you could add a dedicated endpoint for unique actions
        // For now, just hardcode a few common ones or leave blank
        setActions([
          'LOGIN_ATTEMPT',
          'SESSION_CREATED',
          'SESSION_ENDED',
          'SUSPICIOUS_SESSION_ACTIVITY',
        ]);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (selectedSeverities.length) params.append('severity', selectedSeverities.join(','));
    if (selectedActions.length) params.append('action', selectedActions.join(','));
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    fetch(`/api/admin/audit-logs?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch audit logs');
        return res.json();
      })
      .then(data => {
        let filtered = data.logs;
        if (actionSearch) {
          filtered = filtered.filter((log: any) =>
            log.action?.toLowerCase().includes(actionSearch.toLowerCase())
          );
        }
        setLogs(filtered);
        setTotalPages(data.totalPages);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [
    page,
    pageSize,
    selectedSeverities,
    selectedActions,
    userId,
    userEmail,
    startDate,
    endDate,
    actionSearch,
  ]);

  // Fetch export schedules
  useEffect(() => {
    fetch('/api/admin/audit-logs?schedule=list')
      .then(res => res.json())
      .then(data => setSchedules(data.schedules || []));
  }, [showSchedule]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (selectedSeverities.length) params.append('severity', selectedSeverities.join(','));
    if (selectedActions.length) params.append('action', selectedActions.join(','));
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('export', 'csv');
    window.open(`/api/admin/audit-logs?${params.toString()}`, '_blank');
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: scheduleEmail,
        cron: scheduleCron,
        filters: {
          severity: selectedSeverities,
          action: selectedActions,
          userId,
          userEmail,
          startDate,
          endDate,
        },
      }),
    });
    setShowSchedule(false);
    setScheduleEmail('');
    setScheduleCron('0 0 * * *');
  };

  return (
    <div className="mt-6">
      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold">Audit Logs</h3>
        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-select severity */}
          <div className="flex items-center gap-1">
            {['critical', 'error', 'warning', 'info'].map(s => (
              <label key={s} className="flex items-center gap-0.5 text-xs">
                <input
                  type="checkbox"
                  checked={selectedSeverities.includes(s)}
                  onChange={e => {
                    setSelectedSeverities(sel =>
                      e.target.checked ? [...sel, s] : sel.filter(x => x !== s)
                    );
                    setPage(1);
                  }}
                />
                {s}
              </label>
            ))}
          </div>
          {/* Multi-select action */}
          <div className="flex items-center gap-1">
            {(actions || []).map(a => (
              <label key={a} className="flex items-center gap-0.5 text-xs">
                <input
                  type="checkbox"
                  checked={selectedActions.includes(a)}
                  onChange={e => {
                    setSelectedActions(sel =>
                      e.target.checked ? [...sel, a] : sel.filter(x => x !== a)
                    );
                    setPage(1);
                  }}
                />
                {a}
              </label>
            ))}
          </div>
          <input
            className="rounded border px-2 py-1 text-xs dark:bg-gray-800"
            placeholder="User ID"
            value={userId}
            onChange={e => {
              setUserId(e.target.value);
              setPage(1);
            }}
            style={{ width: 100 }}
            title="User ID"
          />
          <input
            className="rounded border px-2 py-1 text-xs dark:bg-gray-800"
            placeholder="User email"
            value={userEmail}
            onChange={e => {
              setUserEmail(e.target.value);
              setPage(1);
            }}
            style={{ width: 120 }}
            title="User email"
          />
          <input
            type="date"
            className="rounded border px-2 py-1 text-xs dark:bg-gray-800"
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            title="Start date"
          />
          <input
            type="date"
            className="rounded border px-2 py-1 text-xs dark:bg-gray-800"
            value={endDate}
            onChange={e => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            title="End date"
          />
          <input
            className="rounded border px-2 py-1 text-xs dark:bg-gray-800"
            placeholder="Action contains..."
            value={actionSearch}
            onChange={e => {
              setActionSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 120 }}
            title="Advanced action search"
          />
          <button
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
            onClick={handleExport}
            type="button"
            title="Export filtered logs as CSV"
          >
            Export CSV
          </button>
          <button
            className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
            onClick={() => setShowSchedule(true)}
            type="button"
            title="Schedule export"
          >
            Schedule Export
          </button>
        </div>
        <div className="mt-2 flex gap-2 md:mt-0">
          <button
            className="rounded bg-gray-200 px-2 py-1 text-xs disabled:opacity-50 dark:bg-gray-700"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <span className="text-xs">
            Page {page} of {totalPages}
          </span>
          <button
            className="rounded bg-gray-200 px-2 py-1 text-xs disabled:opacity-50 dark:bg-gray-700"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
      {/* Schedule export modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            className="w-full max-w-sm space-y-3 rounded bg-white p-6 shadow dark:bg-gray-900"
            onSubmit={handleSchedule}
          >
            <h4 className="font-semibold">Schedule Export</h4>
            <input
              className="w-full rounded border px-2 py-1 text-xs dark:bg-gray-800"
              placeholder="Recipient email"
              value={scheduleEmail}
              onChange={e => setScheduleEmail(e.target.value)}
              required
              type="email"
            />
            <input
              className="w-full rounded border px-2 py-1 text-xs dark:bg-gray-800"
              placeholder="Cron (e.g. 0 0 * * *)"
              value={scheduleCron}
              onChange={e => setScheduleCron(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded bg-gray-200 px-2 py-1 text-xs dark:bg-gray-700"
                onClick={() => setShowSchedule(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
      {/* List of export schedules */}
      {(schedules || []).length > 0 && (
        <div className="mb-2 mt-4 rounded border border-gray-200 p-2 text-xs dark:border-gray-700">
          <div className="mb-1 font-semibold">Scheduled Exports</div>
          <ul>
            {(schedules || []).map(s => (
              <li key={s.id} className="mb-1">
                <span className="font-mono">{s.cron}</span> → <span>{s.email}</span> (filters:{' '}
                {JSON.stringify(s.filters)})
              </li>
            ))}
          </ul>
        </div>
      )}
      {loading ? (
        <div>Loading logs...</div>
      ) : error ? (
        <div className="text-destructive">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left">Time</th>
                <th className="px-2 py-1 text-left">User</th>
                <th className="px-2 py-1 text-left">Action</th>
                <th className="px-2 py-1 text-left">Severity</th>
                <th className="px-2 py-1 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {(logs || []).map(log => (
                <tr key={log.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="whitespace-nowrap px-2 py-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-2 py-1">{log.user?.email || log.userId || '-'}</td>
                  <td className="px-2 py-1">{log.action}</td>
                  <td className="px-2 py-1">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        log.severity === 'critical'
                          ? 'bg-red-600 text-white'
                          : log.severity === 'error'
                            ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : log.severity === 'warning'
                              ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : log.severity === 'info'
                                ? 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-2 py-1" title={JSON.stringify(log.details)}>
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function SuperAdminDiagnostics({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [securityCheck, setSecurityCheck] = useState<any>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  // Vercel Deployments state
  const [vercelDeployments, setVercelDeployments] = useState<any[]>([]);
  const [vercelLoading, setVercelLoading] = useState(false);
  const [vercelError, setVercelError] = useState<string | null>(null);
  // Sentry Reports state
  const [sentryReports, setSentryReports] = useState<{ issues: any[]; releases: any[] }>({
    issues: [],
    releases: [],
  });
  const [sentryLoading, setSentryLoading] = useState(false);
  const [sentryError, setSentryError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    setLoading(true);
    fetch('/api/debug/diagnostics')
      .then(res => {
        if (!res.ok) throw new Error('Not authorized or failed to fetch diagnostics');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    setVercelLoading(true);
    fetch('/api/admin/vercel-deployments')
      .then(res => res.json())
      .then(data => setVercelDeployments(data.deployments || []))
      .catch(e => setVercelError(e.message))
      .finally(() => setVercelLoading(false));
    setSentryLoading(true);
    fetch('/api/admin/sentry-reports')
      .then(res => res.json())
      .then(data => setSentryReports({ issues: data.issues || [], releases: data.releases || [] }))
      .catch(e => setSentryError(e.message))
      .finally(() => setSentryLoading(false));
  }, [isSuperAdmin]);

  const fetchHealth = () => {
    setHealthLoading(true);
    setHealthError(null);
    fetch('/api/admin/system-health')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch system health');
        return res.json();
      })
      .then(setHealth)
      .catch(e => setHealthError(e.message))
      .finally(() => setHealthLoading(false));
  };

  const runSecurityCheck = async () => {
    setSecurityLoading(true);
    setSecurityError(null);
    try {
      // Fetch security events
      const eventsRes = await fetch('/api/admin/security-events');
      if (!eventsRes.ok) throw new Error('Failed to fetch security events');
      const eventsData = await eventsRes.json();
      // Fetch audit stats
      const auditRes = await fetch('/api/admin/audit-logs?stats=1');
      if (!auditRes.ok) throw new Error('Failed to fetch audit stats');
      const auditData = await auditRes.json();
      // Aggregate
      setSecurityCheck({
        suspiciousLogins: eventsData.events.filter((e: any) => e.type === 'suspicious').length,
        blockedIPs: eventsData.stats.blockedIPs,
        suspiciousIPs: eventsData.stats.suspiciousIPs,
        recentThreats: eventsData.events.filter(
          (e: any) => e.severity === 'critical' || e.severity === 'high'
        ).length,
        auditStats: auditData.stats || {},
      });
      setSecurityLoading(false);
    } catch (e: any) {
      setSecurityError(e.message || 'Failed to run security check');
      setSecurityLoading(false);
    }
  };

  if (!isSuperAdmin) return null;
  if (loading) return <div>Loading diagnostics...</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!data) return null;

  const { chartLabels, chartData } = buildLast15DaysErrorChart(data.criticalErrors);

  // Prepare login attempts chart data
  const loginAttemptsByDay = (health || data.systemHealth)?.loginAttemptsByDay ?? {};
  const loginLabels = Object.keys(loginAttemptsByDay).map(k => k.slice(5));
  const loginData: number[] = Object.values(loginAttemptsByDay).map(v =>
    typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0
  );

  // API latency stats
  const apiLatencyStats = (health || data.systemHealth)?.apiLatencyStats || {
    avg: 0,
    min: 0,
    max: 0,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session & User Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            User: {data.user.email} ({data.user.role})
          </div>
          <div>Session expires: {data.sessionExpires}</div>
          <div>Last login: {data.user.lastLogin || 'N/A'}</div>
          <div>IP address: {data.ip}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            className="mb-2 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
            onClick={fetchHealth}
            disabled={healthLoading}
          >
            {healthLoading ? 'Checking...' : 'Run Real-Time Health Check'}
          </button>
          {healthError && <div className="text-destructive">{healthError}</div>}
          <div>Database: {(health || data.systemHealth).database}</div>
          <div>Redis: {(health || data.systemHealth).redis}</div>
          <div>API Health:</div>
          <ul className="ml-4 list-disc">
            {((health || data.systemHealth)?.api || []).map((ep: any) => (
              <li key={ep.endpoint}>
                {ep.endpoint}: {ep.status}
              </li>
            ))}
          </ul>
          <div>Last checked: {(health || data.systemHealth).lastChecked}</div>
        </CardContent>
      </Card>

      {/* Security Check Section */}
      <Card>
        <CardHeader>
          <CardTitle>Security Check & Audits</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            className="mb-2 rounded bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700"
            onClick={runSecurityCheck}
            disabled={securityLoading}
          >
            {securityLoading ? 'Checking...' : 'Run Security Check'}
          </button>
          {securityError && <div className="text-destructive">{securityError}</div>}
          {securityCheck && (
            <div className="space-y-2">
              <div>
                Suspicious Logins:{' '}
                <span className="font-bold">{securityCheck.suspiciousLogins}</span>
              </div>
              <div>
                Blocked IPs: <span className="font-bold">{securityCheck.blockedIPs}</span>
              </div>
              <div>
                Suspicious IPs: <span className="font-bold">{securityCheck.suspiciousIPs}</span>
              </div>
              <div>
                Recent Threats: <span className="font-bold">{securityCheck.recentThreats}</span>
              </div>
              <div className="mt-2">
                <div className="font-semibold">Audit Stats:</div>
                <div>Total Events: {securityCheck.auditStats.totalEvents}</div>
                <div>
                  Events by Type:{' '}
                  <pre className="inline">
                    {JSON.stringify(securityCheck.auditStats.eventsByType, null, 2)}
                  </pre>
                </div>
                <div>
                  Events by Severity:{' '}
                  <pre className="inline">
                    {JSON.stringify(securityCheck.auditStats.eventsBySeverity, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Metrics Visualization */}
      <SecurityMetrics
        blockedIPs={securityCheck?.blockedIPs || 0}
        suspiciousIPs={securityCheck?.suspiciousIPs || 0}
      />

      <Card>
        <CardHeader>
          <CardTitle>Critical Errors (last 15 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">Error frequency (last 15 days):</div>
          <BarChart data={chartData} labels={chartLabels} />
          {(Array.isArray(data?.criticalErrors) ? data.criticalErrors : []).length === 0 ? (
            <div>No critical errors in the last 15 days.</div>
          ) : (
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left">Time</th>
                  <th className="text-left">Message</th>
                  <th className="text-left">Stack (truncated)</th>
                </tr>
              </thead>
              <tbody>
                {(data?.criticalErrors || []).map((err: any) => (
                  <tr key={err.id}>
                    <td>{new Date(err.createdAt).toLocaleString()}</td>
                    <td>{err.message}</td>
                    <td>{err.stack ? err.stack.slice(0, 60) + '...' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login Attempts (last 15 days)</CardTitle>
          <CardDescription>
            Tracks all login attempts (successful and failed) for the past 15 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart data={loginData || []} labels={loginLabels || []} />
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {(loginLabels || []).map((l, i) => (
              <span key={l} className="inline-block">
                {l}: {(loginData || [])[i]}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Latency</CardTitle>
          <CardDescription>Real-time API endpoint latency (ms)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-semibold">Avg:</span> {apiLatencyStats.avg} ms
            </div>
            <div>
              <span className="font-semibold">Min:</span> {apiLatencyStats.min} ms
            </div>
            <div>
              <span className="font-semibold">Max:</span> {apiLatencyStats.max} ms
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App & Deployment</CardTitle>
        </CardHeader>
        <CardContent>
          <div>App version: {data.appVersion}</div>
          <div>Environment: {data.environment}</div>
          <div>Last deployment: {data.lastDeployment}</div>
        </CardContent>
      </Card>

      {/* Vercel Deployments Card */}
      <Card>
        <CardHeader>
          <CardTitle>Vercel Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          {vercelLoading ? (
            <div>Loading deployments...</div>
          ) : vercelError ? (
            <div className="text-destructive">{vercelError}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Commit</th>
                    <th>Author</th>
                    <th>Time</th>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  {vercelDeployments.map(dep => (
                    <tr key={dep.id}>
                      <td>{dep.state}</td>
                      <td>
                        {dep.commit ? (
                          <a
                            href={`https://github.com/${dep.meta?.githubRepoSlug || ''}/commit/${dep.commit}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {dep.commit.slice(0, 7)}
                          </a>
                        ) : (
                          '-'
                        )}
                        <div className="text-xs text-muted-foreground">{dep.commitMessage}</div>
                      </td>
                      <td>{dep.author}</td>
                      <td>{new Date(dep.createdAt).toLocaleString()}</td>
                      <td>
                        {dep.url ? (
                          <a
                            href={dep.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Visit
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sentry Reports Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sentry Reports (StackZen)</CardTitle>
        </CardHeader>
        <CardContent>
          {sentryLoading ? (
            <div>Loading Sentry data...</div>
          ) : sentryError ? (
            <div className="text-destructive">{sentryError}</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="mb-1 font-semibold">Recent Issues</div>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>First Seen</th>
                      <th>Last Seen</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentryReports.issues.map(issue => (
                      <tr key={issue.id}>
                        <td>{issue.title}</td>
                        <td>{issue.status}</td>
                        <td>
                          {issue.firstSeen ? new Date(issue.firstSeen).toLocaleString() : '-'}
                        </td>
                        <td>{issue.lastSeen ? new Date(issue.lastSeen).toLocaleString() : '-'}</td>
                        <td>
                          <a
                            href={`https://sentry.io/organizations/${process.env.NEXT_PUBLIC_SENTRY_ORG || 'your-org'}/issues/${issue.id}/?project=${issue.project?.id || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div className="mb-1 font-semibold">Recent Releases</div>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Date</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentryReports.releases.map(release => (
                      <tr key={release.version}>
                        <td>{release.version}</td>
                        <td>
                          {release.dateCreated
                            ? new Date(release.dateCreated).toLocaleString()
                            : '-'}
                        </td>
                        <td>
                          <a
                            href={`https://sentry.io/organizations/${process.env.NEXT_PUBLIC_SENTRY_ORG || 'your-org'}/releases/${release.version}/?project=${process.env.NEXT_PUBLIC_SENTRY_PROJECT || 'stackzen'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AuditLogTable />
    </div>
  );
}
