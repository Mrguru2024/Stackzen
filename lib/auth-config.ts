import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare, hash } from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient as createSupabaseAuthClient } from '@supabase/supabase-js';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isPrivilegedEmail } from '@/lib/auth/privileged-users';
import { isTurnstileRequired, verifyTurnstileToken } from '@/lib/security/turnstile';
import { evaluateLoginRisk } from '@/lib/security/login-risk';
import { recordUserSession } from '@/lib/security/user-session';
import { getRequestClientMeta } from '@/lib/security/request-meta';
import type { UserRole } from '@prisma/client';
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  isAdminDbRole,
} from '@/lib/security/admin-policy';

type AppUser = {
  id: string;
  email: string | null;
  name: string | null;
  subscriptionLevel: string;
  role: string;
};

/** Avoid selecting all User columns — keeps auth working if the DB lags behind the Prisma schema. */
const userSelectCredentials = {
  id: true,
  email: true,
  name: true,
  subscriptionLevel: true,
  role: true,
  password: true,
  twoFactorEnabled: true,
} satisfies Prisma.UserSelect;

type UserAuthRow = Prisma.UserGetPayload<{ select: typeof userSelectCredentials }>;

const userSelectJwt: Prisma.UserSelect = {
  id: true,
  email: true,
  subscriptionLevel: true,
  role: true,
};

/** How often JWT callback re-fetches role/subscription from Postgres (ms). */
const JWT_ROLE_REFRESH_MS = 5 * 60 * 1000;

function authDebugEnabled(): boolean {
  return process.env.AUTH_DEBUG === 'true';
}

const userSelectGoogleSignIn: Prisma.UserSelect = {
  id: true,
  email: true,
  name: true,
  subscriptionLevel: true,
  role: true,
  accounts: { select: { provider: true } },
};

async function recordFailedCredentialLogin(email: string): Promise<void> {
  try {
    const meta = await getRequestClientMeta();
    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, role: true },
    });
    await evaluateLoginRisk({
      userId: dbUser?.id,
      email,
      ip: meta.ip,
      userAgent: meta.userAgent,
      success: false,
      role: dbUser?.role,
    });
  } catch {
    // non-blocking
  }
}

async function finalizeUser(
  user: Pick<AppUser, 'id' | 'email' | 'name' | 'subscriptionLevel' | 'role'> & {
    role: UserRole | string;
  },
  credentials: { deviceId?: string | null }
) {
  try {
    const meta = await getRequestClientMeta();
    await evaluateLoginRisk({
      userId: user.id,
      email: user.email ?? undefined,
      ip: meta.ip,
      userAgent: meta.userAgent,
      success: true,
      role: user.role as UserRole,
    });
    await recordUserSession({
      userId: user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
      deviceId: credentials.deviceId,
    });
  } catch {
    // non-blocking — login must not fail on telemetry
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: null as string | null,
    subscriptionLevel: user.subscriptionLevel,
    role: user.role,
  };
}

async function signInWithSupabase(email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { ok: false as const, error: 'Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY' };
  }
  const supabaseAuth = createSupabaseAuthClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error) {
    if (
      process.env.NODE_ENV === 'development' &&
      !(error instanceof Error && error.message.includes('Invalid login credentials'))
    ) {
      console.error('[credentials] Supabase:', error.message, error);
    }
    return { ok: false as const, error: error.message };
  }
  if (!data.user) {
    return { ok: false as const, error: 'No Supabase user returned' };
  }
  return { ok: true as const, sbUser: data.user, verifiedEmail: data.user.email ?? email };
}

