import { DASHBOARD_WIDGETS, DASHBOARD_WIDGET_IDS } from '@/lib/dashboard/widgets';
import {
  buildDefaultLayoutItems,
  reconcileLayout,
} from '@/lib/dashboard/reconcile-layout';

describe('reconcileLayout', () => {
  it('returns the default ordered layout for null/invalid input', () => {
    const defaults = buildDefaultLayoutItems();
    expect(reconcileLayout(null)).toEqual(defaults);
    expect(reconcileLayout(undefined)).toEqual(defaults);
    expect(reconcileLayout('not-an-array')).toEqual(defaults);
    expect(reconcileLayout({})).toEqual(defaults);
  });

  it('preserves the stored order and visibility for known widgets', () => {
    const stored = [
      { id: 'cashflow-snapshot', visible: false },
      { id: 'kpi-strip', visible: true },
    ];
    const result = reconcileLayout(stored);
    expect(result[0]).toEqual({ id: 'cashflow-snapshot', visible: false });
    expect(result[1]).toEqual({ id: 'kpi-strip', visible: true });
  });

  it('drops entries whose widget id is no longer in the registry', () => {
    const stored = [
      { id: 'kpi-strip', visible: true },
      { id: 'ghost-widget-that-was-removed', visible: true },
    ];
    const result = reconcileLayout(stored);
    expect(result.find(item => item.id === 'ghost-widget-that-was-removed')).toBeUndefined();
    expect(result.find(item => item.id === 'kpi-strip')?.visible).toBe(true);
  });

  it('drops duplicate entries (first occurrence wins)', () => {
    const stored = [
      { id: 'kpi-strip', visible: false },
      { id: 'kpi-strip', visible: true },
    ];
    const result = reconcileLayout(stored);
    const kpiEntries = result.filter(i => i.id === 'kpi-strip');
    expect(kpiEntries).toHaveLength(1);
    expect(kpiEntries[0].visible).toBe(false);
  });

  it('appends widgets newly added to the registry in declared order with their defaultVisible', () => {
    const stored = [{ id: 'kpi-strip', visible: true }];
    const result = reconcileLayout(stored);
    expect(result[0]).toEqual({ id: 'kpi-strip', visible: true });

    const appended = result.slice(1);
    const sortedNewcomers = [...DASHBOARD_WIDGETS]
      .filter(w => w.id !== 'kpi-strip')
      .sort((a, b) => a.defaultOrder - b.defaultOrder);
    expect(appended.map(i => i.id)).toEqual(sortedNewcomers.map(w => w.id));
    for (const item of appended) {
      const def = DASHBOARD_WIDGETS.find(w => w.id === item.id)!;
      expect(item.visible).toBe(def.defaultVisible);
    }
  });

  it('skips malformed entries without throwing', () => {
    const stored = [
      { id: 'kpi-strip', visible: true },
      'garbage',
      { id: 'cashflow-snapshot' },
      { visible: true },
      null,
      { id: 123, visible: true },
    ];
    const result = reconcileLayout(stored);
    const ids = result.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('kpi-strip');
  });

  it('always returns every widget exactly once', () => {
    const stored = [{ id: 'income-health', visible: false }];
    const result = reconcileLayout(stored);
    const ids = result.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of DASHBOARD_WIDGET_IDS) {
      expect(ids).toContain(id);
    }
  });
});
