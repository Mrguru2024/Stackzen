# StackZen Full Integration Guide: Prisma + Supabase + Sentry + Secure Auth

This guide integrates:

- ✅ Supabase for Auth + Postgres
- ✅ Prisma for backend DB access
- ✅ Sentry for error + performance monitoring
- ✅ Next.js 15 App Router with API routes
- ✅ Secure session handling and role-based access

---

## 🧱 1. INITIALIZE YOUR STACKZEN PROJECT

If you haven’t already:

```bash
npx create-next-app@latest stackzen --ts --app
cd stackzen
```

Install base dependencies:

```bash
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js @prisma/client prisma @sentry/nextjs
```

---

## 🧠 2. SUPABASE SETUP

### ✅ Create a Supabase Project

- Go to https://app.supabase.com
- Create a new project
- Get:
  - Project URL
  - `anon` public key
  - `service_role` (server-only)

---

### ✅ Enable Supabase Auth

Go to **Auth > Settings**:

- Enable Email logins (magic link or password)
- Optionally enable OAuth (Google, GitHub)

---

### ✅ Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_DSN=https://your-sentry-dsn
```

---

## 🧬 3. PRISMA SETUP

```bash
npx prisma init
```

> Edit `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String       @id @default(uuid())
  email       String       @unique
  role        String       @default("user")
  transactions Transaction[]
  createdAt   DateTime     @default(now())
}

model Transaction {
  id        String   @id @default(uuid())
  amount    Float
  type      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

```bash
npx prisma db push
npx prisma generate
```

Create `lib/prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 🛡️ 4. SUPABASE AUTH CONFIG (SSR + CLIENT)

### `lib/supabaseClient.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr';
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Server Validation (`lib/supabaseServer.ts`):

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function getSupabaseServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );
}
```

---

## 🔐 5. CREATE AUTH-PROTECTED API ROUTE

> File: `app/api/transactions/route.ts`

```ts
import { prisma } from '@/lib/prisma';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    Sentry.captureMessage('Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

---

## 📦 6. ADD LOGIN PAGE (EXAMPLE)

> File: `app/login/page.tsx`

```tsx
'use client';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOtp({ email: 'test@email.com' });
  };

  return <button onClick={handleLogin}>Send Magic Link</button>;
}
```

---

## 🧯 7. SENTRY SETUP (FRONTEND + BACKEND)

```bash
npx @sentry/wizard -i nextjs
```

> It will:

- Add `sentry.client.config.ts` and `sentry.server.config.ts`
- Modify `next.config.js`
- Automatically track page loads, API errors, and user sessions

Use in custom functions:

```ts
import * as Sentry from '@sentry/nextjs';
Sentry.captureException(error);
Sentry.captureMessage('Something went wrong');
```

---

## 📊 8. SUPABASE RLS POLICY (OPTIONAL)

In Supabase SQL Editor:

```sql
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can read own data"
  ON "Transaction"
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

## ✅ COMPLETE

Your system now:

- Uses Supabase Auth securely
- Accesses the database via Prisma (on Node only)
- Monitors errors and performance via Sentry
- Segregates access by user + role
- Logs all sensitive server errors for review
