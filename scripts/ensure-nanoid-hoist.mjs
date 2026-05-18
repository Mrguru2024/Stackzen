/**
 * PostCSS loads `nanoid/non-secure` with plain `require()`. Next.js Turbopack evaluates
 * that in Node, where `turbopack.resolveAlias` does not apply. pnpm often keeps `nanoid`
 * only under `.pnpm/...`, so `node_modules/nanoid` is missing and dev returns 500.
 *
 * This script links `node_modules/nanoid` -> the real package (hoisted or pnpm store).
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const nm = path.join(root, 'node_modules');
const dest = path.join(nm, 'nanoid');

function resolveNanoidPackageDir() {
  const require = createRequire(path.join(root, 'package.json'));
  try {
    return path.dirname(require.resolve('nanoid/package.json', { paths: [nm] }));
  } catch {
    const pnpmDir = path.join(nm, '.pnpm');
    if (!fs.existsSync(pnpmDir)) {
      return null;
    }
    for (const name of fs.readdirSync(pnpmDir)) {
      if (!name.startsWith('nanoid@')) continue;
      const dir = path.join(pnpmDir, name, 'node_modules', 'nanoid');
      if (fs.existsSync(path.join(dir, 'package.json'))) {
        return dir;
      }
    }
  }
  return null;
}

const target = resolveNanoidPackageDir();
if (!target) {
  console.warn('[ensure-nanoid] nanoid not found under node_modules — skip (run pnpm install)');
  process.exit(0);
}

if (fs.existsSync(dest)) {
  try {
    if (fs.realpathSync(dest) === fs.realpathSync(target)) {
      process.exit(0);
    }
  } catch {
    // Broken or stale link — replace below.
  }
  fs.rmSync(dest, { recursive: true, force: true });
}

const absTarget = path.resolve(target);

fs.mkdirSync(nm, { recursive: true });

const type = process.platform === 'win32' ? 'junction' : 'dir';
fs.symlinkSync(absTarget, dest, type);
console.log(`[ensure-nanoid] linked ${path.relative(root, dest)} -> ${path.relative(root, absTarget)}`);
