import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function getEnvOrThrow(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return { url, anonKey };
}

/**
 * Create a Supabase server client bound to the current request cookies.
 * In Server Components, pass `await cookies()`; `setAll` may no-op until middleware refreshes.
 */
export function createClient(cookieStore: CookieStore) {
  const { url, anonKey } = getEnvOrThrow();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component: mutation not allowed — root middleware refreshes the session.
        }
      },
    },
  });
}

/** Convenience alias when you do not already have `cookieStore` in scope. */
export async function createServerSupabaseClient() {
  return createClient(await cookies());
}
