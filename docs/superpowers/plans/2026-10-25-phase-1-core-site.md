# Phase 1: Core Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first launchable version of Ali Khalaf's portfolio: manga-themed landing, Work, Personal (games + lab), About, Contact, project journeys template, deploy pipeline and quality gates.

**Architecture:** A static Astro 7 site. All content is markdown in typed content collections (`work`, `games`, `lab`, `about`, `journeys`); pages are thin and render shared components. Pure logic (email, content helpers, SEO, nav, dates, content-rule scanning) lives in `src/lib` and `scripts/` and is unit-tested with Vitest. Layout, copy button and iframe behaviour are checked with a small Playwright suite; a post-build script enforces the content rules.

**Tech Stack:** Astro 7.4.2, TypeScript (strict), Vitest 5, Playwright 1.64, `@astrojs/sitemap`, self-hosted fonts via `@fontsource/anton` and `@fontsource-variable/inter`, GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-10-25-portfolio-design.md` (read it first). Phase 2 and Phase 3 have their own plans.

## Global Constraints

Every task's requirements include this section. Values are copied from the spec.

- **Node:** run everything under Node `22.23.4` (Astro 7.4.2 refuses Node 22.23.1). In your shell run `fnm use 22.23.4`, or prefix commands with `fnm exec --using=22.23.4`. `.node-version` pins it.
- **Do not scaffold with `create-astro`.** It adds an agent-instructions file that must not ship. Create files by hand as in Task 1.
- **Identity:** public name is **Ali Khalaf** everywhere; role line is "Software Engineer". "Kwaddo" appears only inside URLs (GitHub handle). "Quad" never appears.
- **Palette:** paper `#fafafa`, ink `#0a0a0a`, one mid-gray; no accent colors. No dark mode in Phase 1.
- **CSS:** logical properties only (`margin-inline`, `padding-block`, `inset-inline`, `text-align: start`); never `left`/`right`. Layout must work at 360px with no horizontal scroll, in both `dir="ltr"` and `dir="rtl"`.
- **Fonts:** at most two families, self-hosted, `font-display: swap`.
- **Motion:** CSS only; everything animated is disabled under `prefers-reduced-motion`.
- **Accessibility:** keyboard reachable, visible focus, alt text on every image, text contrast at least 4.5:1.
- **Content rules:** no mention of AI coding tools or assistant involvement anywhere on the site (copy, markup, screenshots). Tanami: role line only, no media, no product/feature/metric/client/domain detail, no repo link. Private repos get no repo link. Only two credentials are shown: Reboot Coding Institute (graduated, DevOps) and University of Bahrain (graduated, Bachelor's in Software Engineering); no other certifications; high school omitted.
- **Email:** the Gmail address is public but never appears in HTML as a plain address or `mailto:`; it is assembled client-side from `user` + `domain`. With JavaScript off the spelled-out form `name [at] gmail [dot] com` is shown. The phone number is never published.
- **Iframes (games):** loaded only after a click, with exactly `sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen"` and `allow="fullscreen"`.
- **Images:** go through Astro's image pipeline (WebP output, `srcset`, width/height, lazy below the fold). Media lives in `src/assets/media/<slug>/`, never `public/`.
- **Collections:** every collection has `draft: boolean` (default `false`); drafts are excluded from pages.
- **Commits:** conventional prefixes (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). **Never add a `Co-Authored-By` trailer.**
- **Quality gate:** `npm run verify` (astro check, unit tests, build, dist rules) must pass before every commit that touches code.

## File Structure

```
.github/dependabot.yml            weekly npm + actions updates, grouped
.github/workflows/ci.yml          verify + e2e on PRs and main
.github/workflows/deploy.yml      verify, build, deploy to Pages on main
.node-version                     22.23.4
package.json  astro.config.mjs  tsconfig.json  vitest.config.ts  playwright.config.ts
README.md
public/favicon.svg  public/robots.txt
scripts/dist-rules.ts             pure rule scanner (tested)
scripts/check-dist.mjs            walks dist/, applies rules, exits 1 on violations
src/content.config.ts             collection schemas
src/content/work/*.md  games/*.md  lab/*.md  about/*.md  journeys/<slug>/*.md
src/data/site.ts  skills.ts  credentials.ts
src/lib/email.ts  content.ts  seo.ts  nav.ts  dates.ts  journey-paths.ts
src/styles/tokens.css  base.css  manga.css
src/layouts/Base.astro
src/components/Nav  Footer  SpeechBubble  StatusBadge  ProjectCard  Shot  CopyEmail
               WorkWithMe  GamePlayer  ProjectPage  JourneyView   (all .astro)
src/pages/index  contact  about  work/index  work/[slug]  personal/index
          personal/games/[slug]/{index,play,journey}  personal/lab/[slug]/{index,journey}
tests/*.test.ts                   Vitest unit tests
e2e/*.spec.ts                     Playwright specs
```

Responsibilities: `data/` holds facts that change rarely; `lib/` holds pure functions with one job each; `components/` render markup with no data fetching (except `ProjectPage`/`JourneyView`, which render markdown); `pages/` fetch collections and compose.

---

### Task 1: Scaffold the project and toolchain

**Files:**
- Create: `.node-version`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `public/favicon.svg`, `public/robots.txt`, `src/pages/index.astro` (temporary)
- Modify: `.gitignore`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `check`, `test`, `check:dist`, `e2e`, `verify`; Astro config with `site: 'https://kwaddo.github.io'`.

- [ ] **Step 1: Pin Node and confirm it is available**

```bash
cd ~/Documents/portfolio
printf '22.23.4\n' > .node-version
fnm install 22.23.4
fnm use 22.23.4
node -v
```
Expected: `v22.23.4`.

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "portfolio",
  "type": "module",
  "version": "0.0.1",
  "private": true,
  "engines": { "node": ">=22.23.4" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "check": "astro check",
    "test": "vitest run",
    "check:dist": "node scripts/check-dist.mjs",
    "e2e": "playwright test",
    "verify": "npm run check && npm run test && npm run build && npm run check:dist"
  }
}
```

- [ ] **Step 3: Install pinned dependencies**

```bash
npm install --save-exact astro@7.4.2 @astrojs/sitemap@3.7.4 @fontsource/anton@5.3.0 @fontsource-variable/inter@5.3.0
npm install --save-dev --save-exact @astrojs/check@0.9.12 typescript@6.0.3 vitest@5.0.5 @playwright/test@1.64.1
```
Expected: installs without errors; `package-lock.json` created.

- [ ] **Step 4: Write config files**

`astro.config.mjs`:
```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kwaddo.github.io',
  integrations: [sitemap()],
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src/**/*", "tests/**/*", "scripts/**/*.ts", "e2e/**/*", "*.ts"],
  "exclude": ["dist"]
}
```

`vitest.config.ts` (plain Vitest config; importing Astro's `getViteConfig` breaks `astro check`):
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
```

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0a0a0a"/><text x="16" y="23" font-family="Impact,Arial Narrow,sans-serif" font-size="19" text-anchor="middle" fill="#fafafa">AK</text></svg>
```

`public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://kwaddo.github.io/sitemap-index.xml
```

`src/pages/index.astro` (temporary, replaced in Task 7):
```astro
---
---
<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><title>Ali Khalaf</title></head><body><h1>Ali Khalaf</h1></body></html>
```

- [ ] **Step 5: Extend `.gitignore`**

Append these lines to the existing `.gitignore` (which already ignores `_inbox/`, `node_modules/`, `dist/`, `.astro/`, `.DS_Store`):
```
test-results/
playwright-report/
```

- [ ] **Step 6: Verify the toolchain**

```bash
npm run build
npm run check
```
Expected: build prints `1 page(s) built`; check prints `0 errors`.

- [ ] **Step 7: Commit**

```bash
git add .node-version package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts public .gitignore src
git commit -m "chore: scaffold Astro 7 project with pinned toolchain"
```

---

### Task 2: Site data and pure libraries (TDD)

**Files:**
- Create: `src/data/site.ts`, `src/data/skills.ts`, `src/data/credentials.ts`
- Create: `src/lib/email.ts`, `src/lib/content.ts`, `src/lib/seo.ts`, `src/lib/nav.ts`, `src/lib/dates.ts`
- Test: `tests/email.test.ts`, `tests/content.test.ts`, `tests/seo.test.ts`, `tests/nav.test.ts`, `tests/dates.test.ts`

**Interfaces:**
- Produces:
  - `site: { name, role, location, url, availability, responseTime, emailParts: { user, domain }, links: { github, linkedin } }`
  - `EmailParts = { user: string; domain: string }`, `toAddress(p: EmailParts): string`, `toSpelledOut(p: EmailParts): string`
  - `published<T>(entries: T[]): T[]`, `byOrder<T>(entries: T[]): T[]`, `journeyChapters<T>(entries: T[], project: string): T[]`
  - `JourneyRef = { kind: 'games' | 'lab'; id: string; title: string; journey: boolean }`, `nextJourney(refs, kind, id): JourneyRef | undefined`
  - `pageTitle(title?: string): string`, `canonical(pathname: string): string`
  - `nav: readonly { href: string; label: string }[]`, `isActive(pathname: string, href: string): boolean`
  - `formatMonth(d: Date): string`
  - `skills: { stack: string[]; languages: string[] }`, `credentials: readonly { school; award; period; status }[]`

- [ ] **Step 1: Write the failing tests**

`tests/email.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { toAddress, toSpelledOut } from '../src/lib/email';

const parts = { user: 'jo', domain: 'mail.example.co.uk' };

describe('email', () => {
  test('joins user and domain', () => {
    expect(toAddress(parts)).toBe('jo@mail.example.co.uk');
  });
  test('spells out with [at] and [dot]', () => {
    expect(toSpelledOut(parts)).toBe('jo [at] mail [dot] example [dot] co [dot] uk');
  });
  test('the spelled-out form never contains an @', () => {
    expect(toSpelledOut(parts)).not.toContain('@');
  });
});
```

`tests/content.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { byOrder, journeyChapters, nextJourney, published, type JourneyRef } from '../src/lib/content';

const e = (id: string, data: Record<string, unknown>) => ({ id, data });

describe('published', () => {
  test('drops drafts and keeps the rest in order', () => {
    const list = [e('a', { draft: false }), e('b', { draft: true }), e('c', { draft: false })];
    expect(published(list as never[]).map((x: { id: string }) => x.id)).toEqual(['a', 'c']);
  });
});

describe('byOrder', () => {
  test('sorts ascending without mutating the input', () => {
    const list = [e('b', { order: 2 }), e('a', { order: 1 })];
    const sorted = byOrder(list as never[]) as { id: string }[];
    expect(sorted.map((x) => x.id)).toEqual(['a', 'b']);
    expect(list.map((x) => x.id)).toEqual(['b', 'a']);
  });
});

describe('journeyChapters', () => {
  test('keeps only the project and orders by chapter', () => {
    const list = [
      e('x/02', { project: 'x', order: 2 }),
      e('y/01', { project: 'y', order: 1 }),
      e('x/01', { project: 'x', order: 1 }),
    ];
    expect((journeyChapters(list as never[], 'x') as { id: string }[]).map((c) => c.id)).toEqual(['x/01', 'x/02']);
  });
});

