/**
 * Prisma client on Windows: generate into a NEW folder client_<timestamp> each run, then point
 * prisma/.generated/current (junction) at it. Tooling imports @prisma/client via prisma/.generated/current.
 *
 * A legacy locked prisma/.generated/client directory is never deleted here — it can be removed manually
 * after stopping Node/Next.
 */
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lenient = process.argv.includes('--lenient');
const prismaCli = path.join(root, 'node_modules', 'prisma', 'package.json');
const generatedRoot = path.join(root, 'prisma', '.generated');
const generatedCurrentStable = path.resolve(root, 'prisma', '.generated', 'current');
const codegenSchemaPath = path.join(root, 'prisma', 'schema.codegen.prisma');
const mainSchemaPath = path.join(root, 'prisma', 'schema.prisma');
const linkParent = path.join(root, 'node_modules', '.prisma');
const link = path.join(linkParent, 'client');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function removeNodeModulesPrismaClientLink() {
  if (!fs.existsSync(link)) return;
  try {
    fs.unlinkSync(link);
  } catch {
    try {
      fs.rmSync(link, { recursive: true, force: true, maxRetries: 12, retryDelay: 300 });
    } catch {
      // ignore
    }
  }
}

/** Drop prisma/.generated/current (small junction only — not the versioned client tree). */
function removeCurrentJunctionOnly() {
  const p = path.join(generatedRoot, 'current');
  if (!fs.existsSync(p)) return;
  try {
    fs.unlinkSync(p);
    return;
  } catch {
    // continue
  }
  if (process.platform === 'win32') {
    spawnSync('cmd', ['/c', 'rmdir', '/s', '/q', p], { stdio: 'ignore', windowsHide: true });
  }
  try {
    fs.rmSync(p, { recursive: true, force: true, maxRetries: 8, retryDelay: 200 });
  } catch {
    // ignore
  }
}

function writeCodegenSchema(versionFolder) {
  let text = fs.readFileSync(mainSchemaPath, 'utf8');
  if (!/output\s*=\s*"[^"]+"/m.test(text)) {
    throw new Error(`${mainSchemaPath} must define generator client output`);
  }
  const newLine = `  output   = "./.generated/${versionFolder}"`;
  text = text.replace(/^\s*output\s*=\s*"[^"]+"/m, newLine);
  fs.writeFileSync(codegenSchemaPath, text, 'utf8');
}

function createDirJunction(linkPath, targetAbs) {
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  const absTarget = path.resolve(targetAbs);
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(absTarget, linkPath, linkType);
}

function isSymlinkToTarget(linkPath, targetAbs) {
  if (!fs.existsSync(linkPath)) return false;
  try {
    return fs.realpathSync(linkPath) === fs.realpathSync(targetAbs);
  } catch {
    return false;
  }
}

function clearLinkPathForReplace() {
  if (!fs.existsSync(link)) return;
  if (isSymlinkToTarget(link, generatedCurrentStable)) {
    return;
  }
  const archive = `${link}_archived_${Date.now()}`;
  try {
    fs.renameSync(link, archive);
    return;
  } catch {
    // continue
  }
  try {
    fs.rmSync(link, { recursive: true, force: true, maxRetries: 15, retryDelay: 350 });
  } catch (e) {
    throw new Error(`Cannot replace ${link}: ${e.message}`);
  }
}

function ensureNodeModulesPrismaSymlink() {
  if (!fs.existsSync(generatedCurrentStable)) {
    throw new Error(`Missing ${generatedCurrentStable}`);
  }
  fs.mkdirSync(path.join(root, 'node_modules'), { recursive: true });
  fs.mkdirSync(linkParent, { recursive: true });
  if (isSymlinkToTarget(link, generatedCurrentStable)) {
    return;
  }
  clearLinkPathForReplace();
  fs.symlinkSync(path.resolve(generatedCurrentStable), link, process.platform === 'win32' ? 'junction' : 'dir');
}

function pruneOldVersionedClients(keepName) {
  if (!fs.existsSync(generatedRoot)) return;
  const prefix = 'client_';
  const now = Date.now();
  const maxAgeMs = 15 * 60 * 1000;
  for (const name of fs.readdirSync(generatedRoot)) {
    if (!name.startsWith(prefix) || name === keepName) continue;
    const stamp = Number(name.slice(prefix.length));
    if (!Number.isFinite(stamp) || now - stamp < maxAgeMs) continue;
    try {
      fs.rmSync(path.join(generatedRoot, name), { recursive: true, force: true, maxRetries: 5 });
    } catch {
      // locked — skip
    }
  }
}

async function runOnce() {
  removeNodeModulesPrismaClientLink();
  removeCurrentJunctionOnly();

  const versionFolder = `client_${Date.now()}`;
  writeCodegenSchema(versionFolder);

  const schemaArg = codegenSchemaPath.replace(/\\/g, '/');
  execSync(`npx prisma generate --schema "${schemaArg}"`, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  const versionDirAbs = path.join(generatedRoot, versionFolder);
  if (!fs.existsSync(versionDirAbs)) {
    throw new Error(`Generate did not create ${versionDirAbs}`);
  }

  fs.mkdirSync(generatedRoot, { recursive: true });
  createDirJunction(path.join(generatedRoot, 'current'), versionDirAbs);
  ensureNodeModulesPrismaSymlink();
  pruneOldVersionedClients(versionFolder);
}

async function main() {
  if (!fs.existsSync(prismaCli)) {
    console.log('[prisma-generate] prisma CLI not installed — skip');
    process.exit(0);
  }

  const attempts = 5;
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      await runOnce();
      process.exit(0);
    } catch (e) {
      lastErr = e;
      const waitMs = 800 + i * 1200;
      if (i < attempts - 1) {
        console.warn(
          `[prisma-generate] attempt ${i + 1}/${attempts} failed (${e?.message ?? e}); waiting ${waitMs}ms…`
        );
        await sleep(waitMs);
      }
    }
  }

  console.error('[prisma-generate]', lastErr?.message ?? lastErr);
  if (lenient) {
    console.warn('[prisma-generate] Continuing (lenient). Fix errors above and run: npm run prisma:generate');
    process.exit(0);
  }
  process.exit(1);
}

await main();
