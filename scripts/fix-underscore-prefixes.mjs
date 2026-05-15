/**
 * Consolidated codemod: removes erroneous `_` prefixes from imports and
 * `const`/`let`/`export const` declarations introduced by an earlier bad
 * unused-vars auto-fix.
 *
 * Covers: app/, lib/, components/, hooks/, __tests__/, __mocks__/, tests/.
 * Replaces (and supersedes) the older directory-scoped scripts:
 *   - scripts/fix-underscore-imports-dir.mjs
 *   - scripts/fix-underscore-api-imports.mjs
 *   - scripts/fix-underscore-app-imports.mjs
 *
 * Safety model (stricter than the older scripts):
 *   For each candidate `_name`:
 *     - Count occurrences of the prefixed identifier `_name` in the file.
 *     - Count occurrences of the bare identifier `name` in the file.
 *     - Rename only when:
 *         bare `name` appears ≥ 1 time, AND
 *         prefixed `_name` appears ≤ 1 time (i.e. only at the declaration / import).
 *   This preserves intentional `_local` style locals (where `_name` is
 *   declared *and* used with the prefix), while still fixing the broken
 *   pattern where the declaration was prefixed but every consumer kept the
 *   bare form.
 *
 * Imports:
 *   - `{ _Name }`        → `{ Name }`           (when safe by the rule above)
 *   - `{ _Name as Foo }` → left untouched       (aliased imports depend on
 *     the actual exported name and need a separate, exports-aware pass)
 *
 * Pass 2 (opt-in, `--rename-references`):
 *   For each `_name` declaration, rename it AND every `_name` reference in
 *   the file to bare `name` if BOTH:
 *     - bare `name` is referenced at least once in the file (i.e. there's a
 *       broken bare reference relying on the declaration), AND
 *     - bare `name` is NOT declared/imported elsewhere in the file (no name
 *       collision risk).
 *   This is the right fix for files that use a `_name` style throughout
 *   but have stray bare references — typical of a buggy auto-prefix that
 *   missed a few callsites (the runtime ReferenceErrors the user keeps
 *   hitting).
 *
 * Usage:
 *   node scripts/fix-underscore-prefixes.mjs                  # apply Pass 1
 *   node scripts/fix-underscore-prefixes.mjs --dry-run        # preview Pass 1
 *   node scripts/fix-underscore-prefixes.mjs --dry-run --diff # preview with renames
 *   node scripts/fix-underscore-prefixes.mjs -v               # list each updated file
 *   node scripts/fix-underscore-prefixes.mjs --rename-references --dry-run --diff
 *                                                             # preview Pass 2
 *   node scripts/fix-underscore-prefixes.mjs --rename-references
 *                                                             # apply Pass 1 + Pass 2
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

const TARGETS = ['app', 'lib', 'components', 'hooks', '__tests__', '__mocks__', 'tests'];
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'build',
  '.git',
  'coverage',
  '.cache',
]);

const args = process.argv.slice(2);
const DRY = args.includes('--dry') || args.includes('--dry-run');
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const SHOW_DIFF = args.includes('--diff');
const PASS_2 = args.includes('--rename-references');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && (p.endsWith('.ts') || p.endsWith('.tsx'))) out.push(p);
  }
  return out;
}

function escapeRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countMatches(source, regex) {
  return (source.match(regex) || []).length;
}

function safeToRename(name, source) {
  const escaped = escapeRe(name);
  const bareRe = new RegExp(`(?<![_A-Za-z0-9])${escaped}(?![A-Za-z0-9_])`, 'g');
  const prefixedRe = new RegExp(`(?<![A-Za-z0-9])_${escaped}(?![A-Za-z0-9_])`, 'g');
  const bareCount = countMatches(source, bareRe);
  const prefixedCount = countMatches(source, prefixedRe);
  return bareCount >= 1 && prefixedCount <= 1;
}

const renames = [];

function applyTransforms(content) {
  let next = content;
  const fileRenames = [];
  const tryRename = (matchedText, name, replacement) => {
    if (safeToRename(name, next)) {
      fileRenames.push(`_${name} → ${name}`);
      return replacement;
    }
    return matchedText;
  };

  next = next.replace(
    /(\bimport\b[^;{]*\{[^}]*?)\b_([A-Za-z][A-Za-z0-9_]*)\b(?!\s+as\b)/g,
    (m, prefix, name) => (safeToRename(name, next) ? `${prefix}${name}` : m)
  );

  next = next.replace(
    /\b(const|let)\s+_([A-Za-z][A-Za-z0-9_]*)(\s*[=:])/g,
    (m, kw, name, tail) => tryRename(m, name, `${kw} ${name}${tail}`)
  );

  next = next.replace(
    /\bexport\s+const\s+_([A-Za-z][A-Za-z0-9_]*)(\s*[=:])/g,
    (m, name, tail) => tryRename(m, name, `export const ${name}${tail}`)
  );

  next = next.replace(/\bfunction\s+_([A-Za-z][A-Za-z0-9_]*)(\s*[(<])/g, (m, name, tail) =>
    tryRename(m, name, `function ${name}${tail}`)
  );

  next = next.replace(
    /\bexport\s+(?:async\s+)?function\s+_([A-Za-z][A-Za-z0-9_]*)(\s*[(<])/g,
    (m, name, tail) => tryRename(m, name, m.replace(`_${name}`, name))
  );

  if (PASS_2) {
    const reExportAliasRe = /\bexport\s*\{[^}]*_[A-Za-z][A-Za-z0-9_]*\s+as\s+[A-Za-z]/;
    if (reExportAliasRe.test(next)) {
      return { next, fileRenames };
    }

    const declRe =
      /\b(?:const|let|var|function|class)\s+_([A-Za-z][A-Za-z0-9_]*)|\bexport\s+(?:const|function|class)\s+_([A-Za-z][A-Za-z0-9_]*)/g;
    const candidates = new Set();
    let m;
    while ((m = declRe.exec(next)) !== null) candidates.add(m[1] ?? m[2]);

    for (const name of candidates) {
      const escaped = escapeRe(name);
      const otherDeclRe = new RegExp(
        `\\b(?:const|let|var|function|class)\\s+${escaped}\\b|` +
          `\\bimport\\s+(?:type\\s+)?(?:[^;{]*\\b${escaped}\\b[^;{]*|\\{[^}]*\\b${escaped}\\b[^}]*\\})\\s+from\\b`
      );
      if (otherDeclRe.test(next)) continue;

      const bareRefRe = new RegExp(`(?<![_A-Za-z0-9])${escaped}(?![A-Za-z0-9_])`);
      if (!bareRefRe.test(next)) continue;

      const allPrefixedRe = new RegExp(`(?<![A-Za-z0-9])_${escaped}(?![A-Za-z0-9_])`, 'g');
      if (allPrefixedRe.test(next)) {
        next = next.replace(allPrefixedRe, name);
        fileRenames.push(`(pass2) _${name} → ${name}`);
      }
    }
  }

  return { next, fileRenames };
}

const changedFiles = [];

for (const target of TARGETS) {
  const dir = path.join(repoRoot, target);
  for (const file of walk(dir)) {
    const orig = fs.readFileSync(file, 'utf8');
    const { next, fileRenames } = applyTransforms(orig);
    if (next !== orig) {
      const rel = path.relative(repoRoot, file);
      changedFiles.push({ rel, fileRenames });
      if (!DRY) fs.writeFileSync(file, next);
    }
  }
}

if (VERBOSE || DRY) {
  for (const { rel, fileRenames } of changedFiles) {
    console.log(`${DRY ? '[dry] ' : ''}${rel}`);
    if (SHOW_DIFF) {
      const unique = Array.from(new Set(fileRenames));
      for (const r of unique) console.log(`    ${r}`);
    }
  }
}
console.log(`\n${DRY ? 'Would update' : 'Updated'} ${changedFiles.length} file(s).`);
