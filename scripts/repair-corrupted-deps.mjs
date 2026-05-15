/**
 * Reinstalls corrupted npm packages common on Windows (partial tar extract).
 * - @prisma/client missing runtime/library.js
 * - @upstash/redis missing nodejs.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function rm(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

const libraryJs = path.join(root, 'node_modules', '@prisma', 'client', 'runtime', 'library.js');
const upstashNode = path.join(root, 'node_modules', '@upstash', 'redis', 'nodejs.mjs');

let didWork = false;

if (!fs.existsSync(libraryJs)) {
  didWork = true;
  console.error('[deps:repair] Missing @prisma/client/runtime/library.js — reinstalling Prisma…');
  rm(path.join(root, 'node_modules', '@prisma', 'client'));
  rm(path.join(root, 'node_modules', '.prisma'));
  execSync('npm install prisma@6.19.3 @prisma/client@6.19.3', {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  try {
    execSync('npm run prisma:generate', { cwd: root, stdio: 'inherit', env: process.env });
  } catch {
    console.warn(
      '[deps:repair] prisma generate failed. Close Node/IDE and run: npm run prisma:generate'
    );
  }
  if (!fs.existsSync(libraryJs)) {
    console.error('[deps:repair] Prisma client still broken. Try deleting node_modules and npm ci.');
    process.exit(1);
  }
  console.log('[deps:repair] Prisma client restored.');
} else {
  console.log('[deps:repair] Prisma client OK —', path.relative(root, libraryJs));
}

if (!fs.existsSync(upstashNode)) {
  didWork = true;
  console.error('[deps:repair] Missing @upstash/redis/nodejs.mjs — reinstalling @upstash/redis…');
  rm(path.join(root, 'node_modules', '@upstash', 'redis'));
  execSync('npm install @upstash/redis', { cwd: root, stdio: 'inherit', env: process.env });
  if (!fs.existsSync(upstashNode)) {
    console.error('[deps:repair] @upstash/redis still broken. Try deleting node_modules and npm ci.');
    process.exit(1);
  }
  console.log('[deps:repair] @upstash/redis restored.');
} else {
  console.log('[deps:repair] @upstash/redis OK —', path.relative(root, upstashNode));
}

if (didWork) {
  console.log('[deps:repair] Done. Remove .next and restart dev: Remove-Item -Recurse -Force .next');
}
