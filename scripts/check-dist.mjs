import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findViolations } from './dist-rules.ts';

const root = new URL('../dist', import.meta.url).pathname;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (name.endsWith('.html')) yield full;
  }
}

const violations = [];
let pages = 0;
for (const file of walk(root)) {
  pages += 1;
  violations.push(...findViolations(relative(root, file), readFileSync(file, 'utf8')));
}

if (violations.length > 0) {
  console.error(`Content rules broken (${violations.length}):\n${violations.join('\n')}`);
  process.exit(1);
}
console.log(`check-dist: ${pages} pages clean`);
