# Phase 3: Polish and Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the finished site from "works" to "ready to announce": static Open Graph cards, structured data, automated link and performance-budget checks, Lighthouse in CI, cross-browser layout coverage, the remaining project media, and the launch gates (including the history scrub and the first public push).

**Architecture:** Same static Astro site. New checks are small pure functions in `scripts/` (unit-tested with Vitest) wrapped by thin Node scripts and chained into `npm run verify`. Lighthouse CI and extra Playwright browsers run in CI. Launch steps that publish anything are explicit, one at a time, and need the owner's confirmation.

**Tech Stack:** Phase 1 and 2 stack plus `sharp` (OG card rendering), `@lhci/cli` 0.15.1, Playwright Firefox and WebKit.

**Prerequisite:** Phases 1 and 2 are complete (`git tag phase-1`, `git tag phase-2` exist; `npm run verify` and `npm run e2e` pass).

## Global Constraints

Phase 1 and Phase 2 Global Constraints still apply. The ones that matter most here:

- Node `22.23.4` (`fnm use 22.23.4`, or prefix `fnm exec --using=22.23.4`).
- **Content rules:** no AI-tooling mentions anywhere on the site or in the published git history; Tanami role line only; only the two credentials; no phone number; the plain email address never in HTML.
- **Identity:** "Ali Khalaf"; "Kwaddo" only inside URLs; "Quad" never.
- **Performance and accessibility targets:** Lighthouse mobile at or above 95 for performance and accessibility on the landing page, a work page, a game page and the journal index; landing under 200 KB transferred excluding images; text contrast at least 4.5:1.
- **Open Graph:** a handful of static 1200x630 images, one per section (landing, work, personal, journal, about). No build-time image generation dependency; the cards are generated once by a script and committed.
- **Outward-facing actions** (creating the GitHub repository, pushing, enabling Pages, changing the GitHub profile or global git identity) each need the owner's explicit confirmation immediately before they run.
- **Commits:** conventional prefixes; **never a `Co-Authored-By` trailer.**
- **Quality gate:** `npm run verify` and `npm run e2e` pass before every commit that touches code.

## File Structure

```
src/lib/og.ts  src/lib/jsonld.ts
scripts/dist-rules.ts          (extended: ogImageOf)
scripts/links.ts               pure link extraction/resolution (tested)
scripts/check-links.mjs  scripts/budget.ts  scripts/check-budget.mjs
scripts/make-og.mjs  scripts/lighthouse.mjs
public/og/{landing,work,personal,journal,about}.png
lighthouserc.json
tests/og.test.ts  tests/jsonld.test.ts  tests/links.test.ts  tests/budget.test.ts
```

Modified: `src/layouts/Base.astro`, `src/pages/about.astro`, `src/content.config.ts`, `src/pages/work/[slug].astro`, `scripts/check-dist.mjs`, `tests/dist-rules.test.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`, `package.json`.

---

### Task 1: Open Graph cards (TDD for the mapping)

**Files:**
- Create: `src/lib/og.ts`, `scripts/make-og.mjs`, `public/og/*.png` (generated)
- Modify: `src/layouts/Base.astro`, `scripts/dist-rules.ts`, `scripts/check-dist.mjs`, `package.json`
- Test: `tests/og.test.ts`, extend `tests/dist-rules.test.ts`

**Interfaces:**
- Produces:
  - `ogImageFor(pathname: string): string`: `/og/landing.png` for `/` and any page outside a section; `/og/work.png`, `/og/personal.png`, `/og/journal.png`, `/og/about.png` for `/work/...`, `/personal/...`, `/journal/...`, `/about/...`.
  - `ogImageOf(html: string): string | undefined` in `scripts/dist-rules.ts`: the `og:image` URL path of a page.
  - Every page carries `og:image` (absolute URL), `og:image:width/height`, `twitter:card=summary_large_image`, `twitter:image`.

- [ ] **Step 1: Write the failing tests**

`tests/og.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { ogImageFor } from '../src/lib/og';

describe('ogImageFor', () => {
  test('uses the landing card for the root and unlisted pages', () => {
    expect(ogImageFor('/')).toBe('/og/landing.png');
    expect(ogImageFor('/contact/')).toBe('/og/landing.png');
    expect(ogImageFor('/resume/')).toBe('/og/landing.png');
  });
  test('maps each section to its card, including nested pages', () => {
    expect(ogImageFor('/work/')).toBe('/og/work.png');
    expect(ogImageFor('/work/tanami/')).toBe('/og/work.png');
    expect(ogImageFor('/personal/games/smobb/')).toBe('/og/personal.png');
    expect(ogImageFor('/journal/2026-10-24/')).toBe('/og/journal.png');
    expect(ogImageFor('/about/croozz/')).toBe('/og/about.png');
  });
  test('does not match siblings that share a prefix', () => {
    expect(ogImageFor('/workshop/')).toBe('/og/landing.png');
  });
});
```