describe('nextJourney', () => {
  const refs: JourneyRef[] = [
    { kind: 'games', id: 'a', title: 'A', journey: true },
    { kind: 'games', id: 'b', title: 'B', journey: false },
    { kind: 'lab', id: 'c', title: 'C', journey: true },
  ];
  test('skips entries without a journey', () => {
    expect(nextJourney(refs, 'games', 'a')?.id).toBe('c');
  });
  test('returns undefined at the end', () => {
    expect(nextJourney(refs, 'lab', 'c')).toBeUndefined();
  });
  test('returns undefined for an unknown id', () => {
    expect(nextJourney(refs, 'games', 'nope')).toBeUndefined();
  });
});
```

`tests/seo.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { canonical, pageTitle } from '../src/lib/seo';

describe('seo', () => {
  test('home title carries name and role', () => {
    expect(pageTitle()).toBe('Ali Khalaf, Software Engineer');
  });
  test('inner pages append the name', () => {
    expect(pageTitle('Work')).toBe('Work | Ali Khalaf');
  });
  test('canonical resolves against the site url', () => {
    expect(canonical('/work/')).toBe('https://kwaddo.github.io/work/');
  });
});
```

`tests/nav.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { isActive, nav } from '../src/lib/nav';

describe('nav', () => {
  test('lists the four primary pages in order', () => {
    expect(nav.map((n) => n.label)).toEqual(['Work', 'Personal', 'About', 'Contact']);
  });
  test('matches nested paths', () => {
    expect(isActive('/work/tanami/', '/work/')).toBe(true);
  });
  test('does not match siblings that share a prefix', () => {
    expect(isActive('/workshop/', '/work/')).toBe(false);
  });
  test('the root only matches itself', () => {
    expect(isActive('/', '/')).toBe(true);
    expect(isActive('/about/', '/')).toBe(false);
  });
});
```

`tests/dates.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { formatMonth } from '../src/lib/dates';

