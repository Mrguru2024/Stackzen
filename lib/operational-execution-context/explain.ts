import type { ExecutionContinuityExplain, ParsedOperationalHandoff } from '@/lib/operational-execution-context/types';

function bandPhrase(b?: string): string {
  if (b === 'escalating') return 'needs attention';
  if (b === 'coordination') return 'needs coordination';
  if (b === 'stabilizing') return 'is stable';
  return 'was highlighted in the command center';
}

function subsystemLabel(s?: string): string {
  if (s === 'reserve') return 'Reserve & allocation';
  if (s === 'timing') return 'Obligation timing';
  if (s === 'contractor') return 'Contractor receivables & jobs';
  if (s === 'workflow') return 'Workflow & attention';
  return 'Operations';
}

/**
 * Deterministic copy for destination pages. Returns null when handoff is incomplete for messaging.
 */
export function explainOperationalExecutionHandoff(
  parsed: ParsedOperationalHandoff
): ExecutionContinuityExplain | null {
  if (parsed.source !== 'command_center') return null;

  const sub = subsystemLabel(parsed.subsystem);
  const band = bandPhrase(parsed.band);
  const step = parsed.ctaLadderStep;

  const title = 'Operational continuation';

  if (step === 1) {
    return {
      title,
      bodyLines: [
        `You opened this view from the operational command center because pending user-approved operational actions exist.`,
        `Completing preview, apply, or dismiss reduces operational drag and keeps your ledger and forecast aligned with intentional changes.`,
        `Risk reduced: stale proposals and conflicting automation states linger less in the attention queue.`,
      ],
    };
  }

  if (step === 2) {
    return {
      title,
      bodyLines: [
        `You arrived from the command center because timing ${band} or a bill-shift proposal is active.`,
        `Coordinating on the calendar keeps obligation moves explicit and still flows through the operational-action approval path.`,
        `Risk reduced: surprise clustering days and silent bill-date drift versus your forecast.`,
      ],
    };
  }

  if (step === 3) {
    return {
      title,
      bodyLines: [
        `You arrived from the command center because reserve and allocation ${band}.`,
        `Adjusting rules and buckets in Money Control ties automation to your real cash envelopes and goals.`,
        `Risk reduced: mis-sized allocations during elevated reserve pressure windows.`,
      ],
    };
  }

  if (step === 4) {
    return {
      title,
      bodyLines: [
        `You arrived from the command center because contractor financial signals ${band}.`,
        `Triage invoices and follow-ups so receivables and job exposure match what the contractor snapshot surfaced.`,
        `Risk reduced: overdue concentration and negative-margin delivery gaps.`,
      ],
    };
  }

  if (step === 5) {
    return {
      title,
      bodyLines: [
        `You arrived from the command center because unread operational attention items remain.`,
        `Reviewing the queue marks structured work complete and collapses duplicate forecast signals where safe.`,
        `Risk reduced: ignored escalations that would otherwise keep resurfacing across panels.`,
      ],
    };
  }

  if (step === 6) {
    return {
      title,
      bodyLines: [
        `You arrived from the command center on the default continuation path: confirm the deterministic cash flow forecast.`,
        `Cash flow ties ledger, bills, and timing so you can verify balances before any optional operational action.`,
        `Risk reduced: planning against an outdated mental model of near-term liquidity.`,
      ],
    };
  }

  if (parsed.subsystem) {
    return {
      title,
      bodyLines: [
        `You opened this page from the operational command center while ${sub} ${band}.`,
        `Use the tools on this page to complete the intended operational step; nothing runs automatically without your approval.`,
        `Risk reduced: context loss between coordination and execution.`,
      ],
    };
  }

  return null;
}