Append to `tests/dist-rules.test.ts` (and add `ogImageOf` to its import from `../scripts/dist-rules`):
```ts
describe('ogImageOf', () => {
  test('reads the path of the og:image meta tag', () => {
    const html = '<meta property="og:image" content="https://kwaddo.github.io/og/work.png" />';
    expect(ogImageOf(html)).toBe('/og/work.png');
  });
  test('returns undefined when absent', () => {
    expect(ogImageOf('<html></html>')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test -- og dist-rules`
Expected: FAIL, cannot resolve `../src/lib/og`; `ogImageOf` is not exported.

- [ ] **Step 3: Implement**

`src/lib/og.ts`:
```ts
const SECTIONS = ['work', 'personal', 'journal', 'about'] as const;

export const ogImageFor = (pathname: string): string => {
  const section = SECTIONS.find((s) => pathname === `/${s}/` || pathname.startsWith(`/${s}/`));
  return `/og/${section ?? 'landing'}.png`;
};
```

Append to `scripts/dist-rules.ts`:
```ts
export function ogImageOf(html: string): string | undefined {
  const match = html.match(/<meta property="og:image" content="([^"]+)"/);
  return match ? new URL(match[1]).pathname : undefined;
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 5: Install `sharp` and write the card generator**

```bash
npm install --save-dev --save-exact sharp@0.35.5
```

`scripts/make-og.mjs`:
```js
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const out = new URL('../public/og/', import.meta.url);
mkdirSync(out, { recursive: true });

