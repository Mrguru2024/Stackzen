import fs from 'fs';

const text = fs.readFileSync('.cursor-tsc-errors.txt', 'utf8');
const lines = text.split(/\r?\n/).filter((l) => /error TS\d+/.test(l));

function pathOf(line) {
  const m = line.match(/^([^(]+)\(/);
  return m ? m[1].replace(/\\/g, '/') : 'unknown';
}

function isSecLib(p) {
  if (!p.startsWith('lib/')) return false;
  const prefixes = [
    'lib/auth',
    'lib/api/require',
    'lib/api/production',
    'lib/api/rate-limit',
    'lib/env',
    'lib/stripe',
    'lib/security',
    'lib/encryption',
    'lib/password',
    'lib/webhook',
    'lib/prisma',
  ];
  return prefixes.some((x) => p.startsWith(x));
}

const buckets = {
  app_api: 0,
  lib_auth_security_payment: 0,
  lib_other: 0,
  prisma_mismatch_line: 0,
  components: 0,
  tests: 0,
  dev_only: 0,
  app_non_api: 0,
  hooks: 0,
  services: 0,
  scripts: 0,
  server: 0,
  store: 0,
  misc: 0,
};

for (const l of lines) {
  const p = pathOf(l);
  const prismaLine =
    /Prisma|UncheckedUpdate|Select<DefaultArgs>|PrismaClient|OrderByWithRelationInput/.test(l);
  if (p.startsWith('app/api/')) buckets.app_api++;
  else if (isSecLib(p)) buckets.lib_auth_security_payment++;
  else if (p.startsWith('lib/')) buckets.lib_other++;
  else if (prismaLine && (p.startsWith('app/') || p.startsWith('components/')))
    buckets.prisma_mismatch_line++;
  else if (p.startsWith('components/')) buckets.components++;
  else if (/\.test\.|\.spec\.|__tests__|\/tests\//.test(p)) buckets.tests++;
  else if (p.includes('components/dev')) buckets.dev_only++;
  else if (p.startsWith('app/')) buckets.app_non_api++;
  else if (p.startsWith('hooks/')) buckets.hooks++;
  else if (p.startsWith('services/')) buckets.services++;
  else if (p.startsWith('scripts/')) buckets.scripts++;
  else if (p.startsWith('server/')) buckets.server++;
  else if (p.startsWith('store/')) buckets.store++;
  else buckets.misc++;
}

console.log(JSON.stringify({ total: lines.length, buckets }, null, 2));
