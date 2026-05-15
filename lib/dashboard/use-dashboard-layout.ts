'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DASHBOARD_WIDGETS, type DashboardWidgetDefinition } from './widgets';

export interface DashboardLayoutItem {
  id: string;
  visible: boolean;
}

export type DashboardLayoutSyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

export interface DashboardLayoutState {
  items: DashboardLayoutItem[];
  toggleWidget: (id: string) => void;
  moveWidget: (id: string, direction: 'up' | 'down') => void;
  setWidgetVisibility: (id: string, visible: boolean) => void;
  reset: () => void;
  isReady: boolean;
  syncStatus: DashboardLayoutSyncStatus;
}

const STORAGE_KEY = 'stackzen.dashboard.layout.v1';
const LAYOUT_ENDPOINT = '/api/dashboard/layout';
const SAVE_DEBOUNCE_MS = 600;
const SAVED_FLASH_MS = 1500;

function buildDefaultLayout(): DashboardLayoutItem[] {
  return [...DASHBOARD_WIDGETS]
    .sort((a, b) => a.defaultOrder - b.defaultOrder)
    .map(w => ({ id: w.id, visible: w.defaultVisible }));
}

function reconcileWithRegistry(
  stored: DashboardLayoutItem[] | null
): DashboardLayoutItem[] {
  if (!stored) return buildDefaultLayout();

  const known = new Map(DASHBOARD_WIDGETS.map(w => [w.id, w]));
  const seen = new Set<string>();
  const next: DashboardLayoutItem[] = [];

  for (const item of stored) {
    const def = known.get(item.id);
    if (!def) continue;
    seen.add(item.id);
    next.push({ id: item.id, visible: Boolean(item.visible) });
  }

  const newcomers = DASHBOARD_WIDGETS.filter(w => !seen.has(w.id)).sort(
    (a, b) => a.defaultOrder - b.defaultOrder
  );
  for (const w of newcomers) {
    next.push({ id: w.id, visible: w.defaultVisible });
  }

  return next;
}

function readStored(): DashboardLayoutItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter(
        (entry): entry is DashboardLayoutItem =>
          !!entry &&
          typeof entry === 'object' &&
          typeof (entry as DashboardLayoutItem).id === 'string'
      )
      .map(entry => ({ id: entry.id, visible: Boolean(entry.visible) }));
  } catch {
    return null;
  }
}

function persist(items: DashboardLayoutItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Silently ignore quota / private-mode failures.
  }
}

function arrayEqual(a: DashboardLayoutItem[], b: DashboardLayoutItem[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].visible !== b[i].visible) return false;
  }
  return true;
}

export function useDashboardLayout(): DashboardLayoutState {
  const [items, setItems] = useState<DashboardLayoutItem[]>(() =>
    reconcileWithRegistry(readStored())
  );
  const [isReady, setIsReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<DashboardLayoutSyncStatus>('idle');

  // Tracks whether the user has mutated the layout before the initial server GET resolved.
  // When true, we intentionally ignore the GET response to avoid clobbering local edits.
  const userMutatedBeforeFetch = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightAbort = useRef<AbortController | null>(null);
  const isUnmounted = useRef(false);

  // Initial fetch from the API. Falls back to the localStorage-derived state if it fails.
  useEffect(() => {
    let aborted = false;
    setSyncStatus('loading');

    (async () => {
      try {
        const res = await fetch(LAYOUT_ENDPOINT);
        if (aborted) return;
        if (!res.ok) {
          setSyncStatus('idle');
          setIsReady(true);
          return;
        }
        const payload: { items?: DashboardLayoutItem[] } = await res.json();
        if (aborted) return;
        const serverItems = reconcileWithRegistry(payload.items ?? null);
        if (!userMutatedBeforeFetch.current) {
          setItems(prev => (arrayEqual(prev, serverItems) ? prev : serverItems));
        }
        setSyncStatus('idle');
      } catch {
        if (!aborted) setSyncStatus('idle');
      } finally {
        if (!aborted) setIsReady(true);
      }
    })();

    return () => {
      aborted = true;
      isUnmounted.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist locally on every change for instant offline-resilient UX.
  useEffect(() => {
    if (!isReady) return;
    persist(items);
  }, [items, isReady]);

  // Debounced server save.
  useEffect(() => {
    if (!isReady) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (inFlightAbort.current) inFlightAbort.current.abort();
      const controller = new AbortController();
      inFlightAbort.current = controller;
      setSyncStatus('saving');
      fetch(LAYOUT_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        signal: controller.signal,
      })
        .then(res => {
          if (!res.ok) throw new Error('save failed');
          if (isUnmounted.current) return;
          setSyncStatus('saved');
          if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
          savedFlashTimerRef.current = setTimeout(() => {
            if (!isUnmounted.current) setSyncStatus('idle');
          }, SAVED_FLASH_MS);
        })
        .catch(err => {
          if (err?.name === 'AbortError') return;
          if (!isUnmounted.current) setSyncStatus('error');
        });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [items, isReady]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
      if (inFlightAbort.current) inFlightAbort.current.abort();
    };
  }, []);

  const markUserMutation = useCallback(() => {
    if (!isReady) userMutatedBeforeFetch.current = true;
  }, [isReady]);

  const toggleWidget = useCallback(
    (id: string) => {
      markUserMutation();
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, visible: !item.visible } : item))
      );
    },
    [markUserMutation]
  );

  const setWidgetVisibility = useCallback(
    (id: string, visible: boolean) => {
      markUserMutation();
      setItems(prev => prev.map(item => (item.id === id ? { ...item, visible } : item)));
    },
    [markUserMutation]
  );

  const moveWidget = useCallback(
    (id: string, direction: 'up' | 'down') => {
      markUserMutation();
      setItems(prev => {
        const idx = prev.findIndex(item => item.id === id);
        if (idx === -1) return prev;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= prev.length) return prev;
        const next = [...prev];
        const temp = next[idx];
        next[idx] = next[swapIdx];
        next[swapIdx] = temp;
        return next;
      });
    },
    [markUserMutation]
  );

  const reset = useCallback(() => {
    markUserMutation();
    setItems(buildDefaultLayout());
  }, [markUserMutation]);

  return useMemo(
    () => ({
      items,
      toggleWidget,
      setWidgetVisibility,
      moveWidget,
      reset,
      isReady,
      syncStatus,
    }),
    [items, toggleWidget, setWidgetVisibility, moveWidget, reset, isReady, syncStatus]
  );
}

export function resolveVisibleWidgets(
  items: DashboardLayoutItem[],
  role: string
): DashboardWidgetDefinition[] {
  const roleUpper = role.toUpperCase();
  const known = new Map(DASHBOARD_WIDGETS.map(w => [w.id, w]));
  const result: DashboardWidgetDefinition[] = [];
  for (const item of items) {
    if (!item.visible) continue;
    const def = known.get(item.id);
    if (!def) continue;
    if (def.roleGate && def.roleGate !== roleUpper) continue;
    result.push(def);
  }
  return result;
}