describe('formatMonth', () => {
  test('formats as short month and year in UTC', () => {
    expect(formatMonth(new Date('2026-07-02'))).toBe('Jul 2026');
    expect(formatMonth(new Date('2026-09-01'))).toBe('Sep 2026');
  });
  test('does not shift across a month boundary', () => {
    expect(formatMonth(new Date('2026-10-01T00:00:00Z'))).toBe('Oct 2026');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL, "Failed to resolve import" for each `src/lib/*` module.

- [ ] **Step 3: Write the data files**

`src/data/site.ts`:
```ts
export const site = {
  name: 'Ali Khalaf',
  role: 'Software Engineer',
  location: 'Bahrain',
  url: 'https://kwaddo.github.io',
  availability: 'Open to new roles and select freelance projects.',
  responseTime: 'I reply within two working days.',
  emailParts: { user: 'alimohsen999', domain: 'gmail.com' },
  links: {
    github: 'https://github.com/Kwaddo',
    linkedin: 'https://www.linkedin.com/in/ali-khalaf-64b419243/',
  },
} as const;
```

`src/data/skills.ts`:
```ts
export const skills = {
  stack: [
    'Go',
    'JavaScript',
    'TypeScript',
    'NestJS',
    'React',
    'Next.js',
    'Vue',
    'React Native',
    'PHP Laravel',
    'C# / ASP.NET',
    'Rust',
  ],
  languages: ['English', 'Arabic'],
};
```

`src/data/credentials.ts`:
```ts
export const credentials = [
  { school: 'Reboot Coding Institute', award: 'DevOps', period: 'Aug 2024 - Aug 2026', status: 'Graduated' },
  { school: 'University of Bahrain', award: "Bachelor's in Software Engineering", period: 'Sep 2021 - Aug 2026', status: 'Graduated' },
] as const;
```

- [ ] **Step 4: Write the libraries**

`src/lib/email.ts`:
```ts
export type EmailParts = { user: string; domain: string };

export const toAddress = (p: EmailParts): string => `${p.user}@${p.domain}`;

export const toSpelledOut = (p: EmailParts): string =>
  `${p.user} [at] ${p.domain.replaceAll('.', ' [dot] ')}`;
```

`src/lib/content.ts`:
```ts
type Draftable = { data: { draft: boolean } };
type Ordered = { data: { order: number } };

export const published = <T extends Draftable>(entries: T[]): T[] => entries.filter((e) => !e.data.draft);

export const byOrder = <T extends Ordered>(entries: T[]): T[] =>
  [...entries].sort((a, b) => a.data.order - b.data.order);

export const journeyChapters = <T extends { data: { order: number; project: string } }>(
  entries: T[],
  project: string,
): T[] => byOrder(entries.filter((e) => e.data.project === project));

export type JourneyRef = { kind: 'games' | 'lab'; id: string; title: string; journey: boolean };

export const nextJourney = (refs: JourneyRef[], kind: JourneyRef['kind'], id: string): JourneyRef | undefined => {
  const list = refs.filter((r) => r.journey);
  const i = list.findIndex((r) => r.kind === kind && r.id === id);
  return i === -1 ? undefined : list[i + 1];
};
```

`src/lib/seo.ts`:
```ts
import { site } from '../data/site';

export const pageTitle = (title?: string): string =>
  title ? `${title} | ${site.name}` : `${site.name}, ${site.role}`;

export const canonical = (pathname: string): string => new URL(pathname, site.url).href;
```

`src/lib/nav.ts`:
```ts
export const nav = [
  { href: '/work/', label: 'Work' },
  { href: '/personal/', label: 'Personal' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const isActive = (pathname: string, href: string): boolean =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href);
```

`src/lib/dates.ts`:
```ts
export const formatMonth = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
```

- [ ] **Step 5: Run tests and type check**

```bash
npm run test
npm run check
```
Expected: all tests PASS (about 16); `0 errors`.

- [ ] **Step 6: Commit**

```bash
git add src/data src/lib tests
git commit -m "feat: add site data and tested pure libraries"
```

---

### Task 3: Content-rule guard (TDD)

**Files:**
- Create: `scripts/dist-rules.ts`, `scripts/check-dist.mjs`
- Test: `tests/dist-rules.test.ts`

**Interfaces:**
- Produces: `findViolations(path: string, html: string): string[]` where `path` is relative to `dist/` (e.g. `work/tanami/index.html`); `scripts/check-dist.mjs` exits 1 and prints every violation if any HTML file breaks a rule.

- [ ] **Step 1: Write the failing tests**

`tests/dist-rules.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { findViolations } from '../scripts/dist-rules';

const ok = '<html><body><h1>Ali Khalaf</h1><a href="https://github.com/Kwaddo">GitHub</a></body></html>';

describe('findViolations', () => {
  test('a clean page passes, and a handle inside a URL is allowed', () => {
    expect(findViolations('index.html', ok)).toEqual([]);
  });
  test('flags AI tooling names', () => {
    expect(findViolations('a/index.html', '<p>Built with Claude</p>')).toHaveLength(1);
    expect(findViolations('a/index.html', '<p>co-authored-by someone</p>')).toHaveLength(1);
  });
  test('flags the phone number', () => {
    expect(findViolations('a/index.html', '<p>+973-36000253</p>')).toHaveLength(1);
  });
  test('flags a plain email address and any mailto link', () => {
    expect(findViolations('a/index.html', '<p>alimohsen999@gmail.com</p>')).toHaveLength(1);
    expect(findViolations('a/index.html', '<a href="mailto:x@y.z">x</a>')).toHaveLength(1);
  });
  test('allows the spelled-out email', () => {
    expect(findViolations('a/index.html', '<p>alimohsen999 [at] gmail [dot] com</p>')).toEqual([]);
  });
  test('flags media on the confidential Tanami page', () => {
    expect(findViolations('work/tanami/index.html', '<img src="/x.png">')).toHaveLength(1);
    expect(findViolations('work/cuspio/index.html', '<img src="/x.png">')).toEqual([]);
  });
  test('flags the Kwaddo handle as visible text but not in attributes', () => {
    expect(findViolations('a/index.html', '<p>by Kwaddo</p>')).toHaveLength(1);
    expect(findViolations('a/index.html', '<a href="https://kwaddo.github.io/">x</a>')).toEqual([]);
  });
  test('flags Quad anywhere', () => {
    expect(findViolations('a/index.html', '<p>Quad</p>')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test -- dist-rules`
Expected: FAIL, cannot resolve `../scripts/dist-rules`.

- [ ] **Step 3: Implement the rules**

`scripts/dist-rules.ts`:
```ts
const FORBIDDEN: { name: string; re: RegExp }[] = [
  { name: 'AI tooling name', re: /claude|anthropic|copilot|chatgpt|openai|superpowers|ai[- ]assisted|vibe[- ]cod|co-authored/i },
  { name: 'phone number', re: /36000253/ },
  { name: 'plain email address or mailto', re: /alimohsen999@gmail\.com|mailto:/i },
  { name: 'Quad shown', re: /\bQuad\b/ },
];

const ATTRS = /\s(?:href|src|content|data-src|srcset|action)="[^"]*"/g;

export function findViolations(path: string, html: string): string[] {
  const out: string[] = [];
  for (const { name, re } of FORBIDDEN) {
    if (re.test(html)) out.push(`${path}: ${name}`);
  }
  if (/kwaddo/i.test(html.replace(ATTRS, ''))) out.push(`${path}: Kwaddo handle shown as text`);
  if (path.startsWith('work/tanami/') && /<(img|picture|video|iframe)\b/i.test(html)) {
    out.push(`${path}: media on confidential page`);
  }
  return out;
}
```

`scripts/check-dist.mjs`:
```js
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
```

- [ ] **Step 4: Run tests, build, and the guard**

```bash
npm run test
npm run check
npm run build && npm run check:dist
```
Expected: tests PASS; `0 errors`; `check-dist: 1 pages clean`.

- [ ] **Step 5: Commit**

```bash
git add scripts tests/dist-rules.test.ts
git commit -m "feat: add content-rule guard for built pages"
```

---

### Task 4: Design system and base layout

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/manga.css`
- Create: `src/layouts/Base.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`, `src/components/SpeechBubble.astro`, `src/components/StatusBadge.astro`

**Interfaces:**
- Consumes: `site`, `nav`/`isActive`, `pageTitle`/`canonical`.
- Produces: `<Base title? description? lang?>` layout (slot = page content; renders skip link, `Nav`, `main#main`, `Footer`); CSS classes used by later tasks: `.wrap`, `.stack`, `.prose`, `.lede`, `.tags`, `.notice`, `.btn`, `.btn--solid`, `.panel`, `.panel-grid`, `.panel--wide`, `.badge`, `.bubble`, `.split`, `.chapter`, `.shot`, `.player`, `.facts`, `.wash`, `.on-ink`, `.visually-hidden`.

- [ ] **Step 1: Write `src/styles/tokens.css`**

```css
:root {
  --paper: #fafafa;
  --ink: #0a0a0a;
  --tone: #5c5c5c; /* secondary text, 6.4:1 on paper */
  --tone-fill: #e6e6e6; /* flat screentone fill, never behind small text */
  --font-display: 'Anton', 'Arial Narrow', Impact, sans-serif;
  --font-body: 'Inter Variable', system-ui, -apple-system, 'Segoe UI', 'Geeza Pro', 'Noto Sans Arabic', sans-serif;
  --rule: 3px solid var(--ink);
  --gutter: clamp(0.75rem, 3vw, 1.75rem);
  --measure: 68ch;
  --wrap: 72rem;
  --nav-h: 3.5rem;
  color-scheme: light;
}
```

- [ ] **Step 2: Write `src/styles/base.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  scroll-padding-block-start: calc(var(--nav-h) + 1rem);
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font: 400 1rem/1.6 var(--font-body);
  overflow-wrap: break-word;
}

img,
video,
iframe {
  max-inline-size: 100%;
}
img {
  block-size: auto;
}

h1,
h2,
h3 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}
h1 {
  font-size: clamp(2.5rem, 9vw, 5rem);
}
h2 {
  font-size: clamp(1.75rem, 5vw, 2.75rem);
}
h3 {
  font-size: 1.5rem;
}
p {
  margin: 0;
}
a {
  color: inherit;
  text-underline-offset: 0.2em;
  text-decoration-thickness: 2px;
}
:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 3px;
}
.on-ink :focus-visible {
  outline-color: var(--paper);
}

main {
  display: block;
  padding-block: clamp(1.5rem, 4vw, 3rem);
}
.wrap {
  max-inline-size: var(--wrap);
  margin-inline: auto;
  padding-inline: var(--gutter);
}
.stack > * + * {
  margin-block-start: clamp(1rem, 2.5vw, 1.75rem);
}
.prose {
  max-inline-size: var(--measure);
}
.prose > * + * {
  margin-block-start: 1rem;
}
.prose ul,
.prose ol {
  padding-inline-start: 1.25rem;
}
.lede {
  max-inline-size: var(--measure);
  color: var(--tone);
  font-size: 1.15rem;
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  border: 0;
  clip-path: inset(50%);
  white-space: nowrap;
}
.skip {
  position: absolute;
  inset-inline-start: var(--gutter);
  inset-block-start: -4rem;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: var(--ink);
  color: var(--paper);
}
.skip:focus {
  inset-block-start: 0.5rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tags li {
  padding: 0.1rem 0.6rem;
  border: 2px solid var(--ink);
  font-size: 0.85rem;
}
.notice {
  padding: 1rem;
  border: var(--rule);
  border-style: dashed;
  background: var(--tone-fill);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Write `src/styles/manga.css`**

```css
/* ---------- screentone and dividers ---------- */
.tone {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.1;
  background-image: radial-gradient(circle at center, var(--ink) 0.9px, transparent 1.3px);
  background-size: 6px 6px;
}
.tone--paper {
  background-image: radial-gradient(circle at center, var(--paper) 0.9px, transparent 1.3px);
}
.wash {
  block-size: 0.75rem;
  margin-block: 2rem;
  border: 0;
  background: var(--ink);
  clip-path: polygon(0 45%, 8% 10%, 30% 55%, 55% 20%, 80% 60%, 100% 30%, 100% 100%, 0 100%);
}

/* ---------- buttons ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.1rem;
  border: var(--rule);
  background: var(--paper);
  color: var(--ink);
  font: 700 0.85rem/1 var(--font-body);
  letter-spacing: 0.06em;
  text-decoration: none;
  text-transform: uppercase;
  cursor: pointer;
}
.btn--solid {
  background: var(--ink);
  color: var(--paper);
}
.btn:hover,
.btn:focus-visible {
  background: var(--ink);
  color: var(--paper);
}
.btn--solid:hover,
.btn--solid:focus-visible {
  background: var(--paper);
  color: var(--ink);
}
.btn[hidden] {
  display: none;
}

/* ---------- nav and footer ---------- */
.nav {
  position: sticky;
  inset-block-start: 0;
  z-index: 50;
  background: var(--paper);
  border-block-end: var(--rule);
}
.nav__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1.25rem;
  padding-block: 0.6rem;
}
.nav__brand {
  font: 400 1.5rem/1 var(--font-display);
  letter-spacing: 0.02em;
  text-decoration: none;
  text-transform: uppercase;
}
.nav__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.1rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-weight: 600;
}
.nav__list a {
  text-decoration: none;
}
.nav__list a[aria-current='page'] {
  text-decoration: underline;
  text-decoration-thickness: 3px;
}
.nav__cta {
  margin-inline-start: auto;
}
@media (max-width: 40rem) {
  .nav__brand {
    flex: 1 0 100%;
  }
  .nav__contact {
    display: none;
  }
}

.footer {
  margin-block-start: 3rem;
  padding-block: 2rem;
  background: var(--ink);
  color: var(--paper);
}
.footer__inner {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  align-items: center;
  justify-content: space-between;
}
.footer ul {
  display: flex;
  gap: 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* ---------- badges ---------- */
.badge {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border: 2px solid currentColor;
  font: 700 0.7rem/1.5 var(--font-body);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.badge--live,
.badge--released {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}
.badge--prototype {
  border-style: dashed;
}
.badge--archived {
  color: var(--tone);
}

/* ---------- panels ---------- */
.panel-grid {
  display: grid;
  gap: var(--gutter);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
}
@media (min-width: 48rem) {
  .panel-grid > :nth-child(3n + 2) {
    margin-block-start: 1.5rem;
  }
  .panel--wide {
    grid-column: span 2;
  }
}
.panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-block-size: 12rem;
  overflow: hidden;
  border: var(--rule);
  background: var(--paper);
  color: var(--ink);
  text-decoration: none;
}
.panel__media {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-block-end: var(--rule);
  background: var(--tone-fill);
}
.panel__media img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.05);
}
.panel__body {
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
}
.panel__title {
  font: 400 1.6rem/1 var(--font-display);
  text-transform: uppercase;
}
.panel__meta,
.panel__text {
  color: var(--tone);
  font-size: 0.95rem;
}
.panel__more {
  font: 700 0.8rem/1 var(--font-body);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.panel__more::after {
  content: ' \2192';
}
[dir='rtl'] .panel__more::after {
  content: ' \2190';
}
a.panel::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: repeating-conic-gradient(from 0deg at 50% 50%, transparent 0 4deg, rgb(255 255 255 / 0.14) 4deg 5deg);
  transition: opacity 0.2s;
}
@media (hover: hover) {
  .panel__more {
    opacity: 0;
    translate: 0 0.4rem;
    transition:
      opacity 0.2s,
      translate 0.2s;
  }
  a.panel:hover .panel__more,
  a.panel:focus-visible .panel__more {
    opacity: 1;
    translate: 0 0;
  }
}
a.panel:hover,
a.panel:focus-visible {
  background: var(--ink);
  color: var(--paper);
}
a.panel:hover::after,
a.panel:focus-visible::after {
  opacity: 1;
}
a.panel:hover .panel__meta,
a.panel:hover .panel__text,
a.panel:focus-visible .panel__meta,
a.panel:focus-visible .panel__text {
  color: var(--paper);
}
@supports (animation-timeline: view()) {
  .panel {
    animation: panel-reveal linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 35%;
  }
}
@keyframes panel-reveal {
  from {
    opacity: 0;
    translate: 0 1.5rem;
  }
}

/* ---------- speech bubble ---------- */
.bubble {
  position: relative;
  display: inline-block;
  max-inline-size: 30rem;
  padding: 1rem 1.5rem;
  border: var(--rule);
  border-radius: 1.75rem;
  background: var(--paper);
}
.bubble::after {
  content: '';
  position: absolute;
  inset-block-end: -0.85rem;
  inset-inline-start: 2.5rem;
  inline-size: 1.4rem;
  block-size: 1.4rem;
  border-inline-end: var(--rule);
  border-block-end: var(--rule);
  background: var(--paper);
  transform: rotate(45deg);
}
.bubble h1 {
  font-size: clamp(2rem, 7vw, 3.25rem);
}
.bubble p {
  margin-block-start: 0.5rem;
  color: var(--tone);
}
.hero {
  padding-block-end: 1.5rem;
}

/* ---------- landing split ---------- */
.split {
  --cut: 4rem;
  display: grid;
  grid-template-columns: 1fr;
}
.split__door {
  position: relative;
  display: grid;
  align-content: end;
  gap: 0.75rem;
  min-block-size: 18rem;
  overflow: hidden;
  padding: clamp(1.5rem, 5vw, 3rem);
  text-decoration: none;
}
.split__door--work {
  background: var(--paper);
  color: var(--ink);
  border-block: var(--rule);
}
.split__door--personal {
  background: var(--ink);
  color: var(--paper);
}
.split__door h2 {
  font-size: clamp(3rem, 12vw, 7rem);
  line-height: 0.9;
}
.split__door p {
  max-inline-size: 24ch;
}
.split__door:focus-visible {
  outline: 4px solid currentColor;
  outline-offset: -10px;
}
@media (min-width: 48rem) {
  .split {
    grid-template-columns: 1fr 1fr;
    min-block-size: min(32rem, 70svh);
  }
  .split__door--work {
    padding-inline-end: calc(var(--cut) + 2rem);
    clip-path: polygon(0 0, 100% 0, calc(100% - var(--cut)) 100%, 0 100%);
  }
  .split__door--personal {
    margin-inline-start: calc(var(--cut) * -1);
    padding-inline-start: calc(var(--cut) + 2rem);
    clip-path: polygon(var(--cut) 0, 100% 0, 100% 100%, 0 100%);
  }
  [dir='rtl'] .split__door--work {
    clip-path: polygon(var(--cut) 0, 100% 0, 100% 100%, 0 100%);
  }
  [dir='rtl'] .split__door--personal {
    clip-path: polygon(0 0, 100% 0, calc(100% - var(--cut)) 100%, 0 100%);
  }
}

/* ---------- work with me, facts, chapters ---------- */
.wwm {
  display: grid;
  gap: 1rem;
  padding-block: 3rem 1rem;
}
.wwm__list {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding-inline-start: 1.25rem;
}
.email {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  font-weight: 600;
}
.facts {
  display: grid;
  gap: 1rem 2rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  margin: 0;
  padding: 1rem;
  border: var(--rule);
}
.facts dt {
  color: var(--tone);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.facts dd {
  margin: 0;
  font-weight: 600;
}
.chapter {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.25rem;
}
.chapter__no {
  padding-inline-end: 1rem;
  border-inline-end: var(--rule);
  font: 400 1.25rem/1 var(--font-display);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  writing-mode: vertical-rl;
}
.chapter__date {
  color: var(--tone);
  font-size: 0.9rem;
}

/* ---------- screenshots ---------- */
.shot {
  position: relative;
  margin: 0;
  border: var(--rule);
  background: var(--ink);
}
.shot button {
  all: unset;
  display: block;
  inline-size: 100%;
  cursor: pointer;
}
.shot button:focus-visible {
  outline: 3px solid var(--paper);
  outline-offset: -6px;
}
.shot img {
  display: block;
  inline-size: 100%;
  filter: grayscale(1) contrast(1.05);
  transition: filter 0.2s;
}
.shot::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: multiply;
  opacity: 0.25;
  background-image: radial-gradient(circle at center, var(--ink) 0.9px, transparent 1.3px);
  background-size: 5px 5px;
}
.shot[data-color='true'] img {
  filter: none;
}
.shot[data-color='true']::after {
  opacity: 0;
}
.shot figcaption {
  padding: 0.5rem 0.75rem;
  border-block-start: var(--rule);
  background: var(--paper);
  color: var(--tone);
  font-size: 0.85rem;
}
.shots {
  display: grid;
  gap: var(--gutter);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
}

/* ---------- game player ---------- */
.player {
  border: var(--rule);
  background: var(--ink);
  color: var(--paper);
}
.player__stage {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 10;
  background: var(--ink);
}
.player__poster {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  opacity: 0.45;
  filter: grayscale(1);
}
.player__start {
  position: relative;
}
.player__frame {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  border: 0;
  background: #000;
}
.player__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem;
  border-block-start: var(--rule);
  background: var(--paper);
  color: var(--ink);
}
```

- [ ] **Step 4: Write the small components**

`src/components/SpeechBubble.astro`:
```astro
<div class="bubble"><slot /></div>
```

`src/components/StatusBadge.astro`:
```astro
---
interface Props {
  status: 'live' | 'released' | 'prototype' | 'showcase' | 'archived';
}
const { status } = Astro.props;
const labels = { live: 'Live', released: 'Released', prototype: 'Prototype', showcase: 'Showcase', archived: 'Archived' };
---
<span class={`badge badge--${status}`}>{labels[status]}</span>
```

`src/components/Nav.astro`:
```astro
---
import { isActive, nav } from '../lib/nav';
import { site } from '../data/site';

