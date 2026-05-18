import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/** Skip remote Supabase auth refresh when the browser has no Supabase session cookies. */
function hasSupabaseAuthCookies(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => {
    return name.startsWith('sb-') && name.includes('auth-token');
  });
}

/**
 * Refreshes the Supabase auth session and returns a NextResponse carrying updated cookies.
 * Call this from root middleware so SSR and the browser stay in sync.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  if (process.env.SUPABASE_MIDDLEWARE_REFRESH === 'false') {
    return supabaseResponse;
  }

  if (!hasSupabaseAuthCookies(request)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Avoid logic between createServerClient and getUser (Supabase recommendation).
  await supabase.auth.getUser();

  return supabaseResponse;
}

/** Copy Set-Cookie headers from a session refresh response onto another response (e.g. redirects). */
export function forwardAuthCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
  return to;
}
