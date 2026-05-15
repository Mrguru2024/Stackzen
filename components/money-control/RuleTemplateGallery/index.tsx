'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type AllocationLine = { bucket: string; percent: number };

type TemplateDescriptor = {
  id: string;
  category: string;
  title: string;
  summary: string;
  guidance: string;
  outcomes: string[];
  premium: boolean;
  badge?: 'POPULAR' | 'PRO' | 'NEW';
  locked: boolean;
  inputs: Array<{
    id: string;
    label: string;
    helper?: string;
    kind: 'number' | 'text' | 'allocations';
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    defaultValue?: number | string | AllocationLine[];
  }>;
};

type TemplatesResponse = {
  subscriptionLevel: string;
  templates: TemplateDescriptor[];
};

export interface RuleTemplateGalleryProps {
  onRuleCreated?: () => void;
  /** Hide templates by id (e.g. budget splits when the Budget breakdown card owns that flow). */
  excludeTemplateIds?: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  BUDGET: 'Budget splits',
  SAVINGS: 'Savings & set-asides',
  TAXES: 'Tax reserves',
  GUARDRAIL: 'Spending guardrails',
};

function defaultInputState(template: TemplateDescriptor): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  for (const input of template.inputs) {
    if (input.defaultValue !== undefined) state[input.id] = input.defaultValue;
  }
  return state;
}

