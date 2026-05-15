/**
 * Parses TypeScript compiler output and prints error code (TSxxxx) counts.
 *
 * Usage:
 *   node scripts/count-tsc-errors.mjs
 *   node scripts/count-tsc-errors.mjs -p tsconfig.typecheck.json
 *   node scripts/count-tsc-errors.mjs path/to/tsc-log.txt
 *
 * If the first argument is an existing file, it is read instead of running tsc.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);

let text;
let exitCode = 0;
let fromFile = false;

if (argv.length > 0) {
  const candidate = path.resolve(root, argv[0]);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    text = fs.readFileSync(candidate, 'utf8');
    fromFile = true;
  } else {
    const r = spawnSync('npx', ['tsc', '--noEmit', ...argv], {
      cwd: root,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    text = `${r.stdout ?? ''}${r.stderr ?? ''}`;
    exitCode = r.status ?? 1;
  }
} else {
  const r = spawnSync('npx', ['tsc', '--noEmit'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  text = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  exitCode = r.status ?? 1;
}

const re = /error (TS\d+)/g;
const counts = new Map();
let m;
while ((m = re.exec(text)) !== null) {
  const code = m[1];
  counts.set(code, (counts.get(code) ?? 0) + 1);
}

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
const total = sorted.reduce((s, [, n]) => s + n, 0);

console.log(`TypeScript errors: ${total} (unique codes: ${sorted.length})\n`);
console.log('Code     Count');
console.log('------------');
for (const [code, n] of sorted.slice(0, 25)) {
  console.log(`${code.padEnd(9)}${n}`);
}
if (sorted.length > 25) {
  console.log(`... ${sorted.length - 25} more code(s)`);
}

const finalExit = fromFile ? (total > 0 ? 1 : 0) : exitCode === 0 ? 0 : 1;
process.exit(finalExit);
