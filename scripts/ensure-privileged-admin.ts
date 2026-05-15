/**
 * Idempotently ensures the privileged admin email exists in Postgres with SUPER_ADMIN + PRO.
 * Run from repo root (loads .env / .env.local): npx tsx scripts/ensure-privileged-admin.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const ADMIN_EMAIL = '5epmgllc@gmail.com';

async function main() {
  const prisma = new PrismaClient();
  const bootstrapPwd = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
  const passwordUpdate =
    bootstrapPwd && bootstrapPwd.length >= 8
      ? { password: await hash(bootstrapPwd, 12) }
      : {};

  try {
    const result = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        role: 'SUPER_ADMIN',
        subscriptionLevel: 'PRO',
        ...passwordUpdate,
      },
      create: {
        email: ADMIN_EMAIL,
        name: 'StackZen Admin',
        role: 'SUPER_ADMIN',
        subscriptionLevel: 'PRO',
        isTrialActive: false,
        ...passwordUpdate,
      },
      select: { id: true, email: true, role: true, subscriptionLevel: true, name: true },
    });
    console.log('OK:', result);
    const match = ADMIN_EMAIL.trim().toLowerCase();
    console.log(`Code-level privileged list (lib/auth/privileged-users.ts) should include "${match}".`);
    if (!bootstrapPwd || bootstrapPwd.length < 8) {
      console.log(
        'Tip: set ADMIN_BOOTSTRAP_PASSWORD (8+ chars) in .env.local when running this script to store a bcrypt password for email/password login.'
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