interface Props {
  pathname: string;
}
const { pathname } = Astro.props;
---
<header class="nav">
  <div class="nav__inner wrap">
    <a class="nav__brand" href="/">{site.name}</a>
    <nav aria-label="Main">
      <ul class="nav__list">
        {
          nav.map((item) => (
            <li class:list={[item.href === '/contact/' && 'nav__contact']}>
              <a href={item.href} aria-current={isActive(pathname, item.href) ? 'page' : undefined}>
                {item.label}
              </a>
            </li>
          ))
        }
      </ul>
    </nav>
    <a class="btn btn--solid nav__cta" href="/contact/">Get in touch</a>
  </div>
</header>
```

`src/components/Footer.astro`:
```astro
---
import { site } from '../data/site';
const year = new Date().getFullYear();
---
<footer class="footer on-ink">
  <div class="wrap footer__inner">
    <p>&copy; {year} {site.name}</p>
    <ul>
      <li><a href={site.links.github} rel="me noopener">GitHub</a></li>
      <li><a href={site.links.linkedin} rel="me noopener">LinkedIn</a></li>
    </ul>
    <a href="#main">Back to top</a>
  </div>
</footer>
```

- [ ] **Step 5: Write `src/layouts/Base.astro`**

```astro
---
import '@fontsource/anton/latin-400.css';
import '@fontsource-variable/inter/wght.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/manga.css';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import { canonical, pageTitle } from '../lib/seo';
import { site } from '../data/site';

interface Props {
  title?: string;
  description?: string;
  lang?: 'en' | 'ar';
}
const {
  title,
  description = `${site.name} is a ${site.role.toLowerCase()} in ${site.location}. Work, games and the stories behind them.`,
  lang = 'en',
} = Astro.props;
const dir = lang === 'ar' ? 'rtl' : 'ltr';
const url = canonical(Astro.url.pathname);
const full = pageTitle(title);
---
<!doctype html>
<html lang={lang} dir={dir}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{full}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={url} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="theme-color" content="#fafafa" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={site.name} />
    <meta property="og:title" content={full} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={url} />
    <meta name="twitter:card" content="summary" />
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <Nav pathname={Astro.url.pathname} />
    <main id="main"><slot /></main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 6: Use the layout on the temporary home page**

Replace `src/pages/index.astro` with:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base><div class="wrap"><h1>Ali Khalaf</h1></div></Base>
```

- [ ] **Step 7: Verify**

```bash
npm run verify
```
Expected: all four stages pass (`0 errors`, tests PASS, build ok, `check-dist: 1 pages clean`).

Then visually: `npm run dev`, open `http://localhost:4321/`. Expected: sticky nav with brand, links, a solid "Get in touch" button; ink footer with GitHub and LinkedIn; tab title `Ali Khalaf, Software Engineer`. Resize to 360px: brand on its own row, no horizontal scroll, "Contact" link hidden but the button visible. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: add manga design system, base layout, nav and footer"
```

---

### Task 5: Content collections and entries

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/work/{tanami,cuspio}.md`
- Create: `src/content/games/{smobb,skoobl,smoke-break,dopher-alpha,smart-road}.md`
- Create: `src/content/lab/{nocturne-network,gridlock,go-byte,overworld,01-displayer,lps}.md`
- Create: `src/content/about/{01-where-it-started,02-learning-by-building,03-games-on-the-side,04-working-in-the-real-world}.md`
- Delete: `docs/about-draft.md` (its text now lives in `src/content/about/`)

**Interfaces:**
- Produces collections `work`, `games`, `lab`, `about`, `journeys` with these entry data shapes:
  - `work`: `{ title, role, period, stack: string[], summary, confidential: boolean, order, draft, cover?, coverAlt? }` (refinement: a confidential entry has no cover).
  - `games`/`lab` shared: `{ title, summary, status: 'live'|'released'|'prototype'|'showcase'|'archived', lastWorked: Date, stack: string[], repoUrl?: string, collaborators: {name,url?}[], journey: boolean, order, draft, cover?, coverAlt?, gallery: {src,alt,caption?}[] }`. `games` adds `playable: 'embed'|'external'|'none'`, `playUrl?`, `downloadUrl?`. `lab` adds `liveUrl?`. Refinements: `playUrl` required unless `playable === 'none'`; `coverAlt` required with `cover`.
  - `about`: `{ title, order, draft }`; `journeys`: `{ project, order, title, date?: Date, draft }`.

- [ ] **Step 1: Write the schemas**

`src/content.config.ts`:
```ts
import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const person = z.object({ name: z.string(), url: z.url().optional() });
const status = z.enum(['live', 'released', 'prototype', 'showcase', 'archived']);

const project = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    summary: z.string(),
    status,
    lastWorked: z.coerce.date(),
    stack: z.array(z.string()).default([]),
    repoUrl: z.url().optional(),
    collaborators: z.array(person).default([]),
    journey: z.boolean().default(false),
    order: z.number(),
    draft: z.boolean().default(false),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    gallery: z
      .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
      .default([]),
  });

const needsCoverAlt = (d: { cover?: unknown; coverAlt?: string }) => !d.cover || Boolean(d.coverAlt);

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        role: z.string(),
        period: z.string(),
        stack: z.array(z.string()).default([]),
        summary: z.string(),
        confidential: z.boolean().default(false),
        order: z.number(),
        draft: z.boolean().default(false),
        cover: image().optional(),
        coverAlt: z.string().optional(),
      })
      .refine(needsCoverAlt, { message: 'coverAlt is required when cover is set', path: ['coverAlt'] })
      .refine((d) => !(d.confidential && d.cover), { message: 'confidential entries must not have a cover', path: ['cover'] }),
});

const games = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/games' }),
  schema: (ctx) =>
    project(ctx)
      .extend({
        playable: z.enum(['embed', 'external', 'none']).default('none'),
        playUrl: z.url().optional(),
        downloadUrl: z.url().optional(),
      })
      .refine((d) => d.playable === 'none' || Boolean(d.playUrl), { message: 'playUrl is required when playable is not none', path: ['playUrl'] })
      .refine(needsCoverAlt, { message: 'coverAlt is required when cover is set', path: ['coverAlt'] }),
});

const lab = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lab' }),
  schema: (ctx) =>
    project(ctx)
      .extend({ liveUrl: z.url().optional() })
      .refine(needsCoverAlt, { message: 'coverAlt is required when cover is set', path: ['coverAlt'] }),
});

const about = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/about' }),
  schema: z.object({ title: z.string(), order: z.number(), draft: z.boolean().default(false) }),
});

const journeys = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journeys' }),
  schema: z.object({
    project: z.string(),
    order: z.number(),
    title: z.string(),
    date: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { work, games, lab, about, journeys };
```

- [ ] **Step 2: Write the work entries**

`src/content/work/tanami.md`:
```markdown
---
title: Tanami
role: Software Engineer
period: Jun 2026 - present
stack: [Full-stack, Mobile, Web]
summary: Full-time software engineer at Tanami.
confidential: true
order: 1
---
I joined Tanami in June 2026 as a Software Engineer.

The work is confidential, so this page is short on purpose. It lists my role and dates and says nothing about the company's products, clients or systems.
```

`src/content/work/cuspio.md`:
```markdown
---
title: CuspIO
role: System oversight
period: 2025 - 2026
stack: [Laravel, PostgreSQL, Redis, React, TypeScript, Tailwind]
summary: A multi-tenant healthcare management platform, now being wound down. I kept light oversight of the system.
confidential: false
order: 2
---
CuspIO is a multi-tenant healthcare management platform. It covers patients, appointments, billing, insurance claims, labs and inventory, with each clinic running in its own tenant.

It is built on Laravel with PostgreSQL and Redis, and a React and TypeScript frontend styled with Tailwind.

My part was light oversight of the system. The project is being dissolved, so this page is a brief overview rather than a full case study.
```

- [ ] **Step 3: Write the game entries**

`src/content/games/smobb.md`:
```markdown
---
title: S.M.O.B.B.
summary: A text adventure about AI and the people around it.
status: released
lastWorked: 2026-07-02
stack: [Rust, WebAssembly, Terminal UI]
repoUrl: https://github.com/Kwaddo/smobb
playable: embed
playUrl: https://kwaddo.github.io/smobb/
downloadUrl: https://github.com/Kwaddo/smobb-releases/releases
journey: false
order: 1
---
S.M.O.B.B. is a text-based story adventure about AI and the people around it. You move the story forward by finding passwords and clues that unlock more of what happened.

It runs as a terminal game and in the browser, and takes roughly five hours to finish. It is written in Rust, and its first commit dates from July 2023.
```

`src/content/games/skoobl.md`:
```markdown
---
title: skoobl
summary: A free, real-time party game where everyone draws, then everyone guesses who drew what.
status: showcase
lastWorked: 2026-10-10
stack: [TypeScript, Go, Redis, Docker]
repoUrl: https://github.com/Kwaddo/skoobl
collaborators:
  - name: Moa-01
    url: https://github.com/Moa-01
playable: none
journey: false
order: 2
---
skoobl is a free, real-time party game: everyone draws, then everyone guesses who drew what.

It plays like a living-room game night. A shared screen shows the lobby and the results, and each player uses their own phone to draw and vote. There are three game modes, with word packs in English and Arabic.

skoobl is no longer hosted, so this page is a showcase of the project rather than a playable demo.
```

`src/content/games/smoke-break.md`:
```markdown
---
title: Smoke Break
summary: A web maze game where you have to find Ahmed during his smoke break.
status: live
lastWorked: 2025-02-14
stack: [JavaScript, Go, Firebase]
repoUrl: https://github.com/Kwaddo/smoke-break
collaborators:
  - name: SilentYsf
    url: https://github.com/SilentYsf
playable: embed
playUrl: https://smoke-break.vercel.app/
journey: false
order: 3
---
Smoke Break is a web-based maze game. Players need to find Ahmed during his smoke break, before the clock runs out.

It has a single-player mode and a multiplayer mode, with different maps and time-based challenges.
```

`src/content/games/dopher-alpha.md`:
```markdown
---
title: Dopher Alpha
summary: A basic 3D rendering engine in Go that uses the raycasting techniques of Doom and Wolfenstein 3D.
status: prototype
lastWorked: 2025-08-09
stack: [Go, SDL2]
playable: none
journey: false
order: 4
---
Dopher Alpha is a basic 3D rendering engine written in Go. It uses the raycasting techniques of classic games like Doom and Wolfenstein 3D, and renders with SDL2.

It includes a minimap and a full-map view, and it is the first step of a larger game engine.
```

`src/content/games/smart-road.md`:
```markdown
---
title: Smart Road
summary: A traffic-intersection simulation written in Rust.
status: prototype
lastWorked: 2026-09-01
stack: [Rust]
playable: none
journey: false
order: 5
---
Smart Road is a traffic-intersection simulation written in Rust. It models vehicles, lanes and the intersection itself.
```

- [ ] **Step 4: Write the lab entries**

