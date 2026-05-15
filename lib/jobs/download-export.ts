/** Browser download helpers for exporting job data (CSV / JSON). */

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export interface JobListExportInput {
  id: string;
  title: string;
  status: string;
  workType?: string | null;
  paymentType?: string | null;
  sourceLabel?: string | null;
  incomeProfileType?: string | null;
  estimatedAmount?: number | null;
  jobRevenue?: number;
  jobExpenses?: number;
  remainingBalance?: number | null;
  estimatedProfit?: number | null;
  createdAt: string;
  updatedAt?: string;
  client?: { name?: string | null } | null;
  service?: { name?: string | null } | null;
  quotes?: { length: number } | unknown[] | null;
  invoices?: { length: number } | unknown[] | null;
}

function quoteCount(job: JobListExportInput): number {
  const q = job.quotes;
  if (Array.isArray(q)) return q.length;
  return 0;
}

function invoiceCount(job: JobListExportInput): number {
  const inv = job.invoices;
  if (Array.isArray(inv)) return inv.length;
  return 0;
}

export function jobsToCsv(jobs: JobListExportInput[]): string {
  const headers = [
    'id',
    'title',
    'status',
    'work_type',
    'payment_type',
    'source_label',
    'income_profile_type',
    'client_name',
    'service_name',
    'estimated_amount',
    'job_revenue',
    'job_expenses',
    'remaining_balance',
    'estimated_profit',
    'quotes_count',
    'invoices_count',
    'created_at',
    'updated_at',
  ];

  const rows = jobs.map(job =>
    [
      job.id,
      job.title,
      job.status,
      job.workType ?? '',
      job.paymentType ?? '',
      job.sourceLabel ?? '',
      job.incomeProfileType ?? '',
      job.client?.name ?? '',
      job.service?.name ?? '',
      job.estimatedAmount != null ? String(job.estimatedAmount) : '',
      String(job.jobRevenue ?? 0),
      String(job.jobExpenses ?? 0),
      job.remainingBalance != null ? String(job.remainingBalance) : '',
      job.estimatedProfit != null ? String(job.estimatedProfit) : '',
      String(quoteCount(job)),
      String(invoiceCount(job)),
      job.createdAt,
      job.updatedAt ?? '',
    ].map(v => csvCell(String(v)))
  );

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

export function triggerDownload(filename: string, body: string, mime: string): void {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJobsJson(filename: string, payload: unknown): void {
  triggerDownload(filename, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
}
