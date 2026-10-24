import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { assetPaths, BUDGET_BYTES, fontUrls, isLatinFont } from './budget.ts';

const root = new URL('../dist', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p.replace(/^\//, '')));
const gz = (buf) => gzipSync(buf).length;

const htmlBuf = readFileSync(join(root, 'index.html'));
const { css, js } = assetPaths(htmlBuf.toString('utf8'));
if (css.length === 0) {
  console.error('No stylesheet found in dist/index.html; the budget would be undercounted.');
  process.exit(1);
}

let total = gz(htmlBuf);
const parts = [['html', total]];
const fonts = new Set();
let cssText = '';
for (const path of css) {
  const buf = read(path);
  total += gz(buf);
  parts.push([path, gz(buf)]);
  cssText += buf.toString('utf8');
  for (const url of fontUrls(buf.toString('utf8'))) if (isLatinFont(url)) fonts.add(url);
}
if (fonts.size === 0 && cssText.includes('.woff2')) {
  console.error('Stylesheet references .woff2 but no Latin font was counted; the budget would be undercounted.');
  process.exit(1);
}
for (const path of js) {
  const size = gz(read(path));
  total += size;
  parts.push([path, size]);
}
for (const url of fonts) {
  const size = read(url).length;
  total += size;
  parts.push([url, size]);
}

console.log(parts.map(([n, s]) => `${String(s).padStart(7)}  ${n}`).join('\n'));
console.log(`${String(total).padStart(7)}  total (budget ${BUDGET_BYTES})`);
if (total > BUDGET_BYTES) {
  console.error('Landing page is over the transfer budget.');
  process.exit(1);
}
