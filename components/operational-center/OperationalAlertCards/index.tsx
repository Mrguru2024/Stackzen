'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { OperationalAlertDto } from '@/lib/operational-notifications/types';
import type { AutomationClientAction } from '@/lib/financial-automation/actionable-metadata';
import { OperationalExplainabilityPanel } from '@/components/operational-center/OperationalExplainabilityPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface OperationalAlertCardsProps {
  items: OperationalAlertDto[];
  onMutate: () => Promise<void> | void;
  /** When true, omit trust detail blocks (e.g. embedded money control tab). */
  compactTrust?: boolean;
}

function priorityBadge(p: OperationalAlertDto['uiPriority']) {
  const variant =
    p === 'critical' ? 'destructive' : p === 'warning' ? 'outline' : p === 'resolved' ? 'secondary' : 'secondary';
  return (
    <Badge variant={variant} className="text-xs capitalize">
      {p}
    </Badge>
  );
}

function actionLabel(a: AutomationClientAction): string {
  switch (a.type) {
    case 'REVIEW_TRANSACTION':
      return 'Review transaction';
    case 'ADJUST_CATEGORY':
      return 'Adjust category';
    case 'EDIT_ALLOCATION_RULE':
      return 'Edit rule';
    case 'MARK_EXPECTED':
      return 'Mark expected';
    case 'CREATE_GOAL':
      return 'Create goal';
    case 'IGNORE_MERCHANT_TRIGGER':
      return 'Ignore merchant';
    case 'OPEN_INVOICE':
      return 'Open invoice';
    case 'OPEN_JOB':
      return 'Open job';
    case 'OPEN_CLIENT':
      return 'Open client';
    case 'OPEN_BUCKET':
      return 'Open bucket';
    case 'PAY_INVOICE':
      return 'Pay invoice';
    case 'OPEN_CASH_FLOW':
      return 'Cash flow';
    case 'OPEN_MONEY_CONTROL':
      return a.tab === 'rules' ? 'Money control · rules' : a.tab === 'buckets' ? 'Money control · buckets' : 'Money control · review';
    case 'OPEN_OPERATIONAL_GOAL':
      return 'Operational goal';
    case 'SNOOZE':
      return 'Snooze';
    default:
      return 'Open';
  }
}

function resolveActionHref(action: AutomationClientAction): string | null {
  switch (action.type) {
    case 'REVIEW_TRANSACTION':
    case 'ADJUST_CATEGORY':
    case 'MARK_EXPECTED':
      return `/money-control?tab=review&txnId=${encodeURIComponent(action.financialTransactionId)}`;
    case 'EDIT_ALLOCATION_RULE':
      return `/money-control?tab=rules`;
    case 'OPEN_INVOICE':
      return `/invoices/${action.invoiceId}`;
    case 'OPEN_JOB':
      return `/jobs/${action.jobId}`;
    case 'OPEN_CLIENT':
      return `/clients/${action.clientId}`;
    case 'OPEN_BUCKET':
      return `/money-control?tab=buckets`;
    case 'CREATE_GOAL':
      return `/goals/operational`;
    case 'PAY_INVOICE':
      /** Invoice detail starts hosted payment flows; `/invoices/pay` requires Stripe `client_secret`. */
      return `/invoices/${action.invoiceId}`;
    case 'OPEN_CASH_FLOW':
      return `/cash-flow`;
    case 'OPEN_MONEY_CONTROL': {
      const t = action.tab ?? 'review';
      return `/money-control?tab=${encodeURIComponent(t)}`;
    }
    case 'OPEN_OPERATIONAL_GOAL':
      return `/goals/operational?goalId=${encodeURIComponent(action.goalId)}`;
    case 'IGNORE_MERCHANT_TRIGGER':
      return `/money-control?tab=review`;
    default:
      return null;
  }
}

