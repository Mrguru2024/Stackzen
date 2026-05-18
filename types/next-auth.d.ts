// Remove 'NextAuth' and 'DefaultUser' from imports or variable declarations if unused

import type { DefaultSession } from 'next-auth';
import 'next-auth';

// Add enums for SubscriptionLevel and UserRole if not already imported
type SubscriptionLevel = string;
type UserRole = string;

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      subscriptionLevel?: SubscriptionLevel;
      role?: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    subscriptionLevel?: SubscriptionLevel;
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    email?: string | null;
    name?: string | null;
    subscriptionLevel?: SubscriptionLevel;
    role?: UserRole;
    /** Epoch ms — throttles Postgres role refresh in the jwt callback. */
    roleRefreshedAt?: number;
  }
}
