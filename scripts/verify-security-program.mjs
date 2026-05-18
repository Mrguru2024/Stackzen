#!/usr/bin/env node
/**
 * Phase 12 — Program-level verification (files, docs, static checks).
 * Does not run Jest or Prisma migrate; use `npm run test:security` separately.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const root = process.cwd();

const REQUIRED_FILES = [
  'proxy.ts',
  'instrumentation.ts',
  'lib/security/audit-log.ts',
  'lib/security/redact.ts',
  'lib/security/encryption.ts',
  'lib/security/proxy-policy.ts',
  'lib/security/turnstile.ts',
  'lib/api/rate-limit-request.ts',
  'lib/api/require-admin.ts',
  'lib/api/require-auth.ts',
  'lib/db/owned.ts',
  'lib/ai/consent.ts',
  'app/admin/layout.tsx',
  '.github/workflows/security-tests.yml',
];

const REQUIRED_DOCS = [
  'docs/security/SECURITY_AUDIT_REPORT.md',
  'docs/security/SECURITY_IMPLEMENTATION_PLAN.md',
  'docs/security/SECURITY_INCIDENT_RESPONSE.md',
  'docs/security/DATA_CLASSIFICATION.md',
  'docs/security/SECURITY_RELEASE_CHECKLIST.md',
  'docs/security/AI_PRIVACY_CONTROLS.md',
  'docs/security/SECURITY_DELIVERY_CHECKLIST.md',
  'docs/security/PHASE_12_IMPLEMENTATION_LOG.md',
];

let failed = 0;

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  failed += 1;
}

function runNodeScript(rel) {
  const res = spawnSync(process.execPath, [join(root, rel)], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (res.status === 0) {
    ok(rel);
    return true;
  }
  fail(`${rel} exited ${res.status ?? 'unknown'}`);
  if (res.stderr?.trim()) console.error(res.stderr.trim());
  return false;
}

console.log('\nStackZen security program verification\n');

console.log('Core modules & config:');
for (const rel of REQUIRED_FILES) {
  if (existsSync(join(root, rel))) ok(rel);
  else fail(`missing ${rel}`);
}

const deprecatedSecurity = join(root, 'middleware/security.ts');
if (existsSync(deprecatedSecurity)) {
  const src = readFileSync(deprecatedSecurity, 'utf8');
  if (src.includes('@deprecated') && src.includes('export {}')) {
    ok('middleware/security.ts is deprecated stub (not in pipeline)');
  } else {
    fail('middleware/security.ts still contains active logic — merge into proxy.ts');
  }
}

console.log('\nDocumentation:');
for (const rel of REQUIRED_DOCS) {
  if (existsSync(join(root, rel))) ok(rel);
  else fail(`missing ${rel}`);
}

console.log('\nStatic checks:');
runNodeScript('scripts/check-public-env.mjs');
runNodeScript('scripts/check-financial-owned-queries.mjs');

console.log('');
if (failed > 0) {
  console.error(`Verification failed (${failed} issue(s)).\n`);
  process.exit(1);
}
console.log('Verification passed. Run: npm run test:security\n');
process.exit(0);