const svg = ({ title, sub, invert }) => {
  const bg = invert ? '#0a0a0a' : '#fafafa';
  const fg = invert ? '#fafafa' : '#0a0a0a';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1.6" fill="${fg}" fill-opacity="0.14"/></pattern></defs>
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="${fg}" stroke-width="8"/>
  <polygon points="${W - 380},${H - 38} ${W - 38},${H - 38} ${W - 38},${H - 330}" fill="${fg}"/>
  <text x="90" y="${H / 2 + 10}" font-family="Impact, 'Arial Narrow', sans-serif" font-size="150" fill="${fg}" letter-spacing="2">${title}</text>
  <text x="94" y="${H / 2 + 90}" font-family="Helvetica, Arial, sans-serif" font-size="44" fill="${fg}" fill-opacity="0.85">${sub}</text>
</svg>`;
};

const cards = {
  landing: { title: 'ALI KHALAF', sub: 'Software Engineer', invert: false },
  work: { title: 'WORK', sub: 'Roles and the systems behind them', invert: false },
  personal: { title: 'PERSONAL', sub: 'Games, experiments and their stories', invert: true },
  journal: { title: 'JOURNAL', sub: 'Short daily notes', invert: false },
  about: { title: 'ABOUT', sub: 'A software engineer from Bahrain', invert: true },
};

for (const [name, card] of Object.entries(cards)) {
  await sharp(Buffer.from(svg(card))).png().toFile(new URL(`${name}.png`, out).pathname);
  console.log(`public/og/${name}.png`);
}
```
Add to `package.json` scripts: `"og": "node scripts/make-og.mjs"`.

- [ ] **Step 6: Generate and inspect the cards**

```bash
npm run og
```
Expected: five lines printed, five PNGs in `public/og/`. Open two with the Read tool (for example `public/og/landing.png` and `public/og/personal.png`). Expected: bold condensed title on paper or ink, halftone dots, thick frame, a solid diagonal corner; text is fully inside the frame. Regenerate after editing the card text; the PNGs are committed.

- [ ] **Step 7: Wire the cards into the layout**

In `src/layouts/Base.astro` frontmatter add `import { ogImageFor } from '../lib/og';` and
```astro
const image = canonical(ogImageFor(Astro.url.pathname));
```
In `<head>` replace `<meta name="twitter:card" content="summary" />` with:
```astro
    <meta property="og:image" content={image} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={image} />
```

- [ ] **Step 8: Make the build check the cards**

In `scripts/check-dist.mjs` change the import to `import { findViolations, ogImageOf } from './dist-rules.ts';` and, inside the page loop, after `violations.push(...findViolations(...))`, replace the loop body so it reads the file once:
```js
for (const file of walk(root)) {
  pages += 1;
  const html = readFileSync(file, 'utf8');
  const rel = relative(root, file);
  violations.push(...findViolations(rel, html));
  const og = ogImageOf(html);
  if (!og) violations.push(`${rel}: no og:image`);
  else if (!existsSync(join(root, og))) violations.push(`${rel}: og:image ${og} is not in dist`);
}
```

- [ ] **Step 9: Verify**

```bash
npm run verify
```
Expected: passes. `grep -o 'og:image" content="[^"]*' dist/work/tanami/index.html` prints `.../og/work.png`; `dist/og/landing.png` exists.

- [ ] **Step 10: Commit**

```bash
git add src scripts tests public/og package.json package-lock.json
git commit -m "feat: add static Open Graph cards and check them at build"
```

---

### Task 2: JSON-LD `Person` on About (TDD)

**Files:**
- Create: `src/lib/jsonld.ts`
- Modify: `src/layouts/Base.astro`, `src/pages/about.astro`
- Test: `tests/jsonld.test.ts`

**Interfaces:**
- Produces: `personLd(): Record<string, unknown>` (schema.org `Person`: name, jobTitle, url, sameAs from `site.links`, address country; never an email or telephone); `jsonLdScript(data: Record<string, unknown>): string` (JSON with `<` escaped as `<` so it is safe inside a `<script>`); a named slot `head` in `Base`.

- [ ] **Step 1: Write the failing tests**

`tests/jsonld.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { jsonLdScript, personLd } from '../src/lib/jsonld';
import { site } from '../src/data/site';

describe('personLd', () => {
  const ld = personLd();
  test('is a schema.org Person with the public identity', () => {
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Ali Khalaf');
    expect(ld.jobTitle).toBe('Software Engineer');
  });
  test('links to the profiles in site data', () => {
    expect(ld.sameAs).toEqual([site.links.github, site.links.linkedin]);
  });
  test('never contains an email or phone number', () => {
    const text = JSON.stringify(ld);
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}|mailto|telephone|"email"/i);
    expect(text).not.toMatch(/\b(?:\+?973[\s-]?)?3\d{3}[\s-]?\d{4}\b/);
  });
});

describe('jsonLdScript', () => {
  test('escapes < so the payload cannot close the script tag', () => {
    expect(jsonLdScript({ a: '</script><b>' })).not.toContain('<');
    expect(JSON.parse(jsonLdScript({ a: '</script>' })).a).toBe('</script>');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test -- jsonld`
Expected: FAIL, cannot resolve `../src/lib/jsonld`.

- [ ] **Step 3: Implement**

`src/lib/jsonld.ts`:
```ts
import { site } from '../data/site';

export const personLd = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  jobTitle: site.role,
  url: site.url,
  sameAs: [site.links.github, site.links.linkedin],
  address: { '@type': 'PostalAddress', addressCountry: 'BH' },
});

export const jsonLdScript = (data: Record<string, unknown>): string =>
  JSON.stringify(data).replace(/</g, '\\u003c');
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- jsonld`
Expected: PASS.

- [ ] **Step 5: Add the head slot and use it on About**

In `src/layouts/Base.astro`, add `<slot name="head" />` just before `</head>`.

In `src/pages/about.astro` add to the frontmatter `import { jsonLdScript, personLd } from '../lib/jsonld';` and, as the first child inside `<Base ...>`:
```astro
  <script slot="head" type="application/ld+json" set:html={jsonLdScript(personLd())} />
```

- [ ] **Step 6: Verify**

```bash
npm run verify
grep -c 'application/ld+json' dist/about/index.html dist/index.html
```
Expected: verify passes; counts print `1` for About and `0` for the landing page. The JSON in the About page contains no email or phone number.

- [ ] **Step 7: Commit**

```bash
git add src tests
git commit -m "feat: add JSON-LD Person data to the About page"
```

---

### Task 3: Link and fragment check (TDD)

**Files:**
- Create: `scripts/links.ts`, `scripts/check-links.mjs`
- Modify: `package.json`
- Test: `tests/links.test.ts`

**Interfaces:**
- Produces:
  - `extractTargets(html: string): string[]`: internal `href` and `src` values (paths starting with `/`, not `//`), with query strings and fragments removed; external URLs, `mailto:`, `tel:` and bare fragments are ignored.
  - `distPathFor(target: string): string[]`: candidate files under `dist/` for a path: `/work/` → `['work/index.html']`; `/rss.xml` → `['rss.xml']`; `/work` → `['work', 'work/index.html']`.
  - `sameDocFragments(html: string): string[]`: fragment ids linked from the page itself (`href="#main"` → `main`).
  - `hasId(html: string, id: string): boolean`.
  - `npm run check:links` fails if an internal target or same-page fragment is missing.

- [ ] **Step 1: Write the failing tests**

`tests/links.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { distPathFor, extractTargets, hasId, sameDocFragments } from '../scripts/links';

describe('extractTargets', () => {
  test('keeps internal href and src, strips query and fragment', () => {
    const html = '<a href="/work/#x">a</a><img src="/_astro/a.webp?v=1"><a href="https://x.dev/">e</a><a href="//cdn.x/a">p</a><a href="mailto:a@b.c">m</a><a href="#top">f</a>';
    expect(extractTargets(html)).toEqual(['/work/', '/_astro/a.webp']);
  });
  test('reads srcset candidates', () => {
    expect(extractTargets('<img srcset="/a.webp 400w, /b.webp 800w">')).toEqual(['/a.webp', '/b.webp']);
  });
});

describe('distPathFor', () => {
  test('directory paths resolve to index.html', () => {
    expect(distPathFor('/work/')).toEqual(['work/index.html']);
    expect(distPathFor('/')).toEqual(['index.html']);
  });
  test('file paths resolve to themselves', () => {
    expect(distPathFor('/rss.xml')).toEqual(['rss.xml']);
  });
  test('extensionless paths try the file and the directory', () => {
    expect(distPathFor('/work')).toEqual(['work', 'work/index.html']);
  });
});

describe('fragments', () => {
  test('sameDocFragments lists ids linked from the page', () => {
    expect(sameDocFragments('<a href="#main">m</a><a href="/x/#y">n</a>')).toEqual(['main']);
  });
  test('hasId finds an element id', () => {
    expect(hasId('<main id="main">', 'main')).toBe(true);
    expect(hasId('<main id="other">', 'main')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test -- links`
Expected: FAIL, cannot resolve `../scripts/links`.

- [ ] **Step 3: Implement**

`scripts/links.ts`:
```ts
const clean = (value: string): string => value.split('#')[0].split('?')[0];
const isInternal = (value: string): boolean => value.startsWith('/') && !value.startsWith('//');

export function extractTargets(html: string): string[] {
  const out: string[] = [];
  for (const [, , value] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    if (isInternal(value)) out.push(clean(value));
  }
  for (const [, value] of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const candidate of value.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (isInternal(url)) out.push(clean(url));
    }
  }
  return out;
}

export function distPathFor(target: string): string[] {
  const path = target.replace(/^\//, '');
  if (path === '' || path.endsWith('/')) return [`${path}index.html`];
  const last = path.split('/').pop() ?? '';
  return last.includes('.') ? [path] : [path, `${path}/index.html`];
}

export function sameDocFragments(html: string): string[] {
  return [...html.matchAll(/\shref="#([^"]+)"/g)].map((m) => m[1]);
}

export function hasId(html: string, id: string): boolean {
  return html.includes(`id="${id}"`);
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- links`
Expected: PASS.

- [ ] **Step 5: Write the runner**

`scripts/check-links.mjs`:
```js
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

const problems = [];
let checked = 0;
for (const file of walk(root)) {
  const html = readFileSync(file, 'utf8');
  const page = relative(root, file);
  for (const target of new Set(extractTargets(html))) {
    checked += 1;
    if (!distPathFor(target).some((p) => existsSync(join(root, p)))) problems.push(`${page}: broken link ${target}`);
  }
  for (const id of new Set(sameDocFragments(html))) {
    if (!hasId(html, id)) problems.push(`${page}: missing #${id}`);
  }
}