`src/content/lab/nocturne-network.md`:
```markdown
---
title: Nocturne Network
summary: A team full-stack web application with a Go backend and a React frontend.
status: archived
lastWorked: 2025-08-31
stack: [Go, React, TypeScript, Vite, shadcn/ui, Docker]
repoUrl: https://github.com/Kwaddo/nocturne-network
collaborators:
  - name: Moa-01
    url: https://github.com/Moa-01
  - name: SilentYsf
    url: https://github.com/SilentYsf
  - name: MJ5-byte
    url: https://github.com/MJ5-byte
journey: false
order: 1
---
Nocturne Network is a full-stack web application built by a team of four: a Go backend and a React, TypeScript and Vite frontend, run together with Docker Compose.

My role was the bridge between frontend and backend: coordinating integration and keeping functionality and code quality consistent across the project.
```

`src/content/lab/gridlock.md`:
```markdown
---
title: Gridlock
summary: A multiplayer first-person shooter written in Rust, built with a team.
status: released
lastWorked: 2026-05-29
stack: [Rust, macroquad]
repoUrl: https://github.com/Kwaddo/gridlock-multiplayer-game
collaborators:
  - name: aburxwais
    url: https://github.com/aburxwais
  - name: SilentYsf
    url: https://github.com/SilentYsf
journey: false
order: 2
---
Gridlock is a multiplayer first-person shooter written in Rust. The client renders with macroquad and talks to a headless authoritative server over a custom UDP-style protocol.

It was built with a team, and I contributed a large share of the code.
```

`src/content/lab/go-byte.md`:
```markdown
---
title: go-byte
summary: A CHIP-8 emulator written in Go.
status: archived
lastWorked: 2025-02-15
stack: [Go, SDL2]
repoUrl: https://github.com/Kwaddo/go-byte
journey: false
order: 3
---
go-byte is a CHIP-8 emulator written in Go. It uses SDL2 for graphics and input handling.
```

`src/content/lab/overworld.md`:
```markdown
---
title: Overworld
summary: A mobile app that plays a song when you connect to a WiFi network or Bluetooth device.
status: released
lastWorked: 2026-05-28
stack: [React Native, TypeScript, Expo]
repoUrl: https://github.com/Kwaddo/overworld
journey: false
order: 4
---
Overworld is a React Native mobile app that associates songs with WiFi networks and nearby Bluetooth devices. When you connect to a mapped network, your chosen song plays automatically, giving each place its own soundtrack.
```

`src/content/lab/01-displayer.md`:
```markdown
---
title: 01-displayer
summary: A GraphQL-based profile dashboard built with Next.js.
status: live
lastWorked: 2025-02-14
stack: [Next.js, TypeScript, GraphQL]
repoUrl: https://github.com/Kwaddo/01-displayer
liveUrl: https://01-displayer.vercel.app
journey: false
order: 5
---
01-displayer is a GraphQL-based project made with Next.js. It receives information from the Reboot learning platform and displays it as a personal dashboard.
```

`src/content/lab/lps.md`:
```markdown
---
title: LPS
summary: A Linux desktop app that monitors CPU, RAM, swap, fan and network.
status: archived
lastWorked: 2025-02-22
stack: [C++, Dear ImGui, SDL2]
journey: false
order: 6
---
LPS (Linux Process System) is a desktop application written in C++ that monitors system resources and performance: CPU, RAM, swap, fan and network. Its interface is built with Dear ImGui, and it targets Ubuntu and other Linux systems.
```

- [ ] **Step 5: Write the about chapters**

`src/content/about/01-where-it-started.md`:
```markdown
---
title: Where it started
order: 1
---
I'm Ali, a software engineer from Bahrain. I finished school in 2021 and started a Software Engineering degree at the University of Bahrain the same year.

S.M.O.B.B., a text adventure about AI and the people around it, got its first commit in July 2023. I kept coming back to it for three years.
```

`src/content/about/02-learning-by-building.md`:
```markdown
---
title: Learning by building
order: 2
---
In 2024 I joined Reboot Coding Institute alongside university. Much of my early work there was in Go, and it set a habit I still have: learn by building real things. A CHIP-8 emulator, a raycasting engine, an ant-pathing solver, a maze game with a multiplayer mode and a forum all came out of that stretch.

On team projects I often ended up connecting frontend and backend, so that the pieces held together as one product.
```

`src/content/about/03-games-on-the-side.md`:
```markdown
---
title: Games on the side
order: 3
---
Games are where I experiment. S.M.O.B.B. grew into a released Rust game with a terminal version and a web build. skoobl is a free multiplayer drawing-and-guessing party game with English and Arabic word packs. Smoke Break is a maze game where you hunt for someone who has slipped away on a smoke break.
```

`src/content/about/04-working-in-the-real-world.md`:
```markdown
---
title: Working in the real world
order: 4
---
My first jobs were short and fast. In 2025 I interned at DOO Mena, building a backend system for one of their sections, and joined Croozz Technologies, a small team shipping updates as quickly as we could. At Tech Bay IT Solutions I trained on Dynamics 365 and worked with clients, many of them government bodies. At Babel Pastries I built a TV slideshow application with an admin panel, deployed it, and trained a new developer on Laravel and React.

In 2026 I graduated from both Reboot, with DevOps, and the University of Bahrain, and joined Tanami as a Software Engineer.
```

- [ ] **Step 6: Remove the superseded draft**

```bash
git rm docs/about-draft.md
```

- [ ] **Step 7: Verify the schemas accept the content and reject bad content**

```bash
npm run verify
```
Expected: passes (content syncs, 1 page built).

Then prove the guard rails: temporarily remove the `playUrl:` line from `src/content/games/smobb.md` and run `npm run build`.
Expected: build FAILS with `playUrl is required when playable is not none`. Restore with `git checkout src/content/games/smobb.md`. Then temporarily add `cover: ../../assets/x.png` to `src/content/work/tanami.md`; expected failure mentions `coverAlt` or a missing image. Restore with `git checkout src/content/work/tanami.md`.

- [ ] **Step 8: Commit**

```bash
git add src/content.config.ts src/content docs
git commit -m "feat: add content collections and initial entries"
```

---

### Task 6: Landing page, Work with me, copy-email button and Contact

**Files:**
- Create: `src/components/CopyEmail.astro`, `src/components/WorkWithMe.astro`
- Modify: `src/pages/index.astro`
- Create: `src/pages/contact.astro`

**Interfaces:**
- Consumes: `Base`, `SpeechBubble`, `site`, `toAddress`, `toSpelledOut`.
- Produces: `<CopyEmail />` (renders spelled-out address; with JS, a `mailto:` link plus a "Copy email" button and an `aria-live` status), `<WorkWithMe />` (heading, four lines, how to start, `CopyEmail`).

- [ ] **Step 1: Write `src/components/CopyEmail.astro`**

```astro
---
import { site } from '../data/site';
import { toSpelledOut } from '../lib/email';
---
<div class="email" data-email data-user={site.emailParts.user} data-domain={site.emailParts.domain}>
  <a class="email__link" data-email-link href="/contact/">{toSpelledOut(site.emailParts)}</a>
  <button class="btn" type="button" data-email-copy hidden>Copy email</button>
  <span class="visually-hidden" role="status" aria-live="polite" data-email-status></span>
</div>

<script>
  import { toAddress } from '../lib/email';

  async function copy(text: string, fallbackTarget: HTMLElement): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const range = document.createRange();
      range.selectNodeContents(fallbackTarget);
      const selection = getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return false;
    }
  }

  document.querySelectorAll<HTMLElement>('[data-email]').forEach((root) => {
    const address = toAddress({ user: root.dataset.user!, domain: root.dataset.domain! });
    const link = root.querySelector<HTMLAnchorElement>('[data-email-link]')!;
    const button = root.querySelector<HTMLButtonElement>('[data-email-copy]')!;
    const status = root.querySelector<HTMLElement>('[data-email-status]')!;
    link.href = `mailto:${address}`;
    link.textContent = address;
    button.hidden = false;
    button.addEventListener('click', async () => {
      const ok = await copy(address, link);
      const message = ok ? 'Copied' : 'Selected, press copy to finish';
      status.textContent = message;
      button.textContent = ok ? 'Copied' : 'Copy email';
      setTimeout(() => {
        status.textContent = '';
        button.textContent = 'Copy email';
      }, 2000);
    });
  });
</script>
```

- [ ] **Step 2: Write `src/components/WorkWithMe.astro`**

```astro
---
import CopyEmail from './CopyEmail.astro';
import { site } from '../data/site';
---
<section class="wwm wrap" aria-labelledby="wwm-title">
  <h2 id="wwm-title">Work with me</h2>
  <ul class="wwm__list">
    <li>Full-stack web: React, TypeScript, Laravel and Go.</li>
    <li>Mobile apps with React Native.</li>
    <li>Backend services in Go, Laravel and NestJS.</li>
    <li>Game prototypes and small multiplayer games.</li>
  </ul>
  <p>To start, send a short brief: what you're building, your timeline and a budget range. {site.responseTime}</p>
  <CopyEmail />
</section>
```

- [ ] **Step 3: Write the landing page**

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import SpeechBubble from '../components/SpeechBubble.astro';
import WorkWithMe from '../components/WorkWithMe.astro';
import { site } from '../data/site';
---
<Base>
  <section class="hero wrap">
    <SpeechBubble>
      <h1>{site.name}, {site.role}</h1>
      <p>{site.availability}</p>
    </SpeechBubble>
  </section>
  <section class="split" aria-label="Choose a track">
    <a class="split__door split__door--work" href="/work/">
      <span class="tone" aria-hidden="true"></span>
      <h2>Work</h2>
      <p>Roles, and the systems behind them.</p>
    </a>
    <a class="split__door split__door--personal on-ink" href="/personal/">
      <span class="tone tone--paper" aria-hidden="true"></span>
      <h2>Personal</h2>
      <p>Games, experiments and the stories behind them.</p>
    </a>
  </section>
  <WorkWithMe />
</Base>
```

- [ ] **Step 4: Write the contact page**

`src/pages/contact.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import WorkWithMe from '../components/WorkWithMe.astro';
import { site } from '../data/site';
---
<Base title="Contact" description="How to reach Ali Khalaf about roles and freelance projects.">
  <div class="wrap stack">
    <h1>Get in touch</h1>
  </div>
  <WorkWithMe />
  <div class="wrap stack">
    <h2>Elsewhere</h2>
    <ul class="prose">
      <li><a href={site.links.github} rel="me noopener">GitHub</a></li>
      <li><a href={site.links.linkedin} rel="me noopener">LinkedIn</a></li>
    </ul>
  </div>
</Base>
```

- [ ] **Step 5: Verify**

```bash
npm run verify
```
Expected: passes; `check-dist` finds no `mailto:` and no plain address (the markup holds only `data-user`/`data-domain` and the spelled-out text).

Manual: `npm run dev`, open `/`. Expected: the bubble, the two-door split (Work paper/left, Personal ink/right, diagonal cut at desktop widths, stacked at 360px), and the Work with me block. Open `/contact/`, click "Copy email"; the button text becomes "Copied". Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add landing, work-with-me, copy-email button and contact page"
```

---

### Task 7: Work pages

**Files:**
- Create: `src/components/ProjectCard.astro`
- Create: `src/pages/work/index.astro`, `src/pages/work/[slug].astro`

**Interfaces:**
- Produces: `<ProjectCard href title summary status? cover? coverAlt? meta? />` (a whole-card link rendered as `.panel`); routes `/work/` and `/work/<slug>/`.

