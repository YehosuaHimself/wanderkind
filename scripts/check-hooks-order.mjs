#!/usr/bin/env node
/**
 * WK Hooks-Order Guard
 * 
 * Detects React hooks called AFTER a component-level early return.
 * This causes the React "Rendered more hooks than during previous render"
 * fatal invariant — which shows as a white screen.
 * 
 * Run: node scripts/check-hooks-order.mjs
 * CI:  exits with code 1 if violations found
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const HOOK_RE = /\b(useState|useEffect|useCallback|useMemo|useRef|useReducer|useContext|use[A-Z][A-Za-z]+)\s*[(<]/;

// An early return at component top-level looks like one of these patterns
// on a line by itself (not nested inside JSX or another callback):
const EARLY_RETURN_RE = /^\s{2,4}if\s*\([^)]+\)\s*return\s+(null|<[A-Z]|loading\b)/;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      walk(full, files);
    } else if (stat.isFile() && ['.tsx', '.ts'].includes(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

const root = new URL('..', import.meta.url).pathname;
const dirs = ['app', 'src/components', 'src/hooks'];

let violations = [];

for (const dir of dirs) {
  const fullDir = join(root, dir);
  let files;
  try { files = walk(fullDir); } catch { continue; }

  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    const lines = src.split('\n');

    // Find the export default function body
    let compStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^export default function \w+/.test(lines[i])) {
        compStart = i;
        break;
      }
    }
    if (compStart < 0) continue;

    // Walk lines, tracking rough brace depth
    // An "early return" is only counted at the TOP level of the component (depth 1)
    let depth = 0;
    let earlyReturns = []; // line numbers (1-indexed)
    let hookLines = [];    // {line, depth} at call site

    for (let i = compStart; i < lines.length; i++) {
      const line = lines[i];

      // Track depth
      for (const ch of line) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
      }

      const stripped = line.trim();
      if (stripped.startsWith('//') || stripped.startsWith('*')) continue;

      // Component top level = depth 1 (inside the function braces)
      if (depth === 1 && EARLY_RETURN_RE.test(line)) {
        earlyReturns.push(i + 1);
      }

      // Hook call — only flag at depth 1 (direct component body)
      if (depth === 1 && HOOK_RE.test(line)) {
        hookLines.push(i + 1);
      }
    }

    // Any hook called AFTER any early return?
    for (const ret of earlyReturns) {
      const bad = hookLines.filter(h => h > ret);
      if (bad.length > 0) {
        violations.push({
          file: file.replace(root, ''),
          returnLine: ret,
          hookLines: bad.slice(0, 5),
        });
      }
    }
  }
}

if (violations.length === 0) {
  console.log('✓ Hooks order check passed — no violations found.');
  process.exit(0);
} else {
  console.error(`\n✗ HOOKS-AFTER-EARLY-RETURN VIOLATIONS (${violations.length} files):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    early return at line ${v.returnLine}`);
    for (const h of v.hookLines) {
      console.error(`    hook at line ${h}`);
    }
    console.error('');
  }
  console.error('These cause a React invariant crash (white screen).');
  console.error('Move early returns to AFTER the last hook call in each component.\n');
  process.exit(1);
}
