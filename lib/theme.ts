/** Cookie + storage key shared by `app/layout.tsx` and `ThemeProvider`. */
export const THEME_STORAGE_KEY = 'theme';
export const THEME_COOKIE = 'theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export function isThemePreference(value: string | undefined | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Class applied on `<html>` for SSR when preference is explicitly light or dark. */
export function resolvedHtmlThemeClass(
  preference: ThemePreference | null | undefined
): 'light' | 'dark' | null {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return null;
}

export function readThemeCookieClient(): ThemePreference | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`));
  if (!match?.[1]) return null;
  const value = decodeURIComponent(match[1]);
  return isThemePreference(value) ? value : null;
}

export function writeThemeCookie(preference: ThemePreference): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${THEME_COOKIE}=${encodeURIComponent(preference)};path=/;max-age=31536000;SameSite=Lax`;
}
