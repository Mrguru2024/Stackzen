'use client';

import type { OperationalExplainabilityDto } from '@/lib/explainability/types';

export interface OperationalExplainabilityPanelProps {
  explainability: OperationalExplainabilityDto;
}

function lifecycleLabel(primary: OperationalExplainabilityDto['lifecycle']['primary']): string {
  switch (primary) {
    case 'active':
      return 'Open';
    case 'acknowledged':
      return 'Read';
    case 'suppressed':
      return 'Snoozed or hidden';
    case 'resolved':
      return 'Resolved';
    default:
      return primary;
  }
}

function BlockDetails({ block }: { block: OperationalExplainabilityDto['blocks'][number] }) {
  switch (block.kind) {
    case 'guidance_engine':
      return (
        <div className="space-y-2 text-xs">
          <p>
            <span className="font-medium text-foreground">Engine:</span> guidance v{block.engineVersion ?? '—'} ·{' '}
            {block.logicalKind} · priority {block.priority}
            {block.riskCode ? ` · risk ${block.riskCode}` : ''}
          </p>
          {block.calculations.length > 0 ? (
            <ul className="list-inside list-disc text-muted-foreground">
              {block.calculations.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : null}
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Expected impact:</span> {block.expectedImpact}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Confidence (deterministic):</span>{' '}
            {(block.confidence * 100).toFixed(0)}%
          </p>
          {Object.keys(block.inputsUsed).length > 0 ? (
            <pre className="max-h-32 overflow-auto rounded bg-muted/80 p-2 text-[10px] leading-relaxed">
              {JSON.stringify(block.inputsUsed, null, 2)}
            </pre>
          ) : null}
        </div>
      );
    case 'cashflow_risk':
      return (
        <div className="space-y-1 text-xs">
          <p>
            <span className="font-medium text-foreground">Risk code:</span> {block.riskCode} ·{' '}
            <span className="font-medium text-foreground">Confidence:</span> {(block.confidence * 100).toFixed(0)}%
          </p>
          <p className="text-muted-foreground">{block.summary}</p>
          <p className="text-muted-foreground">{block.detail}</p>
        </div>
      );
    case 'goal_planning':
      return (
        <div className="space-y-1 text-xs">
          <p>
            <span className="font-medium text-foreground">Finding:</span> {block.findingCode}
          </p>
          {block.reasoningLines.length > 0 ? (
            <ul className="list-inside list-disc text-muted-foreground">
              {block.reasoningLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    case 'trust_reference':
      return (
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>{block.why}</p>
          {block.whatChanged ? <p className="italic">{block.whatChanged}</p> : null}
          <p className="font-medium text-foreground">{block.recommendedNextStep}</p>
          {block.sourceEventType ? (
            <p className="text-[10px] uppercase tracking-wide">Source event: {block.sourceEventType}</p>
          ) : null}
        </div>
      );
    default:
      return null;
  }
}

export function OperationalExplainabilityPanel({ explainability }: OperationalExplainabilityPanelProps) {
  const { lifecycle, blocks, auditTrail, attentionKind } = explainability;

  return (
    <details className="mt-3 rounded-md border border-border/80 bg-muted/20 text-sm">
      <summary className="cursor-pointer select-none px-3 py-2 font-medium text-foreground">
        Operational audit trail · {lifecycleLabel(lifecycle.primary)}
        {attentionKind ? (
          <span className="ml-2 text-xs font-normal text-muted-foreground">({attentionKind})</span>
        ) : null}
      </summary>
      <div className="space-y-3 border-t border-border/80 px-3 py-3 text-xs">
        <div>
          <p className="font-semibold text-foreground">Lifecycle</p>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            <li>State: {lifecycleLabel(lifecycle.primary)}</li>
            {lifecycle.readAt ? <li>Read at: {new Date(lifecycle.readAt).toLocaleString()}</li> : null}
            {lifecycle.snoozedUntil ? <li>Snoozed until: {new Date(lifecycle.snoozedUntil).toLocaleString()}</li> : null}
            {lifecycle.dismissedAt ? <li>Dismissed at: {new Date(lifecycle.dismissedAt).toLocaleString()}</li> : null}
            {lifecycle.guidanceAppliedAt ? (
              <li>Guidance applied at: {new Date(lifecycle.guidanceAppliedAt).toLocaleString()}</li>
            ) : null}
            {lifecycle.autoResolvedAt ? (
              <li>
                Auto-resolved at: {new Date(lifecycle.autoResolvedAt).toLocaleString()}
                {lifecycle.autoResolvedReason ? ` — ${lifecycle.autoResolvedReason}` : ''}
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-foreground">Deterministic reasoning</p>
          <div className="mt-2 space-y-3">
            {blocks.map((b, i) => (
              <div key={i} className="rounded-md bg-background/60 p-2">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {b.kind.replace(/_/g, ' ')}
                </p>
                <BlockDetails block={b} />
              </div>
            ))}
          </div>
        </div>

        {auditTrail.length > 0 ? (
          <div>
            <p className="font-semibold text-foreground">Linked FinancialEvents</p>
            <ul className="mt-1 max-h-40 space-y-2 overflow-y-auto">
              {auditTrail.map(ev => (
                <li key={ev.id} className="rounded bg-background/60 p-2 font-mono text-[10px] text-muted-foreground">
                  <div>
                    {ev.type} · {ev.source} · {new Date(ev.createdAt).toLocaleString()}
                  </div>
                  <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(ev.metadata, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted-foreground">
            No FinancialEvent rows reference this notification yet (e.g. auto-resolve or goal evaluation events appear
            here).
          </p>
        )}
      </div>
    </details>
  );
}
