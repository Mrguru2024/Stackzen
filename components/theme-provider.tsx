'use client';

/**
 * Lightweight theme wiring for Tailwind `darkMode: ['class']` without injecting
 * a `<script>` from a Client Component tree (React 19 warns against that pattern).
 *
 * Blocking theme init lives in `app/layout.tsx` via `next/script` + `beforeInteractive`.
 */
import * as React from 'react';

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

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = 'theme',
  themes: themesProp,
  forcedTheme,
}: Readonly<ThemeProviderProps>) {
  const baseThemes = React.useMemo(
    () => (themesProp ? [...themesProp] : ['light', 'dark']),
    [themesProp]
  );

  const [theme, setThemeState] = React.useState<string>(defaultTheme);
  const [systemBump, bumpSystem] = React.useReducer((n: number) => n + 1, 0);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setThemeState(stored);
      }
    } catch {
      // ignore private mode / SSR
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
      setThemeState(e.newValue);
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

  React.useEffect(() => {
    if (attribute !== 'class') return;
    const root = document.documentElement;
    root.classList.remove(...baseThemes, 'light', 'dark');
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [attribute, baseThemes, resolvedTheme]);

  const setTheme = React.useCallback(
    (value: React.SetStateAction<string>) => {
      setThemeState(prev => {
        const next = typeof value === 'function' ? (value as (p: string) => string)(prev) : value;
        try {
          localStorage.setItem(storageKey, next);
        } catch {
          /* ignore */
        }
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