async function ensurePrismaUserForSupabase(
  verifiedEmail: string,
  sbUser: { user_metadata?: Record<string, unknown>; email_confirmed_at?: string | null },
  supabaseAuthUserId: string,
  existing: UserAuthRow | null
): Promise<UserAuthRow> {
  const user =
    existing ??
    (await prisma.user.findFirst({
      where: { email: { equals: verifiedEmail, mode: 'insensitive' } },
      select: userSelectCredentials,
    }));

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { authUserId: supabaseAuthUserId },
    });
    return prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: userSelectCredentials,
    });
  }

  const name =
    (sbUser.user_metadata?.full_name as string | undefined) ??
    (sbUser.user_metadata?.name as string | undefined) ??
    verifiedEmail.split('@')[0];

  try {
    const created = await prisma.user.create({
      data: {
        email: verifiedEmail,
        name,
        emailVerified: sbUser.email_confirmed_at ? new Date(sbUser.email_confirmed_at) : null,
        authUserId: supabaseAuthUserId,
      },
    });
    return await prisma.user.findUniqueOrThrow({
      where: { id: created.id },
      select: userSelectCredentials,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const again = await prisma.user.findFirst({
        where: { email: { equals: verifiedEmail, mode: 'insensitive' } },
        select: userSelectCredentials,
      });
      if (again) {
        return again;
      }
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('[credentials] prisma.user.create failed:', e);
    }
    throw e;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        deviceId: { label: 'Device ID', type: 'text' },
        turnstileToken: { label: 'Turnstile', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Invalid credentials');
          }

          if (isTurnstileRequired()) {
            const token =
              typeof credentials.turnstileToken === 'string' ? credentials.turnstileToken : '';
            const turnstile = await verifyTurnstileToken(token);
            if (!turnstile.ok) {
              return null;
            }
          }

          const email = credentials.email.trim();
          const password = credentials.password;

          const existing = await prisma.user.findFirst({
            where: {
              email: { equals: email, mode: 'insensitive' },
            },
            select: userSelectCredentials,
          });

          // Signup (/api/auth/signup) stores bcrypt-only in Prisma and does NOT create Supabase Auth users.
          // Always verify Prisma password first — never fall through to Supabase after a bcrypt mismatch (noisy &
          // ineffective for prisma-only accounts).
          if (existing?.password) {
            const bcryptOk = await compare(password, existing.password);
            if (bcryptOk) {
              return (await finalizeUser(existing, credentials)) as any;
            }
            /** Wrong bcrypt hash (typo, rotated Supabase-only password, or legacy hash). Try Supabase, then sync bcrypt. */
            const sbAfterBcryptFail = await signInWithSupabase(email, password);
            if (!sbAfterBcryptFail.ok) {
              await recordFailedCredentialLogin(email);
              return null;
            }
            const syncedHash = await hash(password, 12);
            await prisma.user.update({
              where: { id: existing.id },
              data: {
                password: syncedHash,
                authUserId: sbAfterBcryptFail.sbUser.id,
              },
            });
            const merged = await prisma.user.findUnique({
              where: { id: existing.id },
              select: userSelectCredentials,
            });
            if (!merged) return null;
            return (await finalizeUser(merged, credentials)) as any;
          }

          // OAuth / legacy users with no prisma password — Supabase Auth must succeed.
          const sb = await signInWithSupabase(email, password);
          if (!sb.ok) {
            await recordFailedCredentialLogin(email);
            return null;
          }

          let user = await ensurePrismaUserForSupabase(
            sb.verifiedEmail,
            sb.sbUser,
            sb.sbUser.id,
            existing
          );
          /** Persist bcrypt so future logins work without Supabase Auth round-trip (matches /api/auth/signup behavior). */
          if (!user.password) {
            const bcryptSync = await hash(password, 12);
            await prisma.user.update({
              where: { id: user.id },
              data: { password: bcryptSync },
            });
            user =
              (await prisma.user.findUnique({
                where: { id: user.id },
                select: userSelectCredentials,
              })) ??
              user;
          }
          return (await finalizeUser(user, credentials)) as any;
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[credentials] authorize:', e);
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && process.env.VERCEL === '1',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && process.env.VERCEL === '1',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && process.env.VERCEL === '1',
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (authDebugEnabled()) {
        console.log('SignIn callback - user:', user, 'account:', account);
      }

      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: userSelectGoogleSignIn,
          });

          if (authDebugEnabled()) {
            console.log('Existing user found:', existingUser);
          }

          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastLogin: new Date() },
            });
            if (
              !existingUser.accounts.some((acc: { provider: string }) => acc.provider === 'google')
            ) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  refresh_token: account.refresh_token,
                },
              });
            }
            if (authDebugEnabled()) {
              console.log('Returning true for existing user');
            }
            return true;
          }

          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              image: user.image!,
              emailVerified: new Date(),
              subscriptionLevel: isPrivilegedEmail(user.email) ? 'PRO' : 'FREE',
              role: isPrivilegedEmail(user.email) ? 'SUPER_ADMIN' : 'USER',
              mfaRequired: isPrivilegedEmail(user.email),
              lastLogin: new Date(),
            },
          });
          if (authDebugEnabled()) {
            console.log('Created new user');
          }
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      if (user?.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });
          const meta = await getRequestClientMeta();
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, email: true, role: true },
          });
          if (dbUser) {
            await evaluateLoginRisk({
              userId: dbUser.id,
              email: dbUser.email ?? undefined,
              ip: meta.ip,
              userAgent: meta.userAgent,
              success: true,
              role: dbUser.role,
            });
            await recordUserSession({
              userId: dbUser.id,
              ip: meta.ip,
              userAgent: meta.userAgent,
            });
          }
        } catch (e) {
          console.error('signIn lastLogin update failed:', e);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      try {
        if (user) {
          token.id = user.id;
        }

        const now = Date.now();
        const lastRefresh =
          typeof token.roleRefreshedAt === 'number' ? token.roleRefreshedAt : 0;
        const shouldRefreshRole =
          Boolean(user) ||
          trigger === 'update' ||
          !token.role ||
          !token.subscriptionLevel ||
          now - lastRefresh > JWT_ROLE_REFRESH_MS;

        if (token.id && shouldRefreshRole) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: userSelectJwt,
          });
          if (authDebugEnabled()) {
            console.log('[auth] JWT role refresh - dbUser:', dbUser);
          }
          const privileged = isPrivilegedEmail(dbUser?.email ?? token.email);
          token.subscriptionLevel = privileged ? 'PRO' : dbUser?.subscriptionLevel || 'FREE';
          token.role = privileged ? 'SUPER_ADMIN' : dbUser?.role || 'USER';
          token.roleRefreshedAt = now;

          const role = token.role as string;
          if (isAdminDbRole(role) || privileged) {
            if (typeof token.adminSessionStartedAt !== 'number' || user) {
              token.adminSessionStartedAt = now;
            }
            const startedSec = Math.floor((token.adminSessionStartedAt as number) / 1000);
            token.exp = startedSec + ADMIN_SESSION_MAX_AGE_SECONDS;
          } else {
            delete token.adminSessionStartedAt;
          }
        }

        if (authDebugEnabled()) {
          console.log('[auth] JWT callback - token:', token);
        }
        return token;
      } catch (e) {
        console.error('JWT callback error (DB unavailable?):', e);
        token.subscriptionLevel = token.subscriptionLevel ?? 'FREE';
        token.role = token.role ?? 'USER';
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session?.user && token) {
          session.user.id = token.id as string;
          session.user.subscriptionLevel = token.subscriptionLevel;
          session.user.role = token.role;
        }
        if (authDebugEnabled()) {
          console.log('[auth] Session callback - session:', session);
        }
        return session;
      } catch (e) {
        console.error('Session callback error:', e);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/auth/verify-request',
  },
  debug: authDebugEnabled(),
};