- [ ] **Step 1: Write `src/components/ProjectCard.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import StatusBadge from './StatusBadge.astro';

interface Props {
  href: string;
  title: string;
  summary: string;
  status?: 'live' | 'released' | 'prototype' | 'showcase' | 'archived';
  cover?: ImageMetadata;
  coverAlt?: string;
  meta?: string;
}
const { href, title, summary, status, cover, coverAlt, meta } = Astro.props;
---
<a class="panel" href={href}>
  {
    cover && (
      <div class="panel__media">
        <Image src={cover} alt={coverAlt ?? ''} widths={[400, 800]} sizes="(min-width: 48rem) 33vw, 100vw" />
      </div>
    )
  }
  <div class="panel__body">
    {status && <StatusBadge status={status} />}
    <h3 class="panel__title">{title}</h3>
    {meta && <p class="panel__meta">{meta}</p>}
    <p class="panel__text">{summary}</p>
    <span class="panel__more" aria-hidden="true">Read more</span>
  </div>
</a>
```

- [ ] **Step 2: Write the work index**

`src/pages/work/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import ProjectCard from '../../components/ProjectCard.astro';
import { byOrder, published } from '../../lib/content';

const work = byOrder(published(await getCollection('work')));
---
<Base title="Work" description="Roles and systems Ali Khalaf has worked on. Some of it is confidential, so those pages say little on purpose.">
  <div class="wrap stack">
    <h1>Work</h1>
    <p class="lede">Roles and the systems behind them. Some of it is confidential, so those pages say little on purpose.</p>
    <div class="panel-grid">
      {
        work.map((entry) => (
          <ProjectCard
            href={`/work/${entry.id}/`}
            title={entry.data.title}
            summary={entry.data.summary}
            meta={`${entry.data.role} · ${entry.data.period}`}
            cover={entry.data.cover}
            coverAlt={entry.data.coverAlt}
          />
        ))
      }
    </div>
  </div>
</Base>
```

- [ ] **Step 3: Write the work detail page**

`src/pages/work/[slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import { Image } from 'astro:assets';
import Base from '../../layouts/Base.astro';
import { published } from '../../lib/content';

export async function getStaticPaths() {
  const work = published(await getCollection('work'));
  return work.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { data } = entry;
const { Content } = await render(entry);
---
<Base title={data.title} description={data.summary}>
  <article class="wrap stack">
    <p><a href="/work/">&larr; All work</a></p>
    <h1>{data.title}</h1>
    <p class="lede">{data.role} · {data.period}</p>
    {data.stack.length > 0 && <ul class="tags">{data.stack.map((s) => <li>{s}</li>)}</ul>}
    {data.confidential && <p class="notice">This work is confidential. This page lists only my role and dates.</p>}
    {data.cover && <Image src={data.cover} alt={data.coverAlt!} widths={[480, 960, 1440]} sizes="(min-width: 72rem) 68rem, 100vw" />}
    <div class="prose"><Content /></div>
  </article>
</Base>
```
Note: `&larr;` renders as an arrow; in RTL it should point the other way. Replace the literal with the CSS-driven pattern: use the text `All work` with class `back` and add this rule to `src/styles/manga.css`:
```css
.back::before {
  content: '\2190 ';
}
[dir='rtl'] .back::before {
  content: '\2192 ';
}
```
and change the link to `<a class="back" href="/work/">All work</a>`.

- [ ] **Step 4: Verify**

```bash
npm run verify
```
Expected: passes, 4 pages built (`/`, `/contact/`, `/work/`, `/work/tanami/`, `/work/cuspio/` = 5 pages). `check-dist` confirms no media on `work/tanami/`.

Manual: `/work/` shows two cards; `/work/tanami/` shows the dashed "confidential" notice and no image.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: add work index and case-study pages"
```

---

### Task 8: Personal index and project pages

**Files:**
- Create: `src/components/Shot.astro`, `src/components/ProjectPage.astro`
- Create: `src/pages/personal/index.astro`
- Create: `src/pages/personal/games/[slug]/index.astro`, `src/pages/personal/lab/[slug]/index.astro`

**Interfaces:**
- Consumes: `ProjectCard`, `StatusBadge`, `formatMonth`, collections `games`/`lab`.
- Produces: `<Shot src alt caption? eager? />` (grayscale screenshot with halftone; click toggles colour); `<ProjectPage kind entry />` rendering the overview, call-to-action buttons, gallery and credits; routes `/personal/`, `/personal/games/<slug>/`, `/personal/lab/<slug>/`. Button targets: embed games link to `/personal/games/<slug>/play/`; `external` games to `playUrl`; `liveUrl`, `repoUrl`, `downloadUrl` as links; `journey` links to `.../journey/`.

- [ ] **Step 1: Write `src/components/Shot.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Props {
  src: ImageMetadata;
  alt: string;
  caption?: string;
  eager?: boolean;
}
const { src, alt, caption, eager = false } = Astro.props;
---
<figure class="shot" data-shot data-color="false">
  <button type="button" aria-pressed="false" data-shot-toggle>
    <Image src={src} alt={alt} widths={[480, 960, 1440]} sizes="(min-width: 48rem) 60vw, 100vw" loading={eager ? 'eager' : 'lazy'} />
    <span class="visually-hidden">, toggle colour</span>
  </button>
  {caption && <figcaption>{caption}</figcaption>}
</figure>

<script>
  document.querySelectorAll<HTMLElement>('[data-shot]').forEach((figure) => {
    const button = figure.querySelector<HTMLButtonElement>('[data-shot-toggle]')!;
    button.addEventListener('click', () => {
      const on = figure.dataset.color !== 'true';
      figure.dataset.color = String(on);
      button.setAttribute('aria-pressed', String(on));
    });
  });
