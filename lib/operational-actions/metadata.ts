import type { OperationalActionProposalCore } from '@/lib/operational-actions/types';

export function readAttentionKind(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const v = (metadata as Record<string, unknown>).attentionKind;
  return typeof v === 'string' ? v : null;
}

export function readOperationalProposal(metadata: unknown): OperationalActionProposalCore | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const raw = (metadata as Record<string, unknown>).operationalActionProposal;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  if (typeof o.status !== 'string' || typeof o.kind !== 'string' || typeof o.fingerprint !== 'string') return null;
  if (!o.payload || typeof o.payload !== 'object' || Array.isArray(o.payload)) return null;
  if (!o.explain || typeof o.explain !== 'object' || Array.isArray(o.explain)) return null;
  if (typeof o.lastForecastGeneratedAt !== 'string') return null;
  return o as unknown as OperationalActionProposalCore;
}
