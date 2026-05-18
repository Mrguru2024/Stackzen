'use client';

/**
 * Theme for Tailwind `darkMode: ['class']`.
 * No `<script>` in the React tree (React 19 forbids it on the client).
 * SSR uses the `theme` cookie via `app/layout.tsx`; client syncs cookie + localStorage.
 */
import * as React from 'react';

import {
  readThemeCookieClient,
  THEME_STORAGE_KEY,
  writeThemeCookie,
  type ThemePreference,
} from '@/lib/theme';

export interface ThemeProviderProps {
  readonly children: React.ReactNode;
  readonly attribute?: 'class' | `data-${string}`;
  readonly defaultTheme?: string;
  readonly enableSystem?: boolean;
  readonly storageKey?: string;
  readonly themes?: readonly string[];
  readonly forcedTheme?: string;
}

const MEDIA = '(prefers-color-scheme: dark)';

type ThemeSnapshot = {
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  forcedTheme?: string;
  themes: string[];
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
};

const ThemeContext = React.createContext<ThemeSnapshot | undefined>(undefined);

function detectSystem(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(MEDIA).matches ? 'dark' : 'light';
}

function toPreference(value: string): ThemePreference {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = THEME_STORAGE_KEY,
  themes: themesProp,
  forcedTheme,
}: Readonly<ThemeProviderProps>) {
  const baseThemes = React.useMemo(
    () => (themesProp ? [...themesProp] : ['light', 'dark']),
    [themesProp]
  );

  const [theme, setThemeState] = React.useState<string>(() => toPreference(defaultTheme));
  const [systemBump, bumpSystem] = React.useReducer((n: number) => n + 1, 0);

  React.useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const pref = toPreference(stored);
        setThemeState(pref);
        writeThemeCookie(pref);
        return;
      }
      const fromCookie = readThemeCookieClient();
      if (fromCookie) {
        setThemeState(fromCookie);
        localStorage.setItem(storageKey, fromCookie);
      }
    } catch {
      // private mode / blocked storage
    }
  }, [storageKey]);

  React.useEffect(() => {
    const active = forcedTheme ?? theme;
    if (!enableSystem || active !== 'system') return;
    const mq = window.matchMedia(MEDIA);
    const onChange = () => bumpSystem();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme, forcedTheme, enableSystem, bumpSystem]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey || e.newValue == null) return;
      const pref = toPreference(e.newValue);
      setThemeState(pref);
      writeThemeCookie(pref);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey]);

  const systemTheme = detectSystem();

  const resolvedTheme: 'light' | 'dark' = React.useMemo(() => {
    void systemBump;
    const choice = forcedTheme ?? theme;
    if (enableSystem && choice === 'system') return detectSystem();
    if (choice === 'dark' || choice === 'light') return choice;
    return detectSystem();
  }, [forcedTheme, theme, enableSystem, systemBump]);

  React.useLayoutEffect(() => {
    if (attribute !== 'class') return;
    const root = document.documentElement;
    root.classList.remove(...baseThemes, 'light', 'dark');
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [attribute, baseThemes, resolvedTheme]);

  const setTheme = React.useCallback(
    (value: React.SetStateAction<string>) => {
      setThemeState(prev => {
        const nextRaw = typeof value === 'function' ? (value as (p: string) => string)(prev) : value;
        const next = toPreference(nextRaw);
        try {
          localStorage.setItem(storageKey, next);
        } catch {
          /* ignore */
        }
        writeThemeCookie(next);
        return next;
      });
    },
    [storageKey]
  );

  const providerThemes = React.useMemo(
    () => (enableSystem ? [...baseThemes, 'system'] : [...baseThemes]),
    [enableSystem, baseThemes]
  );

  const snapshot = React.useMemo(
    () =>
      ({
        theme,
        setTheme,
        forcedTheme,
        themes: providerThemes,
        resolvedTheme,
        systemTheme,
      }) satisfies ThemeSnapshot,
    [forcedTheme, providerThemes, resolvedTheme, setTheme, systemTheme, theme]
  );

  return <ThemeContext.Provider value={snapshot}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeSnapshot {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