</script>
```

- [ ] **Step 2: Write `src/components/ProjectPage.astro`**

```astro
---
import { render, type CollectionEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import StatusBadge from './StatusBadge.astro';
import Shot from './Shot.astro';
import { formatMonth } from '../lib/dates';

interface Props {
  kind: 'games' | 'lab';
  entry: CollectionEntry<'games'> | CollectionEntry<'lab'>;
}
const { kind, entry } = Astro.props;
const { data } = entry;
const { Content } = await render(entry);

const base = `/personal/${kind}/${entry.id}/`;
const playable = 'playable' in data ? data.playable : 'none';
const playUrl = 'playUrl' in data ? data.playUrl : undefined;
const downloadUrl = 'downloadUrl' in data ? data.downloadUrl : undefined;
const liveUrl = 'liveUrl' in data ? data.liveUrl : undefined;
const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
---
<Base title={data.title} description={data.summary}>
  <article class="wrap stack">
    <p><a class="back" href="/personal/">All personal projects</a></p>
    <h1>{data.title}</h1>
    <p class="lede">{data.summary}</p>
    <p>
      <StatusBadge status={data.status} /> Last worked on {formatMonth(data.lastWorked)}
    </p>
    {data.stack.length > 0 && <ul class="tags">{data.stack.map((s) => <li>{s}</li>)}</ul>}

    {data.cover && <Shot src={data.cover} alt={data.coverAlt!} eager />}

    <div class="prose"><Content /></div>

    <p class="email">
      {playable === 'embed' && <a class="btn btn--solid" href={`${base}play/`}>Play</a>}
      {playable === 'external' && playUrl && <a class="btn btn--solid" href={playUrl} {...external}>Play</a>}
      {liveUrl && <a class="btn btn--solid" href={liveUrl} {...external}>Open live site</a>}
      {downloadUrl && <a class="btn" href={downloadUrl} {...external}>Download</a>}
      {data.repoUrl && <a class="btn" href={data.repoUrl} {...external}>Source</a>}
      {data.journey && <a class="btn" href={`${base}journey/`}>Read the journey</a>}
    </p>

    {
      data.gallery.length > 0 && (
        <section aria-labelledby="gallery">
          <h2 id="gallery">Gallery</h2>
          <div class="shots">
            {data.gallery.map((g) => <Shot src={g.src} alt={g.alt} caption={g.caption} />)}
          </div>
        </section>
      )
    }

    {
      data.collaborators.length > 0 && (
        <p>
          Built with{' '}
          {data.collaborators.map((c, i) => (
            <>
              {i > 0 && ', '}
              {c.url ? <a href={c.url} {...external}>{c.name}</a> : c.name}
            </>
          ))}
          .
        </p>
      )
    }
  </article>
</Base>
```

- [ ] **Step 3: Write the two thin routes**

`src/pages/personal/games/[slug]/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import ProjectPage from '../../../../components/ProjectPage.astro';
import { published } from '../../../../lib/content';

export async function getStaticPaths() {
  const games = published(await getCollection('games'));
  return games.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
---
<ProjectPage kind="games" entry={entry} />
```

`src/pages/personal/lab/[slug]/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import ProjectPage from '../../../../components/ProjectPage.astro';
import { published } from '../../../../lib/content';

export async function getStaticPaths() {
  const lab = published(await getCollection('lab'));
  return lab.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
---
<ProjectPage kind="lab" entry={entry} />
```

- [ ] **Step 4: Write the personal index**

`src/pages/personal/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import ProjectCard from '../../components/ProjectCard.astro';
import { byOrder, published } from '../../lib/content';
import { formatMonth } from '../../lib/dates';

const games = byOrder(published(await getCollection('games')));
const lab = byOrder(published(await getCollection('lab')));
---
<Base title="Personal" description="Games and experiments by Ali Khalaf, built for the love of it.">
  <div class="wrap stack">
    <h1>Personal</h1>
    <p class="lede">Games and experiments, built for the love of it. Each has a short overview, and some have a longer story behind them.</p>

    <section class="stack" aria-labelledby="games">
      <h2 id="games">Games</h2>
      <div class="panel-grid">
        {
          games.map((g) => (
            <ProjectCard
              href={`/personal/games/${g.id}/`}
              title={g.data.title}
              summary={g.data.summary}
              status={g.data.status}
              cover={g.data.cover}
              coverAlt={g.data.coverAlt}
              meta={`Last worked ${formatMonth(g.data.lastWorked)}`}
            />
          ))
        }
      </div>
    </section>

    <section class="stack" aria-labelledby="lab">
      <h2 id="lab">Lab</h2>
      <div class="panel-grid">
        {
          lab.map((l) => (
            <ProjectCard
              href={`/personal/lab/${l.id}/`}
              title={l.data.title}
              summary={l.data.summary}
              status={l.data.status}
              cover={l.data.cover}
              coverAlt={l.data.coverAlt}
              meta={`Last worked ${formatMonth(l.data.lastWorked)}`}
            />
          ))
        }
      </div>
    </section>
  </div>
</Base>
```

- [ ] **Step 5: Verify**

```bash
npm run verify
```
Expected: passes; build lists `/personal/`, 5 game pages and 6 lab pages.

Manual: `/personal/` shows Games and Lab grids with status badges and "Last worked" months; `/personal/games/smobb/` shows Play, Download and Source buttons; `/personal/games/skoobl/` shows a Source button and no Play; `/personal/games/dopher-alpha/` has no Source button (private). Credits show collaborator links.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add personal index and game/lab project pages"
```

---

### Task 9: Playable embeds (click-to-load)

**Files:**
- Create: `src/components/GamePlayer.astro`
- Create: `src/pages/personal/games/[slug]/play.astro`

**Interfaces:**
- Consumes: games with `playable === 'embed'` (currently `smobb`, `smoke-break`).
- Produces: route `/personal/games/<slug>/play/`; `<GamePlayer src title poster? posterAlt? />`. No `<iframe>` exists in the HTML until the Play button is clicked.

- [ ] **Step 1: Write `src/components/GamePlayer.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Props {
  src: string;
  title: string;
  poster?: ImageMetadata;
  posterAlt?: string;
}
const { src, title, poster, posterAlt } = Astro.props;
---
<div class="player" data-player data-src={src} data-title={title}>
  <div class="player__stage" data-stage>
    {poster && <Image class="player__poster" src={poster} alt={posterAlt ?? ''} widths={[800, 1280]} sizes="100vw" />}
    <button class="btn btn--solid player__start" type="button" data-start>Play {title}</button>
  </div>
  <div class="player__bar">
    <button class="btn" type="button" data-fullscreen hidden>Fullscreen</button>
    <a class="btn" href={src} target="_blank" rel="noopener noreferrer">Open in a new tab</a>
  </div>
</div>

<script>
  document.querySelectorAll<HTMLElement>('[data-player]').forEach((root) => {
    const stage = root.querySelector<HTMLElement>('[data-stage]')!;
    const start = root.querySelector<HTMLButtonElement>('[data-start]')!;
    const fullscreen = root.querySelector<HTMLButtonElement>('[data-fullscreen]')!;
    start.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.className = 'player__frame';
      frame.src = root.dataset.src!;
      frame.title = root.dataset.title!;
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen');
      frame.setAttribute('allow', 'fullscreen');
      stage.replaceChildren(frame);
      fullscreen.hidden = false;
    });
    fullscreen.addEventListener('click', () => {
      stage.querySelector('iframe')?.requestFullscreen();
    });
  });
</script>
```

- [ ] **Step 2: Write the play route**

`src/pages/personal/games/[slug]/play.astro`:
```astro
---
import { getCollection } from 'astro:content';
import Base from '../../../../layouts/Base.astro';
import GamePlayer from '../../../../components/GamePlayer.astro';
import { published } from '../../../../lib/content';

export async function getStaticPaths() {
  const games = published(await getCollection('games')).filter((g) => g.data.playable === 'embed');
  return games.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { data } = entry;
---
<Base title={`Play ${data.title}`} description={`Play ${data.title} in your browser.`}>
  <div class="wrap stack">
    <p><a class="back" href={`/personal/games/${entry.id}/`}>About {data.title}</a></p>
    <h1>{data.title}</h1>
    <GamePlayer src={data.playUrl!} title={data.title} poster={data.cover} posterAlt={data.coverAlt} />
  </div>
</Base>
```

- [ ] **Step 3: Verify**

```bash
npm run verify
```
Expected: passes; build lists `/personal/games/smobb/play/` and `/personal/games/smoke-break/play/`.

Manual: open `/personal/games/smobb/play/` with the browser network tab open. Expected before clicking: no request to `kwaddo.github.io`. After clicking Play: the iframe loads the game and a Fullscreen button appears.

- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "feat: add click-to-load playable embeds"
```

---

### Task 10: Journey template and routes

**Files:**
- Create: `src/lib/journey-paths.ts`, `src/components/JourneyView.astro`
- Create: `src/pages/personal/games/[slug]/journey.astro`, `src/pages/personal/lab/[slug]/journey.astro`

**Interfaces:**
- Consumes: `byOrder`, `journeyChapters`, `nextJourney`, `published`, `JourneyRef`; collections `games`, `lab`, `journeys`.
- Produces: `journeyPaths(kind: 'games' | 'lab')` returning Astro static paths with props `{ title, chapters, next?: { title, href } }` (throws if an entry sets `journey: true` but has no chapters); `<JourneyView title chapters backHref next? />`; routes `/personal/games/<slug>/journey/` and `/personal/lab/<slug>/journey/`, generated only for entries with `journey: true`.

- [ ] **Step 1: Write `src/lib/journey-paths.ts`**

```ts
import { getCollection } from 'astro:content';
import { byOrder, journeyChapters, nextJourney, published, type JourneyRef } from './content';

export async function journeyPaths(kind: 'games' | 'lab') {
  const [games, lab, chapters] = await Promise.all([
    getCollection('games'),
    getCollection('lab'),
    getCollection('journeys'),
  ]);
  const refs: JourneyRef[] = [
    ...byOrder(published(games)).map((e) => ({ kind: 'games' as const, id: e.id, title: e.data.title, journey: e.data.journey })),
    ...byOrder(published(lab)).map((e) => ({ kind: 'lab' as const, id: e.id, title: e.data.title, journey: e.data.journey })),
  ];
  const live = published(chapters);

  return refs
    .filter((r) => r.kind === kind && r.journey)
    .map((ref) => {
      const own = journeyChapters(live, ref.id);
      if (own.length === 0) {
        throw new Error(`${kind}/${ref.id} has journey: true but no chapters in src/content/journeys/${ref.id}/`);
      }
      const next = nextJourney(refs, kind, ref.id);
      return {
        params: { slug: ref.id },
        props: {
          title: ref.title,
          chapters: own,
          next: next ? { title: next.title, href: `/personal/${next.kind}/${next.id}/journey/` } : undefined,
        },
      };
    });
}
```

- [ ] **Step 2: Write `src/components/JourneyView.astro`**

```astro
---
import { render, type CollectionEntry } from 'astro:content';
import Base from '../layouts/Base.astro';

interface Props {
  title: string;
  chapters: CollectionEntry<'journeys'>[];
  backHref: string;
  next?: { title: string; href: string };
}
const { title, chapters, backHref, next } = Astro.props;
const rendered = await Promise.all(
  chapters.map(async (chapter) => ({ chapter, Content: (await render(chapter)).Content })),
);
const month = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
---
<Base title={`${title}: the journey`} description={`The story behind ${title}, told in chapters.`}>
  <div class="wrap stack">
    <p><a class="back" href={backHref}>About {title}</a></p>
    <h1>{title}: the journey</h1>
    {
      rendered.map(({ chapter, Content }, i) => (
        <>
          {i > 0 && <hr class="wash" />}
          <article class="chapter">
            <p class="chapter__no">Chapter {i + 1}</p>
            <div class="prose">
              <h2>{chapter.data.title}</h2>
              {chapter.data.date && <p class="chapter__date">{month(chapter.data.date)}</p>}
              <Content />
            </div>
          </article>
        </>
      ))
    }
    {
      next && (
        <p>
          <a class="btn btn--solid" href={next.href}>Next journey: {next.title}</a>
        </p>
      )
    }
  </div>
</Base>
```

- [ ] **Step 3: Write the two thin routes**

`src/pages/personal/games/[slug]/journey.astro`:
```astro
---
import JourneyView from '../../../../components/JourneyView.astro';
import { journeyPaths } from '../../../../lib/journey-paths';

export function getStaticPaths() {
  return journeyPaths('games');
}
const { title, chapters, next } = Astro.props;
const { slug } = Astro.params;
---
<JourneyView title={title} chapters={chapters} backHref={`/personal/games/${slug}/`} next={next} />
```

`src/pages/personal/lab/[slug]/journey.astro`:
```astro
---
import JourneyView from '../../../../components/JourneyView.astro';
import { journeyPaths } from '../../../../lib/journey-paths';

export function getStaticPaths() {
  return journeyPaths('lab');
}
const { title, chapters, next } = Astro.props;
const { slug } = Astro.params;
---
<JourneyView title={title} chapters={chapters} backHref={`/personal/lab/${slug}/`} next={next} />
```

- [ ] **Step 4: Verify with a throwaway fixture, then revert it**

```bash
npm run verify
```
Expected: passes; no journey pages exist yet (all entries have `journey: false`).

Now temporarily prove the route works. Create `src/content/journeys/smobb/01-test.md`:
```markdown
---
project: smobb
order: 1
title: Test chapter
---
Test body.
```
and set `journey: true` in `src/content/games/smobb.md`, then `npm run build`.
Expected: build lists `/personal/games/smobb/journey/`; its HTML contains `Chapter 1` and `Test chapter`; the S.M.O.B.B. project page now shows a "Read the journey" button.

Then prove the guard: delete `src/content/journeys/smobb/01-test.md` only and run `npm run build`.
Expected: FAIL with `games/smobb has journey: true but no chapters`.

Revert everything: `git checkout src/content/games/smobb.md && rm -rf src/content/journeys/smobb`. Run `npm run build` again; expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: add journey template and routes"
```

---

### Task 11: About page

**Files:**
- Create: `src/pages/about.astro`

**Interfaces:**
- Consumes: `about` collection, `site`, `skills`, `credentials`, `Base`.
- Produces: route `/about/` with a facts strip, the chapters, stack and education.

- [ ] **Step 1: Write the page**

`src/pages/about.astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import Base from '../layouts/Base.astro';
import { byOrder, published } from '../lib/content';
import { site } from '../data/site';
import { skills } from '../data/skills';
import { credentials } from '../data/credentials';

const chapters = byOrder(published(await getCollection('about')));
const rendered = await Promise.all(chapters.map(async (c) => ({ c, Content: (await render(c)).Content })));
---
<Base title="About" description="The story of Ali Khalaf: a software engineer from Bahrain who learns by building.">
  <div class="wrap stack">
    <h1>About</h1>
    <dl class="facts">
      <div><dt>Name</dt><dd>{site.name}</dd></div>
      <div><dt>Role</dt><dd>{site.role}</dd></div>
      <div><dt>Based in</dt><dd>{site.location}</dd></div>
      <div><dt>Languages</dt><dd>{skills.languages.join(', ')}</dd></div>
      <div>
        <dt>Elsewhere</dt>
        <dd>
          <a href={site.links.github} rel="me noopener">GitHub</a> ·
          <a href={site.links.linkedin} rel="me noopener">LinkedIn</a>
        </dd>
      </div>
    </dl>

    {
      rendered.map(({ c, Content }, i) => (
        <>
          {i > 0 && <hr class="wash" />}
          <article class="chapter">
            <p class="chapter__no">Chapter {i + 1}</p>
            <div class="prose">
              <h2>{c.data.title}</h2>
              <Content />
            </div>
          </article>
        </>
      ))
    }

    <hr class="wash" />
    <section class="stack" aria-labelledby="stack">
      <h2 id="stack">Stack</h2>
      <ul class="tags">{skills.stack.map((s) => <li>{s}</li>)}</ul>
    </section>

    <section class="stack" aria-labelledby="education">
      <h2 id="education">Education</h2>
      <ul class="prose">
        {
          credentials.map((c) => (
            <li>
              <strong>{c.award}</strong>, {c.school}. {c.status}, {c.period}.
            </li>
          ))
        }
      </ul>
    </section>
  </div>
</Base>
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```
Expected: passes; build lists `/about/`.

Manual: `/about/` shows the facts strip, four chapters with vertical "Chapter N" labels and ink-wash dividers, the stack tags and exactly two education items. No certifications other than those.

- [ ] **Step 3: Commit**

```bash
git add src
git commit -m "feat: add about page with chaptered story"
```

---

### Task 12: Playwright checks (layout, RTL, copy button, embeds)

**Files:**
- Create: `playwright.config.ts`, `e2e/layout.spec.ts`, `e2e/email.spec.ts`, `e2e/player.spec.ts`

**Interfaces:**
- Consumes: the built site served by `astro preview` on `127.0.0.1:4321`.
- Produces: `npm run e2e` runs two projects, `phone` (360x740) and `desktop`.

- [ ] **Step 1: Install the browser**

```bash
npx playwright install chromium
```
Expected: Chromium downloads (about 150 MB).

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  use: { baseURL: 'http://127.0.0.1:4321' },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 3: Write the layout spec**

`e2e/layout.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/work/',
  '/work/tanami/',
  '/work/cuspio/',
  '/personal/',
  '/personal/games/smobb/',
  '/personal/games/smobb/play/',
  '/personal/games/skoobl/',
  '/personal/lab/nocturne-network/',
  '/about/',
  '/contact/',
];

for (const dir of ['ltr', 'rtl'] as const) {
  for (const route of routes) {
    test(`${route} fits the viewport (${dir})`, async ({ page }) => {
      await page.goto(route);
      await page.evaluate((d) => {
        document.documentElement.dir = d;
      }, dir);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
```

- [ ] **Step 4: Write the email spec**

`e2e/email.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('the copy button copies the assembled address', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Copy email' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('alimohsen999@gmail.com');
});

test.describe('without javascript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows the spelled-out address and no copy button', async ({ page }) => {
    await page.goto('/contact/');
    await expect(page.getByText('alimohsen999 [at] gmail [dot] com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy email' })).toHaveCount(0);
  });
});
```

- [ ] **Step 5: Write the player spec**

`e2e/player.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('the game iframe exists only after clicking Play, and is sandboxed', async ({ page }) => {
  await page.route('https://kwaddo.github.io/**', (route) => route.abort());
  await page.goto('/personal/games/smobb/play/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('button', { name: /^Play/ }).click();
  const frame = page.locator('iframe');
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen');
  await expect(frame).toHaveAttribute('allow', 'fullscreen');
  await expect(frame).toHaveAttribute('src', 'https://kwaddo.github.io/smobb/');
});
```

- [ ] **Step 6: Run the suite**

```bash
npm run e2e
```
Expected: all tests PASS in both projects (22 layout tests plus 3 others, per project). If a layout test fails, the failing route and direction identify the overflowing component; fix the CSS (use `min-inline-size: 0`, `overflow-wrap`, or wrap rules) and rerun.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts e2e
git commit -m "test: add Playwright layout, RTL, copy-button and embed checks"
```

---

### Task 13: CI, deploy workflow, Dependabot, README

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/dependabot.yml`, `README.md`

**Interfaces:**
- Produces: CI that runs `npm run verify` and `npm run e2e` on every pull request and push to `main`; a deploy workflow that verifies, uploads `dist/` and deploys to GitHub Pages on push to `main`; weekly Dependabot PRs.

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .node-version
          cache: npm
      - run: npm ci
      - run: npm run verify

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .node-version
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
```

- [ ] **Step 2: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .node-version
          cache: npm
      - run: npm ci
      - run: npm run verify
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 3: Write `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    groups:
      npm-minor-and-patch:
        update-types: [minor, patch]
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    groups:
      actions:
        patterns: ['*']
```

- [ ] **Step 4: Write `README.md`** (public; no mention of tooling beyond the stack)

```markdown
# Ali Khalaf: portfolio

Source of [kwaddo.github.io](https://kwaddo.github.io): work, games and the stories behind them.

Built with [Astro](https://astro.build). All content is markdown in `src/content/`.

## Run it

Requires Node 22.23.4 or newer (see `.node-version`).

    npm install
    npm run dev        # http://localhost:4321
    npm run verify     # type check, unit tests, build and content rules
    npm run e2e        # Playwright layout and behaviour checks

## Add content

- A project: add a markdown file to `src/content/games/` or `src/content/lab/`.
- A story: add chapters to `src/content/journeys/<project>/` and set `journey: true` on the project.
- Drafts: set `draft: true` in any entry's frontmatter to keep it out of the build.

Pushing to `main` deploys the site to GitHub Pages.
```

- [ ] **Step 5: Validate YAML and run the full gate**

```bash
node -e "for (const f of ['ci','deploy']) console.log(f, require('node:fs').readFileSync('.github/workflows/'+f+'.yml','utf8').length)"
npm run verify
```
Expected: both file sizes print; verify passes.

- [ ] **Step 6: Commit**

```bash
git add .github README.md
git commit -m "chore: add CI, Pages deploy workflow, Dependabot and README"
```

---

### Task 14: Media pass 1 (top five projects)

This task needs the owner. Capture one project at a time and show each image before committing. Follow `docs/capture-plan.md` for paths, run commands and shot lists. Rules from the plan: no assistant UIs, terminals or logs in any shot; no real personal data; do not touch Tanami repos or containers.

**Files:**
- Create: `src/assets/media/<slug>/cover.png` and `src/assets/media/<slug>/NN-<name>.png` per project
- Modify: `src/content/games/<slug>.md` (add `cover`, `coverAlt`, `gallery`)

**Interfaces:**
- Consumes: `cover` and `gallery` schema fields from Task 5, `Shot` and `ProjectCard` from Tasks 7-8.
- Produces: real media on the five featured projects: `skoobl`, `smobb`, `smoke-break`, `dopher-alpha`, `smart-road` (capture-plan rows 1-5).

- [ ] **Step 1: For the first project (skoobl), capture the shots listed in `docs/capture-plan.md` row 1**

Run it as the plan says, capture at 1440x900 (desktop) and 390x844 (phone), save as PNG into `src/assets/media/skoobl/` named `cover.png`, `01-lobby.png`, `02-drawing.png`, and so on.

- [ ] **Step 2: Show every image to the owner and wait for approval**

Reject and recapture any image that shows private data, a tooling UI, or an unrelated window. Do not commit unapproved images.

- [ ] **Step 3: Wire the approved images into the entry**

Example for `src/content/games/skoobl.md` frontmatter (keep existing fields, add):
```yaml
cover: ../../assets/media/skoobl/cover.png
coverAlt: The skoobl lobby on a shared screen, showing the room code and a QR code.
gallery:
  - src: ../../assets/media/skoobl/02-drawing.png
    alt: A player drawing a prompt on their phone.
    caption: Everyone draws on their own phone.
```
Alt text must describe what is visible. Never leave `alt` empty for a gallery image.

- [ ] **Step 4: Verify**

```bash
npm run verify
npm run e2e
```
Expected: both pass. Manual: `/personal/` shows the cover grayscale on the card; `/personal/games/skoobl/` shows the cover as a halftone grayscale figure that turns to colour on click, and the gallery below.

- [ ] **Step 5: Commit this project**

```bash
git add src/assets/media/skoobl src/content/games/skoobl.md
git commit -m "feat: add skoobl media"
```

- [ ] **Step 6: Repeat Steps 1-5 for `smobb` (row 2), `smoke-break` (row 3), `dopher-alpha` (row 4, private repo: clone into scratchpad, never into this repo; reuse its `assets/preview/preview.gif` only after converting a frame to PNG), and `smart-road` (row 5)**

One commit per project (`feat: add <slug> media`).

---

### Task 15: S.M.O.B.B. flagship journey (needs the owner's story)

**Prerequisite:** the owner has written section B1 in `~/Documents/notes/Portfolio Stories.md`. If B1 is empty, stop and say so; do not invent the story.

**Files:**
- Create: `src/content/journeys/smobb/01-<slug>.md` ... one file per chapter
- Modify: `src/content/games/smobb.md` (`journey: true`)

**Interfaces:**
- Consumes: the `journeys` schema (`project`, `order`, `title`, optional `date`), `journey: true` flag, the intake workflow in the spec.
- Produces: a published `/personal/games/smobb/journey/`.

- [ ] **Step 1: Read B1 and split it into chapters**

Suggested split from the stories file: the idea, the first version, becoming a Rust game, the web build and release, what it became. Use the owner's own chapter breaks if they wrote them.

- [ ] **Step 2: Edit the text**

Tighten and professionalize the tone; generalize anything too revealing; keep the owner's facts and meaning; invent nothing; never mention AI tooling (the game's subject being AI is fine). Write each chapter to `src/content/journeys/smobb/NN-<kebab-title>.md`:
```markdown
---
project: smobb
order: 1
title: <chapter title>
date: 2023-07-01
---
<edited text>
```
Use `date` only when the owner gave a real date.

- [ ] **Step 3: Produce the change note and get approval**

List, per chapter, what was cut, softened or generalized and anything sensitive (names, clients, money, health, family, employer internals). Show it with the edited chapters. Do not commit until the owner approves.

- [ ] **Step 4: Switch the journey on and verify**

Set `journey: true` in `src/content/games/smobb.md`, then:
```bash
npm run verify
npm run e2e
```
Expected: both pass; `/personal/games/smobb/journey/` exists and shows each chapter with its vertical label and ink-wash dividers; the S.M.O.B.B. page shows "Read the journey".

- [ ] **Step 5: Commit**

```bash
git add src/content/journeys/smobb src/content/games/smobb.md
git commit -m "feat: publish the S.M.O.B.B. journey"
```

---

### Task 16: Phase 1 sign-off

**Files:** none (verification only).

- [ ] **Step 1: Run every gate from a clean install**

```bash
rm -rf node_modules dist .astro
npm ci
npm run verify
npm run e2e
```
Expected: everything passes.

- [ ] **Step 2: Walk the site by hand at 360px and at desktop width**

Open every page from the sitemap in the spec that Phase 1 covers: `/`, `/work/`, `/work/tanami/`, `/work/cuspio/`, `/personal/`, each game and lab page, `/personal/games/smobb/play/`, the S.M.O.B.B. journey, `/about/`, `/contact/`. Expected: no horizontal scroll, visible focus rings when tabbing, hover inversion on cards, copy button works, Tanami page has no media.

- [ ] **Step 3: Check against the spec**

Confirm each Phase 1 item exists: theme, landing split, Work (Tanami stub, CuspIO overview), Personal (games + lab, status badges, collaborators credited), About with chapters, Contact with Work with me and the copy button, nav with "Get in touch", mobile/RTL-safe CSS, journey template with one flagship journey, Dependabot, CI, Pages deploy workflow, README.

- [ ] **Step 4: Tag**

```bash
git tag phase-1
```
Do not push yet: creating the GitHub repository and the history scrub happen in Phase 3's launch gates.

---

## Self-Review (completed)

**Spec coverage (Phase 1 scope):**
- Phases, Stack and hosting → Tasks 1, 13. Sitemap routes for Phase 1 → Tasks 6-11. Content model (`work`, `games`, `lab`, `about`, `journeys`, `status`, `lastWorked`, `journey`, `draft`) → Task 5. Content plan (Tanami stub, CuspIO overview, five games, lab entries, collaborators credited, private repos without links, skoobl showcase, smobb/smoke-break iframes) → Tasks 5, 8, 9. About chapters, facts strip, stack, credentials rule → Tasks 2, 5, 11. UX path and visual theme (palette, borders, halftone, speed lines, wash dividers, grayscale-to-colour screenshots, panel reveal, reduced motion, vertical chapter labels) → Task 4. Work with me, copy-email, CTA/availability, nav "Get in touch" → Tasks 4, 6. SEO basics (titles, descriptions, canonical, sitemap, robots) → Tasks 1, 4. Mobile, RTL (logical properties, flipped split) → Tasks 4, 12. Content rules, identity, contact privacy, iframe sandbox, EXIF stripping (Astro re-encodes), draft handling → Tasks 3, 5, 9. Dependabot, CI → Task 13. Capture pass (top five) → Task 14. Stories/journey template and flagship journey → Tasks 10, 15.
- Deliberately in later phases: journal, timeline, resume, `/uses`, 404, "now" blurb, RSS, devlog link-up, involvement journeys (Phase 2); OG cards, JSON-LD, Lighthouse, link check, performance budget check, remaining lab media, launch gates (Phase 3).
- Known data to confirm with the owner (copy was drafted from verified repo facts): CuspIO `period` and `role` wording, each entry's `status` and `lastWorked` (month shown only), the availability sentence in `src/data/site.ts`.

**Placeholder scan:** no TBD/TODO; gated tasks (14, 15) state their prerequisite and exact procedure.

**Type consistency:** `published`, `byOrder`, `journeyChapters`, `nextJourney`, `JourneyRef`, `formatMonth`, `toAddress`, `toSpelledOut`, `pageTitle`, `canonical`, `nav`, `isActive`, `findViolations`, `journeyPaths`, component props, and collection field names are used identically across tasks.
