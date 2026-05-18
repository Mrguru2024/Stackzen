import 'server-only';

import { getMetRepairsApiKey, getMetRepairsApiUrl, isMetRepairsConfigured } from '@/lib/integrations/met-repairs/config';
import { MET_REPAIRS_API_PATHS } from '@/lib/integrations/met-repairs/paths';
import {
  mapContractorDto,
  mapExpenseDto,
  mapFinancialSummaryDto,
  mapInvoiceDto,
  mapJobDto,
  mapPaymentDto,
  metRepairCommandCenterSnapshotSchema,
  metRepairContractorListSchema,
  metRepairExpenseListSchema,
  metRepairInvoiceListSchema,
  metRepairJobListSchema,
  metRepairPaymentListSchema,
  metRepairSummaryResponseSchema,
  unwrapList,
  unwrapSingle,
} from '@/lib/integrations/met-repairs/schema';
import type {
  MetRepairContractor,
  MetRepairExpense,
  MetRepairFinancialSummary,
  MetRepairInvoice,
  MetRepairJob,
  MetRepairPayment,
} from '@/lib/integrations/met-repairs/types';
import { buildCommandCenterFromRecords } from '@/lib/integrations/met-repairs/financial-calculations';
import type { MetRepairCommandCenterSnapshot } from '@/lib/integrations/met-repairs/types';

export class MetRepairsApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = 'MetRepairsApiError';
    this.status = options?.status;
    this.code = options?.code;
  }
}

function assertConfigured(): void {
  if (!isMetRepairsConfigured()) {
    throw new MetRepairsApiError(
      'MET Repairs integration is not configured. Set MET_REPAIRS_API_URL and MET_REPAIRS_API_KEY.',
      { code: 'NOT_CONFIGURED' }
    );
  }
}

async function metRepairsFetch<T>(
  path: string,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  assertConfigured();
  const base = getMetRepairsApiUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getMetRepairsApiKey()}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
  } catch (cause) {
    throw new MetRepairsApiError(
      cause instanceof Error ? cause.message : 'Failed to reach MET Repairs API',
      { code: 'NETWORK_ERROR' }
    );
  }

  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new MetRepairsApiError('MET Repairs API returned invalid JSON', {
      status: response.status,
      code: 'INVALID_JSON',
    });
  }

  if (!response.ok) {
    const message =
      typeof json === 'object' &&
      json !== null &&
      'error' in json &&
      typeof (json as { error: unknown }).error === 'string'
        ? (json as { error: string }).error
        : `MET Repairs API error (${response.status})`;
    throw new MetRepairsApiError(message, { status: response.status, code: 'HTTP_ERROR' });
  }

  try {
    return schema.parse(json);
  } catch {
    throw new MetRepairsApiError('MET Repairs API response failed validation', {
      status: response.status,
      code: 'VALIDATION_ERROR',
    });
  }
}

export async function getMetRepairJobs(): Promise<MetRepairJob[]> {
  const raw = await metRepairsFetch(MET_REPAIRS_API_PATHS.jobs, metRepairJobListSchema);
  return unwrapList(raw).map(mapJobDto);
}

export async function getMetRepairInvoices(): Promise<MetRepairInvoice[]> {
  const raw = await metRepairsFetch(MET_REPAIRS_API_PATHS.invoices, metRepairInvoiceListSchema);
  return unwrapList(raw).map(mapInvoiceDto);
}

export async function getMetRepairPayments(): Promise<MetRepairPayment[]> {
  const raw = await metRepairsFetch(MET_REPAIRS_API_PATHS.payments, metRepairPaymentListSchema);
  return unwrapList(raw).map(mapPaymentDto);
}

export async function getMetRepairExpenses(): Promise<MetRepairExpense[]> {
  const raw = await metRepairsFetch(MET_REPAIRS_API_PATHS.expenses, metRepairExpenseListSchema);
  return unwrapList(raw).map(mapExpenseDto);
}

export async function getMetRepairContractors(): Promise<MetRepairContractor[]> {
  const raw = await metRepairsFetch(MET_REPAIRS_API_PATHS.contractors, metRepairContractorListSchema);
  return unwrapList(raw).map(mapContractorDto);
}

export async function getMetRepairFinancialSummary(): Promise<MetRepairFinancialSummary> {
  try {
    const remote = unwrapSingle(
      await metRepairsFetch(MET_REPAIRS_API_PATHS.summary, metRepairSummaryResponseSchema)
    );
    return mapFinancialSummaryDto(remote);
  } catch (e) {
    if (e instanceof MetRepairsApiError && e.status === 404) {
      const snapshot = await getMetRepairCommandCenterSnapshot();
      return snapshot.summary;
    }
    throw e;
  }
}

export async function getMetRepairCommandCenterSnapshot(): Promise<MetRepairCommandCenterSnapshot> {
  assertConfigured();

  try {
    const remote = await metRepairsFetch(
      '/financial/command-center',
      metRepairCommandCenterSnapshotSchema
    );
    if (remote.jobs?.length || remote.summary) {
      return buildCommandCenterFromRecords({
        jobs: (remote.jobs ?? []).map(mapJobDto),
        invoices: (remote.invoices ?? remote.unpaidInvoices ?? []).map(mapInvoiceDto),
        payments: (remote.payments ?? []).map(mapPaymentDto),
        expenses: (remote.expenses ?? []).map(mapExpenseDto),
        contractors: (remote.contractors ?? []).map(mapContractorDto),
        prefetchedSummary: remote.summary,
      });
    }
  } catch (e) {
    const fallback =
      e instanceof MetRepairsApiError &&
      (e.status === 404 || e.code === 'VALIDATION_ERROR' || e.code === 'INVALID_JSON');
    if (!fallback) throw e;
  }

  const [jobs, invoices, payments, expenses, contractors] = await Promise.all([
    getMetRepairJobs(),
    getMetRepairInvoices(),
    getMetRepairPayments(),
    getMetRepairExpenses(),
    getMetRepairContractors(),
  ]);

  return buildCommandCenterFromRecords({
    jobs,
    invoices,
    payments,
    expenses,
    contractors,
  });
}