export default function RuleTemplateGallery({ onRuleCreated, excludeTemplateIds }: RuleTemplateGalleryProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<TemplatesResponse | null>(null);
  const [openTemplate, setOpenTemplate] = useState<TemplateDescriptor | null>(null);
  const [draftInput, setDraftInput] = useState<Record<string, unknown>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/automation/rule-templates', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load');
      const json = (await res.json()) as TemplatesResponse;
      setData(json);
    } catch {
      toast.error('Could not load rule templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const exclude = useMemo(() => new Set(excludeTemplateIds ?? []), [excludeTemplateIds]);

  const grouped = useMemo(() => {
    if (!data) return [] as Array<{ category: string; templates: TemplateDescriptor[] }>;
    const map = new Map<string, TemplateDescriptor[]>();
    for (const t of data.templates) {
      if (exclude.has(t.id)) continue;
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return Array.from(map.entries())
      .map(([category, templates]) => ({ category, templates }))
      .filter(g => g.templates.length > 0);
  }, [data, exclude]);

  const openBuilder = (template: TemplateDescriptor) => {
    if (template.locked) {
      toast.info('Upgrade to Pro to use this template.');
      return;
    }
    setOpenTemplate(template);
    setDraftInput(defaultInputState(template));
  };

  const closeBuilder = () => {
    if (saving) return;
    setOpenTemplate(null);
    setDraftInput({});
  };

  const updateDraftInput = (id: string, value: unknown) => {
    setDraftInput(prev => ({ ...prev, [id]: value }));
  };

  const updateAllocationLine = (id: string, index: number, patch: Partial<AllocationLine>) => {
    setDraftInput(prev => {
      const current = (prev[id] as AllocationLine[] | undefined) ?? [];
      const next = current.map((row, idx) => (idx === index ? { ...row, ...patch } : row));
      return { ...prev, [id]: next };
    });
  };

  const addAllocationLine = (id: string) => {
    setDraftInput(prev => {
      const current = (prev[id] as AllocationLine[] | undefined) ?? [];
      return { ...prev, [id]: [...current, { bucket: '', percent: 0 }] };
    });
  };

  const removeAllocationLine = (id: string, index: number) => {
    setDraftInput(prev => {
      const current = (prev[id] as AllocationLine[] | undefined) ?? [];
      return { ...prev, [id]: current.filter((_, idx) => idx !== index) };
    });
  };

  const instantiate = async () => {
    if (!openTemplate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/automation/rule-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ templateId: openTemplate.id, input: draftInput }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error ?? 'Could not create rule.');
      }
      toast.success(`Rule "${openTemplate.title}" created.`);
      setOpenTemplate(null);
      setDraftInput({});
      onRuleCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create rule.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Money rule templates</CardTitle>
          <CardDescription>Loading templates…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Money rule templates</CardTitle>
          <CardDescription>
            Pick a template to add a new rule. Income percentage splits live in the Budget breakdown card above when you
            are on Money control; this gallery focuses on savings, tax, and guardrail automations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {grouped.map(group => (
            <section key={group.category} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABELS[group.category] ?? group.category}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.templates.map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => openBuilder(template)}
                    className="group flex h-full flex-col rounded-lg border p-4 text-left transition hover:border-primary/60 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                    aria-disabled={template.locked}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug">{template.title}</p>
                      {template.badge === 'POPULAR' && <Badge variant="secondary">Popular</Badge>}
                      {template.badge === 'PRO' && <Badge>Pro</Badge>}
                      {template.badge === 'NEW' && <Badge variant="outline">New</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{template.summary}</p>
                    {template.locked && (
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        Requires Pro
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </CardContent>
      </Card>

      <Sheet open={Boolean(openTemplate)} onOpenChange={open => (open ? null : closeBuilder())}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {openTemplate && (
            <>
              <SheetHeader>
                <SheetTitle>{openTemplate.title}</SheetTitle>
                <SheetDescription>{openTemplate.summary}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">How this rule works</p>
                  <p className="mt-1 text-muted-foreground">{openTemplate.guidance}</p>
                  {openTemplate.outcomes.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                      {openTemplate.outcomes.map(line => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {openTemplate.inputs.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No extra configuration needed. Click create to add this rule. You can pause it any time.
                  </p>
                )}

                <div className="space-y-4">
                  {openTemplate.inputs.map(input => {
                    if (input.kind === 'allocations') {
                      const lines = (draftInput[input.id] as AllocationLine[] | undefined) ?? [];
                      const total = lines.reduce((s, l) => s + (Number(l.percent) || 0), 0);
                      return (
                        <div key={input.id} className="space-y-2 rounded-md border p-3">
                          <Label>{input.label}</Label>
                          {input.helper && (
                            <p className="text-xs text-muted-foreground">{input.helper}</p>
                          )}
                          {lines.map((line, idx) => (
                            <div key={idx} className="flex flex-wrap items-end gap-2">
                              <div className="flex-1 min-w-[120px]">
                                <Label className="text-xs">Envelope</Label>
                                <Input
                                  value={line.bucket}
                                  onChange={e =>
                                    updateAllocationLine(input.id, idx, { bucket: e.target.value })
                                  }
                                  placeholder="needs"
                                />
                              </div>
                              <div className="w-24">
                                <Label className="text-xs">Percent</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={line.percent}
                                  onChange={e =>
                                    updateAllocationLine(input.id, idx, {
                                      percent: Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <Button
                                size="sm"
                                type="button"
                                variant="ghost"
                                onClick={() => removeAllocationLine(input.id, idx)}
                                aria-label={`Remove ${line.bucket}`}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <div className="flex items-center justify-between text-xs">
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => addAllocationLine(input.id)}
                            >
                              Add envelope
                            </Button>
                            <span
                              className={
                                Math.abs(total - 100) <= 0.05
                                  ? 'text-emerald-600 font-semibold'
                                  : 'text-destructive font-semibold'
                              }
                            >
                              {total.toFixed(0)}% / 100%
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={input.id}>
                        <Label htmlFor={`tmpl-${input.id}`}>{input.label}</Label>
                        {input.helper && (
                          <p className="text-xs text-muted-foreground">{input.helper}</p>
                        )}
                        <Input
                          id={`tmpl-${input.id}`}
                          type={input.kind === 'number' ? 'number' : 'text'}
                          min={input.min}
                          max={input.max}
                          step={input.step}
                          placeholder={input.placeholder}
                          value={(draftInput[input.id] as string | number | undefined) ?? ''}
                          onChange={e =>
                            updateDraftInput(
                              input.id,
                              input.kind === 'number' ? Number(e.target.value) : e.target.value
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <SheetFooter className="mt-6 flex flex-row gap-2">
                <Button variant="outline" type="button" onClick={closeBuilder} disabled={saving}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void instantiate()} disabled={saving}>
                  {saving ? 'Creating…' : 'Create rule'}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
