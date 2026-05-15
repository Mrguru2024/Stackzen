import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare, hash } from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient as createSupabaseAuthClient } from '@supabase/supabase-js';
import { RedisEdge } from '@/lib/redis-edge';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isPrivilegedEmail } from '@/lib/auth/privileged-users';

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
} satisfies Prisma.UserSelect;

type UserAuthRow = Prisma.UserGetPayload<{ select: typeof userSelectCredentials }>;

const userSelectJwt: Prisma.UserSelect = {
  id: true,
  email: true,
  subscriptionLevel: true,
  role: true,
};

const userSelectGoogleSignIn: Prisma.UserSelect = {
  id: true,
  email: true,
  name: true,
  subscriptionLevel: true,
  role: true,
  accounts: { select: { provider: true } },
};

function finalizeUser(
  user: Pick<AppUser, 'id' | 'email' | 'name' | 'subscriptionLevel' | 'role'>,
  credentials: { deviceId?: string | null }
) {
  if (credentials.deviceId) {
    void RedisEdge.set(`device:${user.id}:${credentials.deviceId}`, '1', 30 * 24 * 60 * 60);
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
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Invalid credentials');
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
              return finalizeUser(existing, credentials) as any;
            }
            /** Wrong bcrypt hash (typo, rotated Supabase-only password, or legacy hash). Try Supabase, then sync bcrypt. */
            const sbAfterBcryptFail = await signInWithSupabase(email, password);
            if (!sbAfterBcryptFail.ok) {
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
            return finalizeUser(merged, credentials) as any;
          }

          // OAuth / legacy users with no prisma password — Supabase Auth must succeed.
          const sb = await signInWithSupabase(email, password);
          if (!sb.ok) {
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
          return finalizeUser(user, credentials) as any;
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
      console.log('SignIn callback - user:', user, 'account:', account);

      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: userSelectGoogleSignIn,
          });

          console.log('Existing user found:', existingUser);

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
            console.log('Returning true for existing user');
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
              lastLogin: new Date(),
            },
          });
          console.log('Created new user');
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
        } catch (e) {
          console.error('signIn lastLogin update failed:', e);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
        }
        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: userSelectJwt,
          });
          console.log('JWT callback - dbUser:', dbUser);
          const privileged = isPrivilegedEmail(dbUser?.email ?? token.email);
          token.subscriptionLevel = privileged ? 'PRO' : dbUser?.subscriptionLevel || 'FREE';
          token.role = privileged ? 'SUPER_ADMIN' : dbUser?.role || 'USER';
        }
        console.log('JWT callback - token:', token);
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
        console.log('Session callback - session:', session, 'token:', token);

        if (session?.user && token) {
          session.user.id = token.id as string;
          session.user.subscriptionLevel = token.subscriptionLevel;
          session.user.role = token.role;
        }
        console.log('Session callback - final session:', session);
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
  debug: process.env.NODE_ENV === 'development',
};