export function OperationalAlertCards({ items, onMutate, compactTrust = false }: OperationalAlertCardsProps) {
  const router = useRouter();

  const markRead = async (id: string) => {
    const res = await fetch(`/api/automation/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ markRead: true }),
    });
    if (res.ok) {
      toast.success('Marked read');
      await onMutate();
    } else toast.error('Could not update alert');
  };

  const snooze = async (id: string, hours: number) => {
    const res = await fetch(`/api/automation/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ snoozeHours: hours }),
    });
    if (res.ok) {
      toast.success(`Snoozed ${hours}h`);
      await onMutate();
    } else toast.error('Could not snooze');
  };

  const dismiss = async (id: string) => {
    const res = await fetch(`/api/automation/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ dismiss: true }),
    });
    if (res.ok) {
      toast.success('Dismissed');
      await onMutate();
    }
  };

  const markGuidanceApplied = async (id: string) => {
    const res = await fetch(`/api/automation/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ guidanceApplied: true }),
    });
    if (res.ok) {
      toast.success('Recorded as applied');
      await onMutate();
    } else toast.error('Could not update guidance');
  };

  const runAction = async (notificationId: string, action: AutomationClientAction) => {
    if (action.type === 'SNOOZE') {
      await snooze(action.automationNotificationId ?? notificationId, action.snoozeHours ?? 24);
      return;
    }
    const href = resolveActionHref(action);
    if (href) {
      router.push(href);
      return;
    }
    toast.message('Continue in Money Control to complete this action.');
    router.push('/money-control');
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No alerts match this filter. Use Refresh after updating invoices, jobs, or bank data.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div
          key={item.id}
          className="rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4 touch-manipulation"
        >
          <div className="flex flex-col gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 flex-1 font-semibold leading-tight text-foreground">{item.title}</h3>
                {priorityBadge(item.uiPriority)}
                <Badge variant="outline" className="shrink-0 capitalize">
                  {item.domain}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{item.body}</p>
              <p className="text-xs text-muted-foreground">
                Raised {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>

            {item.actions.length > 0 ? (
              <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:flex-wrap">
                {item.actions.map((a, i) => {
                  const href = resolveActionHref(a);
                  const label = actionLabel(a);
                  const primary = i === 0;
                  if (href) {
                    return (
                      <Button
                        key={`${item.id}-a-${i}`}
                        variant={primary ? 'default' : 'secondary'}
                        size="default"
                        className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto sm:min-w-[10rem]"
                        asChild
                      >
                        <Link href={href}>{label}</Link>
                      </Button>
                    );
                  }
                  return (
                    <Button
                      key={`${item.id}-a-${i}`}
                      variant={primary ? 'default' : 'secondary'}
                      size="default"
                      type="button"
                      className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto sm:min-w-[10rem]"
                      onClick={() => void runAction(item.id, a)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            ) : null}

            {!compactTrust ? (
              <>
                <div className="md:hidden">
                  <details className="rounded-md border border-border/80 bg-muted/30">
                    <summary className="cursor-pointer list-none px-3 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                      Why & explainability
                    </summary>
                    <div className="space-y-3 border-t border-border/60 px-3 py-3 text-sm">
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium text-foreground">Why:</span> {item.trust.why}
                        </p>
                        {item.trust.whatChanged ? (
                          <p>
                            <span className="font-medium text-foreground">What changed:</span>{' '}
                            {item.trust.whatChanged}
                          </p>
                        ) : null}
                        <p className="font-medium text-foreground">{item.trust.recommendedNextStep}</p>
                      </div>
                      <OperationalExplainabilityPanel explainability={item.explainability} />
                    </div>
                  </details>
                </div>
                <div className="hidden md:block">
                  <div className="rounded-md bg-muted/50 p-3 text-sm">
                    <p>
                      <span className="font-medium text-foreground">Why:</span> {item.trust.why}
                    </p>
                    {item.trust.whatChanged ? (
                      <p className="mt-2">
                        <span className="font-medium text-foreground">What changed:</span>{' '}
                        {item.trust.whatChanged}
                      </p>
                    ) : null}
                    <p className="mt-2 font-medium text-foreground">{item.trust.recommendedNextStep}</p>
                  </div>
                  <OperationalExplainabilityPanel explainability={item.explainability} />
                </div>
              </>
            ) : null}

            <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                size="default"
                variant="outline"
                className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto"
                onClick={() => void markRead(item.id)}
              >
                Mark read
              </Button>
              {item.domain === 'guidance' ? (
                <Button
                  size="default"
                  variant="secondary"
                  className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto"
                  onClick={() => void markGuidanceApplied(item.id)}
                >
                  Mark applied
                </Button>
              ) : null}
              <Button
                size="default"
                variant="outline"
                className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto"
                onClick={() => void snooze(item.id, 24)}
              >
                Snooze 24h
              </Button>
              <Button
                size="default"
                variant="ghost"
                className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto"
                onClick={() => void dismiss(item.id)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
