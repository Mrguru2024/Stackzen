#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env.example');
const text = readFileSync(envPath, 'utf8');
const env = {};
for (const line of text.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=/);
  if (m) env[m[1]] = line.split('=').slice(1).join('=').replace(/^"|"$/g, '');
}

const SUSPICIOUS = [/secret/i, /password/i, /sk_live_/i, /service[_-]?role/i];

const issues = [];
for (const [key, value] of Object.entries(env)) {
  if (!key.startsWith('NEXT_PUBLIC_')) continue;
  for (const p of SUSPICIOUS) {
    if (p.test(key) || p.test(value)) {
      issues.push(key);
      break;
    }
  }
}

if (issues.length) {
  console.error('[check-public-env] Suspicious NEXT_PUBLIC_* in .env.example:', issues.join(', '));
  process.exit(1);
}

console.log('[check-public-env] OK');
process.exit(0);