if (problems.length > 0) {
  console.error(`Link problems (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`check-links: ${checked} internal links ok`);
```

- [ ] **Step 6: Chain it into `verify`**

In `package.json`, add `"check:links": "node scripts/check-links.mjs"` and change `verify` to:
```json
"verify": "npm run check && npm run test && npm run build && npm run check:dist && npm run check:links"
```

- [ ] **Step 7: Verify, including a deliberate break**

```bash
npm run verify
```
Expected: passes, ending `check-links: N internal links ok`.

Prove it catches breakage: in `src/components/Nav.astro` temporarily change the Work link target by editing `src/lib/nav.ts` `'/work/'` to `'/wrk/'`, run `npm run build && npm run check:links`. Expected: exit 1 listing `broken link /wrk/` on every page. Revert with `git checkout src/lib/nav.ts`.

- [ ] **Step 8: Commit**

```bash
git add scripts tests package.json
git commit -m "feat: add internal link and fragment check to the build gate"
```

---

### Task 4: Landing-page performance budget (TDD)

**Files:**
- Create: `scripts/budget.ts`, `scripts/check-budget.mjs`
- Modify: `package.json`
- Test: `tests/budget.test.ts`

**Interfaces:**
- Produces:
  - `assetPaths(html: string): { css: string[]; js: string[] }`: internal stylesheet and script URLs referenced by a page (`<link rel="stylesheet" href>`, `<script src>`).
  - `fontUrls(css: string): string[]`: all `url(...)` targets ending in `.woff2` in a stylesheet.
  - `isLatinFont(url: string): boolean`: true for `...-latin-wght-normal...` and `...-latin-400-normal...` files, false for `latin-ext`, `cyrillic`, `greek` and `vietnamese` subsets (browsers never download those for an English page).
  - `BUDGET_BYTES = 200_000`; `npm run check:budget` sums gzip size of the landing HTML, its CSS and JS, plus raw bytes of the Latin fonts it needs, and fails above the budget.

- [ ] **Step 1: Write the failing tests**

`tests/budget.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { assetPaths, BUDGET_BYTES, fontUrls, isLatinFont } from '../scripts/budget';

describe('assetPaths', () => {
  test('finds internal stylesheets and scripts only', () => {
    const html =
      '<link rel="stylesheet" href="/_astro/a.css"><link rel="stylesheet" href="https://x.dev/b.css"><script type="module" src="/_astro/a.js"></script><link rel="icon" href="/favicon.svg">';
    expect(assetPaths(html)).toEqual({ css: ['/_astro/a.css'], js: ['/_astro/a.js'] });
  });
});

describe('assetPaths attribute order', () => {
  test('finds a stylesheet whose href comes before rel', () => {
    expect(assetPaths('<link href="/_astro/b.css" rel="stylesheet">').css).toEqual(['/_astro/b.css']);
  });
});

describe('fontUrls', () => {
  test('lists woff2 urls in a stylesheet', () => {
    const css = '@font-face{src:url(/_astro/inter-latin-wght-normal.abc.woff2) format("woff2")}@font-face{src:url(/_astro/x.woff) format("woff")}';
    expect(fontUrls(css)).toEqual(['/_astro/inter-latin-wght-normal.abc.woff2']);
  });
});

describe('isLatinFont', () => {
  test('accepts the latin subsets the page downloads', () => {
    expect(isLatinFont('/_astro/inter-latin-wght-normal.Dx4kXJAl.woff2')).toBe(true);
    expect(isLatinFont('/_astro/anton-latin-400-normal.Byf51wtH.woff2')).toBe(true);
  });
  test('rejects other subsets', () => {
    expect(isLatinFont('/_astro/inter-latin-ext-wght-normal.DO1Apj_S.woff2')).toBe(false);
    expect(isLatinFont('/_astro/inter-cyrillic-wght-normal.Dq.woff2')).toBe(false);
  });
  test('the budget is the spec value', () => {
    expect(BUDGET_BYTES).toBe(200_000);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test -- budget`
Expected: FAIL, cannot resolve `../scripts/budget`.

- [ ] **Step 3: Implement**

`scripts/budget.ts`:
```ts
export const BUDGET_BYTES = 200_000;

const internal = (v: string): boolean => v.startsWith('/') && !v.startsWith('//');

const attr = (tag: string, name: string): string | undefined => tag.match(new RegExp(`\\s${name}="([^"]+)"`))?.[1];

