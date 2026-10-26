import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findViolations, ogImageOf } from './dist-rules.ts';

const root = new URL('../dist', import.meta.url).pathname;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (name.endsWith('.html') || name.endsWith('.xml')) yield full;
  }
}

const violations = [];
let pages = 0;
const xml = [];
for (const file of walk(root)) {
  pages += 1;
  const html = readFileSync(file, 'utf8');
  const rel = relative(root, file);
  violations.push(...findViolations(rel, html));
  if (file.endsWith('.xml')) { xml.push(rel); continue; }
  const og = ogImageOf(html);
  if (!og) violations.push(`${rel}: no og:image`);
  else if (!existsSync(join(root, og))) violations.push(`${rel}: og:image ${og} is not in dist`);
}

const required = ['rss.xml', 'sitemap-index.xml', 'robots.txt', '404.html'];
for (const file of required) {
  if (!existsSync(join(root, file))) violations.push(`${file}: missing from dist`);
}

if (violations.length > 0) {
  console.error(`Content rules broken (${violations.length}):\n${violations.join('\n')}`);
  process.exit(1);
}
console.log(`check-dist: ${pages} pages clean (xml scanned: ${xml.join(', ')})`);
