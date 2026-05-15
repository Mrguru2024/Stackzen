import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const prismaCli = path.join(root, 'node_modules', 'prisma', 'package.json');

if (!fs.existsSync(prismaCli)) {
  console.log('[postinstall] prisma CLI not installed (e.g. --omit=dev) — skip generate');
  process.exit(0);
}

const retryScript = path.join(root, 'scripts', 'prisma-generate-retry.mjs');
const r = spawnSync(process.execPath, [retryScript, '--lenient'], {
  cwd: root,
  stdio: 'inherit',
});

process.exit(r.status ?? 1);
