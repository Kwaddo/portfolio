import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { distPathFor, extractTargets, hasId, sameDocFragments } from './links.ts';

const root = new URL('../dist', import.meta.url).pathname;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (name.endsWith('.html')) yield full;
  }
}

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const problems = [];
let checked = 0;
for (const file of walk(root)) {
  const html = readFileSync(file, 'utf8');
  const page = relative(root, file);
  for (const target of new Set(extractTargets(html))) {
    checked += 1;
    if (!distPathFor(target).some((p) => isFile(join(root, p)))) problems.push(`${page}: broken link ${target}`);
  }
  for (const id of new Set(sameDocFragments(html))) {
    if (!hasId(html, id)) problems.push(`${page}: missing #${id}`);
  }
}

if (problems.length > 0) {
  console.error(`Link problems (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
if (checked === 0) {
  console.error('check-links: no internal links were checked; the extractor matched nothing');
  process.exit(1);
}
console.log(`check-links: ${checked} internal links ok`);
