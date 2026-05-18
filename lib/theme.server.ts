import 'server-only';

import { cookies } from 'next/headers';

import {
  isThemePreference,
  resolvedHtmlThemeClass,
  THEME_COOKIE,
  type ThemePreference,
} from '@/lib/theme';

export async function getThemePreferenceFromCookies(): Promise<ThemePreference | null> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isThemePreference(value) ? value : null;
}

export async function getServerHtmlThemeClass(): Promise<'light' | 'dark' | null> {
  const preference = await getThemePreferenceFromCookies();
  return resolvedHtmlThemeClass(preference);
}
