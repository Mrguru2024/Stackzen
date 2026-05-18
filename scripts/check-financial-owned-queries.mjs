#!/usr/bin/env node
/**
 * CI helper: flag findUnique({ where: { id } }) without userId in financial API routes.
 * Does not fail the build by default — prints warnings for incremental cleanup.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(process.cwd(), 'app', 'api');
const FINANCIAL_SEGMENTS = [
  'expenses',
  'income',
  'invoices',
  'bank',
  'plaid',
  'quotes',
  'financial',
  'stripe',
];

const pattern = /\.findUnique\s*\(\s*\{[^}]*where:\s*\{\s*id:/s;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (name === 'route.ts') files.push(p);
  }
  return files;
}

const hits = [];
for (const file of walk(ROOT)) {
  const rel = file.replace(process.cwd(), '').replace(/\\/g, '/');
  if (!FINANCIAL_SEGMENTS.some(seg => rel.includes(`/api/${seg}/`))) continue;
  const src = readFileSync(file, 'utf8');
  if (pattern.test(src) && !src.includes('userId')) {
    hits.push(rel);
  }
}

if (hits.length === 0) {
  console.log('[check-financial-owned-queries] OK — no obvious ID-only findUnique in financial routes');
  process.exit(0);
}

console.warn('[check-financial-owned-queries] Review routes (prefer findOwnedFirst / userId in where):');
for (const h of hits) console.warn(`  - ${h}`);
process.exit(0);