export function assetPaths(html: string): { css: string[]; js: string[] } {
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((m) => m[0]).filter((t) => /\srel="stylesheet"/.test(t));
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
  const pick = (tags: string[], name: string) =>
    tags.map((t) => attr(t, name)).filter((v): v is string => v !== undefined && internal(v));
  return { css: pick(links, 'href'), js: pick(scripts, 'src') };
}

export function fontUrls(css: string): string[] {
  return [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) => m[1].replace(/["']/g, ''));
}

export const isLatinFont = (url: string): boolean => /-latin-(?:wght|\d+)-normal/.test(url);
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- budget`
Expected: PASS.

- [ ] **Step 5: Write the runner**

`scripts/check-budget.mjs`:
```js
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
for (const path of css) {
  const buf = read(path);
  total += gz(buf);
  parts.push([path, gz(buf)]);
  for (const url of fontUrls(buf.toString('utf8'))) if (isLatinFont(url)) fonts.add(url);
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
```

- [ ] **Step 6: Chain it into `verify`**

In `package.json` add `"check:budget": "node scripts/check-budget.mjs"` and append `&& npm run check:budget` to `verify`.

- [ ] **Step 7: Verify**

```bash
npm run verify
```
Expected: passes; the table shows the landing HTML, CSS, JS and two Latin fonts well under 200000 bytes. If it is over, the biggest line says what to cut (usually an unexpectedly large script or a font subset).

- [ ] **Step 8: Commit**

```bash
git add scripts tests package.json
git commit -m "feat: enforce the landing-page transfer budget at build"
```

---

### Task 5: Lighthouse CI and cross-browser Playwright

**Files:**
- Create: `lighthouserc.json`, `scripts/lighthouse.mjs`
- Modify: `package.json`, `playwright.config.ts`, `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `npm run lighthouse` (mobile preset, three runs, fails below 0.95 performance or accessibility on four pages); Playwright projects `firefox` and `webkit-phone` running the layout spec; a `lighthouse` CI job.

- [ ] **Step 1: Install and configure Lighthouse CI**

```bash
npm install --save-dev --save-exact @lhci/cli@0.15.1
```

`lighthouserc.json` (Lighthouse CI defaults to the mobile form factor with throttling, which is the spec's target; reports stay local):
```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": [
        "/index.html",
        "/work/tanami/index.html",
        "/personal/games/smobb/index.html",
        "/journal/index.html"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }]
      }
    },
    "upload": { "target": "filesystem", "outputDir": "./.lighthouseci" }
  }
}
```
Append `.lighthouseci/` to `.gitignore`.

`scripts/lighthouse.mjs` (uses Playwright's Chromium so no separate Chrome is needed):
```js
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const result = spawnSync('npx', ['lhci', 'autorun'], {
  stdio: 'inherit',
  env: { ...process.env, CHROME_PATH: chromium.executablePath() },
});
process.exit(result.status ?? 1);
```
`package.json` scripts: `"lighthouse": "npm run build && node scripts/lighthouse.mjs"`.

- [ ] **Step 2: Run it**

```bash
npm run lighthouse
```
Expected: all assertions pass (performance and accessibility at or above 0.95 on the four pages). If one fails, the output names the page and audit; fix the cause (contrast, missing alt, heading order, a large unoptimized image) and rerun. Do not lower the threshold.

- [ ] **Step 3: Add cross-browser projects to Playwright**

```bash
npx playwright install firefox webkit
```
In `playwright.config.ts` extend `projects`:
```ts
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /layout\.spec\.ts/ },
    { name: 'webkit-phone', use: { ...devices['iPhone 14'] }, testMatch: /layout\.spec\.ts/ },
```
(the clipboard and iframe specs stay on Chromium: clipboard permissions are Chromium-only.)

- [ ] **Step 4: Run the suite**

```bash
npm run e2e
```
Expected: layout tests pass in all four projects. A WebKit-only or Firefox-only failure is a real cross-browser CSS issue (commonly `clip-path`, `translate`, or `animation-timeline` fallbacks); fix it in `src/styles/manga.css` and rerun.

- [ ] **Step 5: Add the CI job**

In `.github/workflows/ci.yml` change the `e2e` job's install step to `npx playwright install --with-deps chromium firefox webkit`, and add a job:
```yaml
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .node-version
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run lighthouse
```

- [ ] **Step 6: Commit**

```bash
git add lighthouserc.json scripts package.json package-lock.json playwright.config.ts .github .gitignore
git commit -m "test: add Lighthouse CI and Firefox/WebKit layout coverage"
```

---

### Task 6: Media pass 2 and the remaining entries

This task needs the owner. Same rules as Phase 1 Task 14: follow `docs/capture-plan.md`; one project at a time; show each image to the owner before committing; no assistant UIs, terminals or logs in any shot; no real personal data; do not touch Tanami repos or containers.

**Files:**
- Modify: `src/content.config.ts`, `src/pages/work/[slug].astro` (work gallery)
- Create: `src/assets/media/<slug>/*.png`
- Modify: `src/content/work/cuspio.md`, `src/content/lab/<slug>.md`

**Interfaces:**
- Consumes: capture-plan rows 6-13: CuspIO, gridlock, nocturne-network, 01-displayer, go-byte, overworld, codeweavers, LPS.
- Produces: media on those entries; a `gallery` field on `work`.

- [ ] **Step 1: Let work entries carry a gallery**

In `src/content.config.ts`, inside the `work` object schema add:
```ts
        gallery: z
          .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
          .default([]),
```
and extend the confidential refinement so a confidential entry also has no gallery:
```ts
      .refine((d) => !(d.confidential && (d.cover || d.gallery.length > 0)), {
        message: 'confidential entries must not have a cover or gallery',
        path: ['cover'],
      }),
```
(replace the previous confidential refinement).

In `src/pages/work/[slug].astro` add `import Shot from '../../components/Shot.astro';` and, after the `<div class="prose">…</div>`:
```astro
    {
      data.gallery.length > 0 && (
        <section aria-labelledby="gallery">
          <h2 id="gallery">Screenshots</h2>
          <div class="shots">
            {data.gallery.map((g) => <Shot src={g.src} alt={g.alt} caption={g.caption} />)}
          </div>
        </section>
      )
    }
```
Run `npm run verify`; expected: passes.
Commit: `feat: allow a screenshot gallery on non-confidential work entries`.

- [ ] **Step 2: CuspIO pre-check (do this before capturing anything)**

Skim `app/**/Seeders/PatientSeeder.php` (or the `PatientSeeder` class) and the `storage/app/private` and `storage/app/public` folders of `~/Documents/CuspIO` (read-only). Do not open `.env`. Confirm the demo rows are synthetic; anything that looks like real people or real documents means no patient-facing screens at all. Tell the owner what you found.

- [ ] **Step 3: Capture, review, wire and commit one project at a time**

For CuspIO (three shots maximum: dashboard, appointments calendar, one billing or claims view, demo data only) and then gridlock, nocturne-network, 01-displayer (start from its existing `public/preview.png`), go-byte (needs a freely licensed CHIP-8 ROM), overworld (needs a device or dev build) and LPS (use its existing `images/preview.png` only), follow the Phase 1 Task 14 loop: capture, owner review, save to `src/assets/media/<slug>/`, add `cover`, `coverAlt` and `gallery` (with real alt text) to the entry, then
```bash
npm run verify
npm run e2e
git add src/assets/media/<slug> src/content/<collection>/<slug>.md
git commit -m "feat: add <slug> media"
```
A project the owner decides not to show gets no media and stays text-only.

- [ ] **Step 4: codeweavers hackathon entry (only if Phase 2 Task 12 Step 4 created it)**

If `src/content/lab/codeweavers-hackathon.md` exists, capture its UI (clone `Kwaddo/codeweavers-build-hackathon` into the scratchpad, `npm i` in `backend` and `frontend`, run per their scripts) and add media the same way. If it does not exist, skip.

---

### Task 7: Pre-launch checks with the owner

Nothing is published in this task. It produces a signed-off list.

**Files:** none (a checklist the owner confirms).

- [ ] **Step 1: Confidentiality and permissions read-through**

Read these out to the owner one at a time and record yes or change: the Tanami page and timeline line (role line only, no product, client or domain detail); each employer line in the timeline and the About "Working in the real world" chapter, especially the Tech Bay line about government clients; the CuspIO overview; any published involvement journey text. The owner checks them against their contracts and any public-mention rules. Make any requested edits in `src/content/`, then `npm run verify`.
Confirmed already: collaborators may be named.

- [ ] **Step 2: Asset and licence check**

Confirm: Anton and Inter are SIL Open Font License (self-hosted, no attribution needed in the page); every screenshot is the owner's own work or properly licensed; no third-party artwork appears (for example game art packs) without credit. Add credits to the relevant project page if anything needs one.

- [ ] **Step 3: Real-device pass (owner's phone and laptop)**

Run `npm run build && npm run preview -- --host` and open the network URL on: iPhone Safari, an Android Chrome device if available, desktop Firefox. On each: landing split and speech bubble, nav wrap at narrow width, Work and Personal grids, a game page, the play page (tap Play), the copy button, the resume page, tab through a page with an external keyboard if possible (visible focus), and check text over halftone areas is readable. Record what breaks; fix in `src/styles/manga.css`; rerun `npm run verify` and `npm run e2e`.

- [ ] **Step 4: Final automated pass**

```bash
rm -rf node_modules dist .astro
npm ci
npm run verify
npm run e2e
npm run lighthouse
```
Expected: all pass.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: address pre-launch review findings"
```
(Skip if nothing changed.)

---

### Task 8: Launch

Every outward-facing step below needs the owner's explicit "yes" immediately before it runs. Stop and ask at each marked step.

**Files:** none in the working repo; a scrubbed clone in the scratchpad is what gets published.

- [ ] **Step 1: Decide the domain and analytics (owner decision, recorded here)**

Domain: keep `https://kwaddo.github.io` (default) or a custom domain. If custom: add `public/CNAME` containing the domain, then replace `https://kwaddo.github.io` with the new origin in `astro.config.mjs` (`site`), `src/data/site.ts` (`url`), `public/robots.txt` (sitemap line), and the expected value in `tests/seo.test.ts` (canonical). Keep the S.M.O.B.B. iframe URL as is: with a custom domain on the user site, GitHub serves project sites under that domain and redirects the old address. Run `npm run verify`.
Analytics: none (default). Do not add any.

- [ ] **Step 2: Save the planning docs outside the repository**

```bash
mkdir -p ~/Documents/notes/portfolio-docs
cp -R ~/Documents/portfolio/docs/. ~/Documents/notes/portfolio-docs/
```
The `docs/` folder is never published.

- [ ] **Step 3: Build the scrubbed public history in a scratch clone**

```bash
S=/private/tmp/claude-501/-Users-delirium-Documents/80aa3b97-3695-4dc5-9447-cd293c634fb2/scratchpad
rm -rf $S/portfolio-public
git clone --no-local ~/Documents/portfolio $S/portfolio-public
cd $S/portfolio-public
export FILTER_BRANCH_SQUELCH_WARNING=1
git filter-branch -f --prune-empty \
  --index-filter 'git rm -r -q --cached --ignore-unmatch docs' \
  --msg-filter "perl -0pe 's/^Co-Authored-By:[^\n]*\n?//gim; s/\s+\z/\n/'" \
  --env-filter 'N="Ali Khalaf"; E="139044444+Kwaddo@users.noreply.github.com"; export GIT_AUTHOR_NAME="$N" GIT_AUTHOR_EMAIL="$E" GIT_COMMITTER_NAME="$N" GIT_COMMITTER_EMAIL="$E"' \
  --tag-name-filter cat -- --all
git for-each-ref --format='%(refname)' refs/original | xargs -n1 git update-ref -d
git reflog expire --expire=now --all && git gc -q --prune=now
```

- [ ] **Step 4: Verify the scrubbed clone is clean**

```bash
cd $S/portfolio-public
echo "docs in tree: $(git ls-tree -r HEAD --name-only | grep -c '^docs/')"
echo "bad strings in history: $(git log --all --format='%an <%ae>%n%cn <%ce>%n%B' | grep -ciE 'claude|anthropic|superpowers|co-authored|alimohsen')"
echo "Quad in history: $(git log --all --format='%an%n%cn%n%B' | grep -ciw 'quad')"
echo "bad strings in files: $(git grep -ciE 'claude|anthropic|superpowers' HEAD -- . | wc -l)"
echo "plain email or phone in files: $(git grep -ciE '[a-z0-9._+-]+@gmail\.com|[^0-9]3[0-9]{3}[ -]?[0-9]{4}[^0-9]' HEAD -- . ':!package-lock.json' | wc -l)"
git log --all --format='%an <%ae>' | sort | uniq -c
fnm exec --using=22.23.4 npm ci
fnm exec --using=22.23.4 npm run verify
```
Expected: `docs in tree: 0`, the four bad-string counts `0` (history, Quad, files, plain email or phone), a single author line `Ali Khalaf <139044444+Kwaddo@users.noreply.github.com>`, and `npm run verify` passes inside the clone. If anything is non-zero, fix the offending commit or file in the working repo, redo Steps 3-4. Show the owner the results.

- [ ] **Step 5 (ask first): Create the public repository and push**

Ask: "Create `Kwaddo/Kwaddo.github.io` as a public repository and push the scrubbed history?" On yes:
```bash
cd $S/portfolio-public
gh repo create Kwaddo/Kwaddo.github.io --public --source=. --remote=origin --push
```
Expected: the repository exists and `main` is pushed. The deploy workflow runs on that push.

- [ ] **Step 6 (ask first): Enable Pages from Actions and confirm the deploy**

Ask, then:
```bash
gh api -X POST repos/Kwaddo/Kwaddo.github.io/pages -f build_type=workflow
gh run list -R Kwaddo/Kwaddo.github.io --limit 3
gh run watch -R Kwaddo/Kwaddo.github.io
```
If the `POST` reports Pages already exists, use `-X PUT` with the same field. Expected: the Deploy workflow finishes green.
Then:
```bash
curl -sI https://kwaddo.github.io/ | head -1
curl -sI https://kwaddo.github.io/smobb/ | head -1
curl -sI https://kwaddo.github.io/nope/ | head -1
```
Expected: `200`, `200` (the S.M.O.B.B. project site still works under the user site), and `404` for the last (served with the themed 404 page).

- [ ] **Step 7: Live content check**

Open the live site and run `npm run check:dist`-style spot checks against the deployed HTML:
```bash
for p in / /work/tanami/ /about/ /contact/ /resume/; do curl -s https://kwaddo.github.io$p | grep -ciE 'claude|anthropic|mailto:|36000253|alimohsen999@gmail'; done
```
Expected: five zeros. Fetch `https://kwaddo.github.io/Ali-Khalaf-CV.pdf` and confirm it downloads.

- [ ] **Step 8 (ask first): Align the owner's public identity**

Ask separately for each, run only the approved ones:
```bash
gh api -X PATCH user -f name='Ali Khalaf' -f blog='https://kwaddo.github.io'
git config --global user.name 'Ali Khalaf'
```
Suggest, and apply only with approval, a one-line link to the site in the `Kwaddo/Kwaddo` profile README. The owner updates the LinkedIn website field by hand.

- [ ] **Step 9: Switch the working repo to the published history (owner-approved)**

The working repo in `~/Documents/portfolio` still has the old history and `docs/`. With the owner's agreement, replace it with the published clone so both copies match:
```bash
mv ~/Documents/portfolio ~/Documents/portfolio-old
git clone git@github.com:Kwaddo/Kwaddo.github.io ~/Documents/portfolio
```
Keep `portfolio-old` until the owner confirms nothing else is needed from it, then it is theirs to delete. New planning docs live in `~/Documents/notes/portfolio-docs/`, never in the repo.

- [ ] **Step 10: Soft share and the 5-second test**

Ask the owner to show the landing page for five seconds to three or four people and ask: what does this person do, and what would you click first? Record the answers in the notes vault. If more than one person misreads the landing page, adjust the speech bubble or the door copy, push, and ask again.

- [ ] **Step 11: Announce**

The owner posts the link where they choose. Optionally use the `/schedule` skill to create a quarterly reminder to refresh the availability sentence in `src/data/site.ts` and the "now" blurb, since stale availability hurts more than a missing page.

---

## Self-Review (completed)

**Spec coverage (Phase 3 scope and launch gates):** static per-section OG cards (Task 1); JSON-LD Person (Task 2); link check, landing budget and Lighthouse mobile at 95 on landing, a work page, a game page and the journal index (Tasks 3-5, wired into `verify` and CI); Firefox and WebKit layout coverage standing in for the real-device pass, followed by the manual device pass with the owner (Tasks 5, 7); remaining media and lab entries including CuspIO's synthetic-data check and the work gallery (Task 6); confidentiality and licence checks (Task 7); no forbidden strings in `dist/` (Phase 1 guard, rerun live in Launch Step 7); decisions on domain and analytics (Launch Step 1); history scrub with docs removed, author "Ali Khalaf", no AI-tooling strings (Launch Steps 3-4); repository, Pages, profile and identity alignment, LinkedIn, soft share (Launch Steps 5-11).

**Placeholder scan:** none; owner-dependent steps name their prerequisite and the exact action.

**Type consistency:** `ogImageFor`, `ogImageOf`, `personLd`, `jsonLdScript`, `extractTargets`, `distPathFor`, `sameDocFragments`, `hasId`, `assetPaths`, `fontUrls`, `isLatinFont`, `BUDGET_BYTES` are defined once and used with the same signatures; `Base` gains an `og`/`head` surface used consistently by Tasks 1 and 2.
