# Phase 2: Living Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add everything that grows over time: the daily journal (date-titled posts, tags, RSS, scaffold script), the timeline, the resume page and PDF, devlog series on project pages, involvement journeys, `/uses`, a themed 404, and the landing journal ticker.

**Architecture:** Same static Astro site as Phase 1. New content collections (`journal`, `timeline`) feed pure, tested helpers in `src/lib`; pages stay thin. Existing journey components are generalized to accept devlog items and to serve involvement stories under `/about/<slug>/`.

**Tech Stack:** Phase 1 stack plus `@astrojs/rss`; Playwright (already installed) generates the resume PDF.

**Prerequisite:** Phase 1 is complete (`git tag phase-1` exists, `npm run verify` and `npm run e2e` pass). Read the spec and `docs/superpowers/plans/2026-10-25-phase-1-core-site.md` first; this plan reuses its file names, helpers and CSS classes.

## Global Constraints

Everything in Phase 1's Global Constraints still applies, restated where it bites:

- Run under Node `22.23.4` (`fnm use 22.23.4`, or prefix `fnm exec --using=22.23.4`).
- **Journal entries have no title field.** The date is the title everywhere: heading, index, prev/next, browser `<title>` (`24 October 2026 | Journal | Ali Khalaf`), meta description (the entry's first sentence), RSS item title. Filename `YYYY-MM-DD.md`, a second post the same day `YYYY-MM-DD-2.md`; URL `/journal/YYYY-MM-DD/`.
- **Content rules:** no AI-tooling mentions anywhere; Tanami role line only; employers described at CV level only (no client, product, internal-tool, metric or colleague detail beyond the timeline text); only the two credentials; the phone number is never published; the plain email address never appears in HTML (the resume PDF is a file and does contain the address, which the owner chose to make public).
- **Identity:** "Ali Khalaf" everywhere; "Kwaddo" only inside URLs; "Quad" never.
- **CSS:** logical properties only; 360px with no horizontal scroll; RTL-safe; all motion disabled under `prefers-reduced-motion`.
- **Collections:** `draft: boolean` (default `false`) on every collection; drafts excluded from pages, indexes, RSS and sitemap.
- **Story intake:** raw text lives in `~/Documents/notes/Portfolio Stories.md` (outside the repo, never committed). Claude edits it for professionalism and discretion, keeps the owner's facts and meaning, invents nothing, returns a change note (what was cut, softened or generalized, plus anything sensitive), and commits only after the owner approves.
- **Commits:** conventional prefixes; **never a `Co-Authored-By` trailer.**
- **Quality gate:** `npm run verify` and `npm run e2e` pass before each commit that touches code.

## File Structure

```
src/lib/journal.ts            pure journal helpers (tested)
src/lib/timeline.ts           pure timeline helpers (tested)
src/lib/story-paths.ts        static paths for involvement journeys
src/data/uses.ts  src/data/resume.ts
src/content/journal/*.md  src/content/timeline/*.md
src/components/DateStamp  JournalTicker  Timeline  Devlog   (.astro)
src/pages/journal/index  journal/[id]  journal/tag/[tag]
src/pages/rss.xml.ts  resume.astro  uses.astro  404.astro  about/[slug].astro
src/styles/print.css
scripts/new-post.mjs  scripts/make-resume-pdf.mjs
public/Ali-Khalaf-CV.pdf
tests/journal.test.ts  tests/timeline.test.ts
```

Modified: `src/content.config.ts`, `src/lib/nav.ts`, `tests/nav.test.ts`, `src/lib/dates.ts`, `tests/dates.test.ts`, `src/layouts/Base.astro`, `src/components/Footer.astro`, `src/components/ProjectPage.astro`, `src/components/JourneyView.astro`, `src/lib/journey-paths.ts`, `src/pages/index.astro`, `src/pages/work/index.astro`, `src/pages/about.astro`, `scripts/check-dist.mjs`, `e2e/layout.spec.ts`, `package.json`. Deleted: `src/data/credentials.ts` (the timeline carries education).

---

### Task 1: Journal helpers (TDD)

**Files:**
- Create: `src/lib/journal.ts`
- Modify: `src/lib/dates.ts`, `tests/dates.test.ts`
- Test: `tests/journal.test.ts`

**Interfaces:**
- Produces (all pure):
  - `stripMarkdown(md: string): string`, `excerpt(md: string, max?: number): string` (default 180, cuts at a word boundary and adds `…`), `firstSentence(md: string): string`
  - `newestFirst<T extends { data: { date: Date } }>(entries: T[]): T[]`
  - `tagsOf(entries: { data: { tags: string[] } }[]): string[]` (unique, sorted), `tagSlug(tag: string): string`
  - `neighbors<T extends { id: string }>(newestFirstList: T[], id: string): { newer?: T; older?: T }`
  - `postFilename(existing: string[], iso: string): string`
  - `forProject<T extends { data: { project?: string } }>(entries: T[], slug: string): T[]`
  - `type DevlogItem = { href: string; date: Date; text: string }`, `toDevlog(entries: { id: string; body?: string; data: { date: Date } }[]): DevlogItem[]`
  - `formatDay(d: Date): string` in `dates.ts` (e.g. `24 October 2026`)

- [ ] **Step 1: Write the failing tests**

`tests/journal.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import {
  excerpt,
  firstSentence,
  forProject,
  neighbors,
  newestFirst,
  postFilename,
  stripMarkdown,
  tagSlug,
  tagsOf,
  toDevlog,
} from '../src/lib/journal';

const post = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  body: `Body of ${id}. More text.`,
  data: { date: new Date(date), tags: [] as string[], ...extra },
});

describe('stripMarkdown', () => {
  test('removes headings, emphasis, links, images and code', () => {
    const md = '# Title\n\nSome **bold** and _italic_ with a [link](https://x.dev) and `code`.\n\n![alt](a.png)\n\n```js\nconst a = 1;\n```';
    expect(stripMarkdown(md)).toBe('Title Some bold and italic with a link and code.');
  });
});

describe('excerpt', () => {
  test('returns short text untouched', () => {
    expect(excerpt('Short one.')).toBe('Short one.');
  });
  test('cuts at a word boundary and adds an ellipsis', () => {
    const out = excerpt('alpha beta gamma delta epsilon', 14);
    expect(out).toBe('alpha beta…');
  });
});

describe('firstSentence', () => {
  test('returns the first sentence', () => {
    expect(firstSentence('Hello world. Second one.')).toBe('Hello world.');
  });
  test('falls back to an excerpt when there is no terminator', () => {
    expect(firstSentence('no terminator here')).toBe('no terminator here');
  });
});

describe('ordering and navigation', () => {
  const a = post('2026-10-01', '2026-10-01');
  const b = post('2026-10-02', '2026-10-02');
  const c = post('2026-10-03', '2026-10-03');
  test('newestFirst sorts descending without mutating', () => {
    const input = [a, c, b];
    expect(newestFirst(input).map((p) => p.id)).toEqual(['2026-10-03', '2026-10-02', '2026-10-01']);
    expect(input.map((p) => p.id)).toEqual(['2026-10-01', '2026-10-03', '2026-10-02']);
  });
  test('neighbors returns newer and older', () => {
    const sorted = newestFirst([a, b, c]);
    expect(neighbors(sorted, '2026-10-02')).toEqual({ newer: c, older: a });
    expect(neighbors(sorted, '2026-10-03')).toEqual({ newer: undefined, older: b });
    expect(neighbors(sorted, 'nope')).toEqual({});
  });
});

describe('tags', () => {
  test('tagsOf is unique and sorted', () => {
    const list = [post('a', '2026-10-01', { tags: ['go', 'rust'] }), post('b', '2026-10-02', { tags: ['go'] })];
    expect(tagsOf(list)).toEqual(['go', 'rust']);
  });
  test('tagSlug is url-safe', () => {
    expect(tagSlug('Game Dev!')).toBe('game-dev');
    expect(tagSlug('  C# / .NET ')).toBe('c-net');
  });
});

describe('postFilename', () => {
  test('uses the plain date when free', () => {
    expect(postFilename([], '2026-10-25')).toBe('2026-10-25.md');
  });
  test('adds -2, -3 when taken', () => {
    expect(postFilename(['2026-10-25.md'], '2026-10-25')).toBe('2026-10-25-2.md');
    expect(postFilename(['2026-10-25.md', '2026-10-25-2.md'], '2026-10-25')).toBe('2026-10-25-3.md');
  });
});

describe('project devlog', () => {
  test('forProject filters by project slug', () => {
    const list = [post('a', '2026-10-01', { project: 'smobb' }), post('b', '2026-10-02', { project: 'skoobl' }), post('c', '2026-10-03')];
    expect(forProject(list, 'smobb').map((p) => p.id)).toEqual(['a']);
  });
  test('toDevlog maps entries to links with an excerpt', () => {
    const items = toDevlog([post('2026-10-02', '2026-10-02')]);
    expect(items).toEqual([{ href: '/journal/2026-10-02/', date: new Date('2026-10-02'), text: 'Body of 2026-10-02. More text.' }]);
  });
});
```

Append to `tests/dates.test.ts` (inside a new `describe`, plus extend the import to `import { formatDay, formatMonth } from '../src/lib/dates';`):
```ts
describe('formatDay', () => {
  test('formats day, long month and year in UTC', () => {
    expect(formatDay(new Date('2026-10-24'))).toBe('24 October 2026');
    expect(formatDay(new Date('2026-01-05T00:00:00Z'))).toBe('5 January 2026');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test -- journal dates`
Expected: FAIL: cannot resolve `../src/lib/journal`; `formatDay` is not exported.

- [ ] **Step 3: Implement**

Append to `src/lib/dates.ts`:
```ts
export const formatDay = (d: Date): string =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
```

`src/lib/journal.ts`:
```ts
export const stripMarkdown = (md: string): string =>
  md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const excerpt = (md: string, max = 180): string => {
  const text = stripMarkdown(md);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).trimEnd()}…`;
};

export const firstSentence = (md: string): string => {
  const text = stripMarkdown(md);
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0] : excerpt(text, 160);
};

export const newestFirst = <T extends { data: { date: Date } }>(entries: T[]): T[] =>
  [...entries].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

export const tagsOf = (entries: { data: { tags: string[] } }[]): string[] =>
  [...new Set(entries.flatMap((e) => e.data.tags))].sort();

export const tagSlug = (tag: string): string =>
  tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const neighbors = <T extends { id: string }>(
  newestFirstList: T[],
  id: string,
): { newer?: T; older?: T } => {
  const i = newestFirstList.findIndex((e) => e.id === id);
  if (i === -1) return {};
  return { newer: newestFirstList[i - 1], older: newestFirstList[i + 1] };
};

export const postFilename = (existing: string[], iso: string): string => {
  const taken = new Set(existing);
  if (!taken.has(`${iso}.md`)) return `${iso}.md`;
  let n = 2;
  while (taken.has(`${iso}-${n}.md`)) n += 1;
  return `${iso}-${n}.md`;
};

export const forProject = <T extends { data: { project?: string } }>(entries: T[], slug: string): T[] =>
  entries.filter((e) => e.data.project === slug);

export type DevlogItem = { href: string; date: Date; text: string };

export const toDevlog = (entries: { id: string; body?: string; data: { date: Date } }[]): DevlogItem[] =>
  entries.map((e) => ({ href: `/journal/${e.id}/`, date: e.data.date, text: excerpt(e.body ?? '', 140) }));
```

- [ ] **Step 4: Run tests and type check**

```bash
npm run test
npm run check
```
Expected: all PASS; `0 errors`.

- [ ] **Step 5: Commit**

```bash
git add src/lib tests
git commit -m "feat: add tested journal helpers and formatDay"
```

---

### Task 2: Journal collection, pages and nav

**Files:**
- Modify: `src/content.config.ts`, `src/lib/nav.ts`, `tests/nav.test.ts`
- Create: `src/components/DateStamp.astro`
- Create: `src/pages/journal/index.astro`, `src/pages/journal/[id].astro`, `src/pages/journal/tag/[tag].astro`
- Modify: `src/styles/manga.css` (append)

**Interfaces:**
- Consumes: `newestFirst`, `neighbors`, `tagsOf`, `tagSlug`, `excerpt`, `firstSentence`, `formatDay`, `published`.
- Produces: `journal` collection `{ date: Date, tags: string[], project?: string, draft: boolean }`; routes `/journal/`, `/journal/<id>/`, `/journal/tag/<tag-slug>/`; `<DateStamp date />`; nav gains "Journal" between Personal and About.

- [ ] **Step 1: Update the nav test first**

In `tests/nav.test.ts` change the first test to:
```ts
  test('lists the five primary pages in order', () => {
    expect(nav.map((n) => n.label)).toEqual(['Work', 'Personal', 'Journal', 'About', 'Contact']);
  });
```
Run `npm run test -- nav`; expected FAIL (still four labels).

- [ ] **Step 2: Update `src/lib/nav.ts`**

Insert `{ href: '/journal/', label: 'Journal' },` between the Personal and About entries. Run `npm run test -- nav`; expected PASS.

- [ ] **Step 3: Add the `journal` collection**

In `src/content.config.ts` add before the `export`:
```ts
const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    project: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});
```
and change the export to `export const collections = { work, games, lab, about, journeys, journal };`.

- [ ] **Step 4: Write `src/components/DateStamp.astro`**

```astro
---
import { formatDay } from '../lib/dates';

interface Props {
  date: Date;
  as?: 'h1' | 'h2' | 'p';
}
const { date, as: Tag = 'p' } = Astro.props;
---
<Tag class="stamp"><time datetime={date.toISOString().slice(0, 10)}>{formatDay(date)}</time></Tag>
```

- [ ] **Step 5: Write the journal index**

`src/pages/journal/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import DateStamp from '../../components/DateStamp.astro';
import { excerpt } from '../../lib/journal';
import { newestFirst, tagsOf, tagSlug } from '../../lib/journal';
import { published } from '../../lib/content';

const entries = newestFirst(published(await getCollection('journal')));
const tags = tagsOf(entries);
---
<Base title="Journal" description="Daily notes from Ali Khalaf: what is being built, learned and played.">
  <div class="wrap stack">
    <h1>Journal</h1>
    <p class="lede">Short daily notes. <a href="/rss.xml">RSS</a></p>
    {
      tags.length > 0 && (
        <ul class="tags" aria-label="Filter by tag">
          {tags.map((t) => (
            <li><a href={`/journal/tag/${tagSlug(t)}/`}>{t}</a></li>
          ))}
        </ul>
      )
    }
    {entries.length === 0 && <p>No entries yet.</p>}
    <ol class="entries">
      {
        entries.map((e) => (
          <li class="entry">
            <a class="entry__link" href={`/journal/${e.id}/`}>
              <DateStamp date={e.data.date} />
              <p>{excerpt(e.body ?? '', 200)}</p>
            </a>
          </li>
        ))
      }
    </ol>
  </div>
</Base>
```

- [ ] **Step 6: Write the entry page**

`src/pages/journal/[id].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import Base from '../../layouts/Base.astro';
import DateStamp from '../../components/DateStamp.astro';
import { firstSentence, neighbors, newestFirst, tagSlug } from '../../lib/journal';
import { formatDay } from '../../lib/dates';
import { published } from '../../lib/content';

export async function getStaticPaths() {
  const entries = newestFirst(published(await getCollection('journal')));
  return entries.map((entry) => ({ params: { id: entry.id }, props: { entry, entries } }));
}

const { entry, entries } = Astro.props;
const { Content } = await render(entry);
const { newer, older } = neighbors(entries, entry.id);

const [games, lab] = await Promise.all([getCollection('games'), getCollection('lab')]);
const project = entry.data.project;
const projectHref = !project
  ? undefined
  : games.some((g) => g.id === project)
    ? `/personal/games/${project}/`
    : lab.some((l) => l.id === project)
      ? `/personal/lab/${project}/`
      : undefined;
---
<Base title={`${formatDay(entry.data.date)} | Journal`} description={firstSentence(entry.body ?? '')}>
  <article class="wrap stack">
    <p><a class="back" href="/journal/">Journal</a></p>
    <DateStamp date={entry.data.date} as="h1" />
    {
      entry.data.tags.length > 0 && (
        <ul class="tags">
          {entry.data.tags.map((t) => (
            <li><a href={`/journal/tag/${tagSlug(t)}/`}>{t}</a></li>
          ))}
        </ul>
      )
    }
    <div class="prose"><Content /></div>
    {projectHref && <p><a href={projectHref}>About {project}</a></p>}
    <nav class="pager" aria-label="More entries">
      {older ? <a class="btn" href={`/journal/${older.id}/`}>Older: {formatDay(older.data.date)}</a> : <span />}
      {newer ? <a class="btn" href={`/journal/${newer.id}/`}>Newer: {formatDay(newer.data.date)}</a> : <span />}
    </nav>
  </article>
</Base>
```

- [ ] **Step 7: Write the tag page**

`src/pages/journal/tag/[tag].astro`:
```astro
---
import { getCollection } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import DateStamp from '../../../components/DateStamp.astro';
import { excerpt, newestFirst, tagSlug, tagsOf } from '../../../lib/journal';
import { published } from '../../../lib/content';

export async function getStaticPaths() {
  const entries = newestFirst(published(await getCollection('journal')));
  return tagsOf(entries).map((tag) => ({
    params: { tag: tagSlug(tag) },
    props: { tag, entries: entries.filter((e) => e.data.tags.includes(tag)) },
  }));
}

const { tag, entries } = Astro.props;
---
<Base title={`Journal: ${tag}`} description={`Journal entries tagged ${tag}.`}>
  <div class="wrap stack">
    <p><a class="back" href="/journal/">Journal</a></p>
    <h1>{tag}</h1>
    <ol class="entries">
      {
        entries.map((e) => (
          <li class="entry">
            <a class="entry__link" href={`/journal/${e.id}/`}>
              <DateStamp date={e.data.date} />
              <p>{excerpt(e.body ?? '', 200)}</p>
            </a>
          </li>
        ))
      }
    </ol>
  </div>
</Base>
```

- [ ] **Step 8: Append the styles**

Append to `src/styles/manga.css`:
```css
/* ---------- journal ---------- */
.stamp {
  margin: 0;
  font: 400 clamp(2rem, 7vw, 3.25rem) / 1 var(--font-display);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.entries {
  display: grid;
  gap: var(--gutter);
  margin: 0;
  padding: 0;
  list-style: none;
}
.entry__link {
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
  border: var(--rule);
  background: var(--paper);
  color: var(--ink);
  text-decoration: none;
}
.entry__link p:not(.stamp) {
  color: var(--tone);
}
.entry__link:hover,
.entry__link:focus-visible {
  background: var(--ink);
  color: var(--paper);
}
.entry__link:hover p:not(.stamp),
.entry__link:focus-visible p:not(.stamp) {
  color: var(--paper);
}
.pager {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
}
```

- [ ] **Step 9: Verify with a throwaway entry, then remove it**

```bash
npm run verify
```
Expected: passes (no entries yet, `/journal/` renders "No entries yet.").

Create `src/content/journal/2026-10-24.md`:
```markdown
---
date: 2026-10-24
tags: [rust, games]
---
Fixed the web build today. A second sentence follows it.
```
Run `npm run build`. Expected: pages `/journal/`, `/journal/2026-10-24/`, `/journal/tag/rust/`, `/journal/tag/games/`; the entry's HTML `<title>` is `24 October 2026 | Journal | Ali Khalaf` and its meta description is `Fixed the web build today.`. Then `rm src/content/journal/2026-10-24.md`.

- [ ] **Step 10: Commit**

```bash
git add src tests
git commit -m "feat: add date-titled journal with tag pages and nav entry"
```

---

### Task 3: RSS and required build outputs

**Files:**
- Create: `src/pages/rss.xml.ts`
- Modify: `src/layouts/Base.astro`, `scripts/check-dist.mjs`, `package.json`

**Interfaces:**
- Produces: `/rss.xml` with one item per published journal entry (title = date, description = excerpt, link `/journal/<id>/`); a `<link rel="alternate" type="application/rss+xml">` in every page; `check-dist` fails if `rss.xml`, `sitemap-index.xml` or `robots.txt` are missing.

- [ ] **Step 1: Install RSS**

```bash
npm install --save-exact @astrojs/rss@4.0.19
```

- [ ] **Step 2: Write `src/pages/rss.xml.ts`**

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { site } from '../data/site';
import { formatDay } from '../lib/dates';
import { excerpt, newestFirst } from '../lib/journal';
import { published } from '../lib/content';

export async function GET(context: APIContext) {
  const entries = newestFirst(published(await getCollection('journal')));
  return rss({
    title: `${site.name}: journal`,
    description: 'Short daily notes: what is being built, learned and played.',
    site: context.site!,
    items: entries.map((e) => ({
      title: formatDay(e.data.date),
      description: excerpt(e.body ?? '', 280),
      pubDate: e.data.date,
      link: `/journal/${e.id}/`,
    })),
  });
}
```

- [ ] **Step 3: Advertise the feed**

In `src/layouts/Base.astro`, add after the `icon` link:
```astro
    <link rel="alternate" type="application/rss+xml" title={`${site.name}: journal`} href="/rss.xml" />
```

- [ ] **Step 4: Require key outputs in `check-dist`**

In `scripts/check-dist.mjs`, add `existsSync` to the `node:fs` import and, before the final violations check, add:
```js
const required = ['rss.xml', 'sitemap-index.xml', 'robots.txt'];
for (const file of required) {
  if (!existsSync(join(root, file))) violations.push(`${file}: missing from dist`);
}
```
Task 9 adds `'404.html'` to the `required` list.

- [ ] **Step 5: Verify**

```bash
npm run verify
```
Expected: passes. `ls dist/rss.xml dist/sitemap-index.xml` both exist; `grep -c 'rss+xml' dist/index.html` prints `1`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src scripts
git commit -m "feat: add RSS feed and require key build outputs"
```

---

### Task 4: `npm run new` scaffold script

**Files:**
- Create: `scripts/new-post.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `postFilename` (already tested in Task 1).
- Produces: `npm run new` creates `src/content/journal/<today>.md` (or `-2`, `-3`) with `date` and empty `tags`; an optional first argument sets `project: <slug>` (`npm run new -- smobb`). Prints the created path.

- [ ] **Step 1: Write `scripts/new-post.mjs`**

```js
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { postFilename } from '../src/lib/journal.ts';

const dir = new URL('../src/content/journal/', import.meta.url);
mkdirSync(dir, { recursive: true });

const iso = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const name = postFilename(readdirSync(dir), iso);
const project = process.argv[2];

const front = ['---', `date: ${iso}`, 'tags: []', ...(project ? [`project: ${project}`] : []), '---', '', ''].join('\n');
writeFileSync(new URL(name, dir), front);
console.log(`Created src/content/journal/${name}`);
```

- [ ] **Step 2: Add the script**

In `package.json` `scripts` add `"new": "node scripts/new-post.mjs"`.

- [ ] **Step 3: Verify**

```bash
npm run new
npm run new -- smobb
ls src/content/journal
head -6 src/content/journal/*.md
```
Expected: two files, `<today>.md` and `<today>-2.md`; the second contains `project: smobb`. Then delete both: `rm src/content/journal/*.md`.

- [ ] **Step 4: Commit**

```bash
git add package.json scripts/new-post.mjs
git commit -m "feat: add npm run new journal scaffold"
```

---

### Task 5: Landing journal ticker

**Files:**
- Create: `src/components/JournalTicker.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `newestFirst`, `excerpt`, `published`, `DateStamp`.
- Produces: `<JournalTicker />` showing the latest three entries; renders nothing when there are none.

- [ ] **Step 1: Write `src/components/JournalTicker.astro`**

```astro
---
import { getCollection } from 'astro:content';
import DateStamp from './DateStamp.astro';
import { excerpt, newestFirst } from '../lib/journal';
import { published } from '../lib/content';

const latest = newestFirst(published(await getCollection('journal'))).slice(0, 3);
---
{
  latest.length > 0 && (
    <section class="wrap stack ticker" aria-labelledby="ticker-title">
      <h2 id="ticker-title">Latest from the journal</h2>
      <ol class="entries">
        {
          latest.map((e) => (
            <li class="entry">
              <a class="entry__link" href={`/journal/${e.id}/`}>
                <DateStamp date={e.data.date} />
                <p>{excerpt(e.body ?? '', 140)}</p>
              </a>
            </li>
          ))
        }
      </ol>
      <p><a href="/journal/">All entries</a></p>
    </section>
  )
}
```

- [ ] **Step 2: Add it to the landing page**

In `src/pages/index.astro`, add `import JournalTicker from '../components/JournalTicker.astro';` to the frontmatter and place `<JournalTicker />` between the `.split` section and `<WorkWithMe />`.

- [ ] **Step 3: Verify**

```bash
npm run verify
```
Expected: passes; with no entries the landing page has no `ticker-title`. Check with a throwaway entry (as in Task 2 Step 9): the heading and the entry appear; remove the entry afterwards.

- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "feat: add journal ticker to the landing page"
```

---

### Task 6: Timeline (TDD), seed data, and strips

**Files:**
- Create: `src/lib/timeline.ts`, `src/components/Timeline.astro`
- Create: `src/content/timeline/*.md` (nine seed entries)
- Modify: `src/content.config.ts`, `src/pages/work/index.astro`, `src/pages/about.astro`, `src/styles/manga.css`
- Delete: `src/data/credentials.ts`
- Test: `tests/timeline.test.ts`

**Interfaces:**
- Produces:
  - `monthLabel(ym: string): string` (`'2026-06'` → `Jun 2026`), `periodLabel(start: string, end: string): string` (`Jun 2026 - present`)
  - `sortTimeline<T extends { data: { start: string; end: string } }>(entries: T[]): T[]`: current entries (`end === 'present'`) first (newest start first), then by end date descending, ties by start descending
  - `nextStory<T extends { id: string; data: { journey: boolean } }>(sorted: T[], id: string): T | undefined`
  - `timeline` collection: `{ start: 'YYYY-MM', end: 'YYYY-MM' | 'present', kind: 'work'|'education'|'project'|'event', title, org?, summary?, link?, journey: boolean, draft }`; refinement: `journey` is not allowed when `kind === 'project'`.
  - `<Timeline entries />` renders an ordered list.

- [ ] **Step 1: Write the failing tests**

`tests/timeline.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { monthLabel, nextStory, periodLabel, sortTimeline } from '../src/lib/timeline';

const e = (id: string, start: string, end: string, journey = false) => ({ id, data: { start, end, journey } });

describe('labels', () => {
  test('monthLabel formats YYYY-MM', () => {
    expect(monthLabel('2026-06')).toBe('Jun 2026');
    expect(monthLabel('2025-09')).toBe('Sep 2025');
  });
  test('periodLabel handles present and closed periods', () => {
    expect(periodLabel('2026-06', 'present')).toBe('Jun 2026 - present');
    expect(periodLabel('2025-06', '2025-07')).toBe('Jun 2025 - Jul 2025');
  });
});

describe('sortTimeline', () => {
  test('pins current entries on top, then end date descending, then start descending', () => {
    const input = [
      e('doo', '2025-06', '2025-07'),
      e('tanami', '2026-06', 'present'),
      e('croozz', '2025-02', '2026-01'),
      e('uob', '2021-09', '2026-08'),
      e('reboot', '2024-08', '2026-08'),
    ];
    expect(sortTimeline(input).map((x) => x.id)).toEqual(['tanami', 'reboot', 'uob', 'croozz', 'doo']);
  });
  test('does not mutate its input', () => {
    const input = [e('a', '2020-01', '2020-02'), e('b', '2021-01', '2021-02')];
    sortTimeline(input);
    expect(input.map((x) => x.id)).toEqual(['a', 'b']);
  });
});

describe('nextStory', () => {
  const sorted = [e('a', '2026-01', 'present', true), e('b', '2025-01', '2025-02'), e('c', '2024-01', '2024-02', true)];
  test('returns the next entry that has a journey', () => {
    expect(nextStory(sorted, 'a')?.id).toBe('c');
  });
  test('returns undefined at the end or for unknown ids', () => {
    expect(nextStory(sorted, 'c')).toBeUndefined();
    expect(nextStory(sorted, 'zzz')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test -- timeline`
Expected: FAIL, cannot resolve `../src/lib/timeline`.

- [ ] **Step 3: Implement**

`src/lib/timeline.ts`:
```ts
export const monthLabel = (ym: string): string => {
  const [year, month] = ym.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

export const periodLabel = (start: string, end: string): string =>
  end === 'present' ? `${monthLabel(start)} - present` : `${monthLabel(start)} - ${monthLabel(end)}`;

export const sortTimeline = <T extends { data: { start: string; end: string } }>(entries: T[]): T[] =>
  [...entries].sort((a, b) => {
    const aNow = a.data.end === 'present';
    const bNow = b.data.end === 'present';
    if (aNow !== bNow) return aNow ? -1 : 1;
    if (a.data.end !== b.data.end) return a.data.end < b.data.end ? 1 : -1;
    return a.data.start < b.data.start ? 1 : a.data.start > b.data.start ? -1 : 0;
  });

export const nextStory = <T extends { id: string; data: { journey: boolean } }>(
  sorted: T[],
  id: string,
): T | undefined => {
  const list = sorted.filter((x) => x.data.journey);
  const i = list.findIndex((x) => x.id === id);
  return i === -1 ? undefined : list[i + 1];
};
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- timeline`
Expected: PASS.

- [ ] **Step 5: Add the collection**

In `src/content.config.ts` add:
```ts
const timeline = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/timeline' }),
  schema: z
    .object({
      start: z.string().regex(/^\d{4}-\d{2}$/),
      end: z.string().regex(/^(\d{4}-\d{2}|present)$/),
      kind: z.enum(['work', 'education', 'project', 'event']),
      title: z.string(),
      org: z.string().optional(),
      summary: z.string().optional(),
      link: z.string().optional(),
      journey: z.boolean().default(false),
      draft: z.boolean().default(false),
    })
    .refine((d) => !(d.journey && d.kind === 'project'), {
      message: 'project timeline entries link to their project page; their journeys live under /personal/',
      path: ['journey'],
    }),
});
```
and add `timeline` to the exported `collections`.

- [ ] **Step 6: Write the seed entries**

Each is `src/content/timeline/<id>.md`; the body is empty (only frontmatter).

`tanami.md`:
```markdown
---
start: '2026-06'
end: present
kind: work
title: Software Engineer
org: Tanami
---
```
`babel-pastries.md`:
```markdown
---
start: '2025-11'
end: '2025-12'
kind: work
title: Full Stack Engineer
org: Babel Pastries
summary: Built a TV slideshow application with an admin panel and engine, deployed it, and trained a new developer on Laravel and React.
---
```
`tech-bay.md`:
```markdown
---
start: '2025-10'
end: '2025-11'
kind: work
title: Junior Software Engineer
org: Tech Bay IT Solutions
summary: Trained on Dynamics 365 and internal systems, and worked with clients, many of them government-related.
---
```
`doo-mena.md`:
```markdown
---
start: '2025-06'
end: '2025-07'
kind: work
title: Software Engineer Intern
org: DOO Mena
summary: Built a backend system for one section and started work on their frontend.
---
```
`croozz.md`:
```markdown
---
start: '2025-02'
end: '2026-01'
kind: work
title: Full-stack Developer
org: Croozz Technologies
summary: Part-time in a small, fast-moving team shipping frequent updates.
---
```
`reboot.md`:
```markdown
---
start: '2024-08'
end: '2026-08'
kind: education
title: DevOps
org: Reboot Coding Institute
summary: Graduated.
---
```
`uob.md`:
```markdown
---
start: '2021-09'
end: '2026-08'
kind: education
title: Bachelor's in Software Engineering
org: University of Bahrain
summary: Graduated.
---
```
`smobb.md`:
```markdown
---
start: '2023-07'
end: '2026-07'
kind: project
title: S.M.O.B.B.
summary: A text adventure about AI, written in Rust, released with a terminal and web version.
link: /personal/games/smobb/
---
```
`skoobl.md`:
```markdown
---
start: '2025-01'
end: '2026-10'
kind: project
title: skoobl
summary: A free multiplayer drawing-and-guessing party game with English and Arabic word packs.
link: /personal/games/skoobl/
---
```

- [ ] **Step 7: Write `src/components/Timeline.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { periodLabel, sortTimeline } from '../lib/timeline';

interface Props {
  entries: CollectionEntry<'timeline'>[];
}
const items = sortTimeline(Astro.props.entries);
const href = (e: CollectionEntry<'timeline'>) => (e.data.journey ? `/about/${e.id}/` : e.data.link);
---
<ol class="timeline">
  {
    items.map((e) => (
      <li class="timeline__item">
        <p class="timeline__period">{periodLabel(e.data.start, e.data.end)}</p>
        <div>
          <p class="timeline__title">
            {href(e) ? <a href={href(e)}>{e.data.title}</a> : e.data.title}
            {e.data.org && <span class="timeline__org"> · {e.data.org}</span>}
          </p>
          {e.data.summary && <p class="timeline__summary">{e.data.summary}</p>}
        </div>
      </li>
    ))
  }
</ol>
```

- [ ] **Step 8: Append the styles**

Append to `src/styles/manga.css`:
```css
/* ---------- timeline ---------- */
.timeline {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  padding-inline-start: 1rem;
  border-inline-start: var(--rule);
  list-style: none;
}
.timeline__item {
  display: grid;
  gap: 0.25rem 1.5rem;
}
@media (min-width: 40rem) {
  .timeline__item {
    grid-template-columns: 11rem 1fr;
  }
}
.timeline__period {
  color: var(--tone);
  font-size: 0.9rem;
}
.timeline__title {
  font-weight: 700;
}
.timeline__org {
  font-weight: 400;
}
.timeline__summary {
  color: var(--tone);
}
```

- [ ] **Step 9: Use the strip on Work and About; remove the duplicate education block**

In `src/pages/work/index.astro` add `import Timeline from '../../components/Timeline.astro';` and `import { published } from '../../lib/content';` is already present; add `const timeline = published(await getCollection('timeline'));` to the frontmatter, and after the `.panel-grid` div (inside `.wrap.stack`) add:
```astro
    <section class="stack" aria-labelledby="timeline-title">
      <h2 id="timeline-title">Timeline</h2>
      <Timeline entries={timeline} />
    </section>
```

In `src/pages/about.astro`: remove the `credentials` import, the whole `<section aria-labelledby="education">…</section>` block, and add `import Timeline from '../components/Timeline.astro';`, `const timeline = published(await getCollection('timeline'));`, and in place of the removed education section:
```astro
    <section class="stack" aria-labelledby="timeline-title">
      <h2 id="timeline-title">Timeline</h2>
      <Timeline entries={timeline} />
    </section>
```
Then delete the data file: `git rm src/data/credentials.ts`.

- [ ] **Step 10: Verify**

```bash
npm run verify
```
Expected: passes. `/about/` and `/work/` show the timeline in this order: Tanami (Jun 2026 - present), skoobl, Reboot, UOB, S.M.O.B.B. (end Jul 2026 comes after Aug), Croozz, Babel Pastries, Tech Bay, DOO Mena. Education shows exactly the two credentials, no others.

Note on ordering: skoobl (ends 2026-10) sorts above the 2026-08 education entries; that is the specified end-date rule.

- [ ] **Step 11: Commit**

```bash
git add src tests
git commit -m "feat: add timeline collection, strips and seed data"
```

---

### Task 7: Involvement journeys at `/about/<slug>/`

**Files:**
- Create: `src/lib/story-paths.ts`, `src/pages/about/[slug].astro`
- Modify: `src/lib/journey-paths.ts`, `src/components/JourneyView.astro`

**Interfaces:**
- Consumes: `sortTimeline`, `nextStory`, `journeyChapters`, `published`; `JourneyView`.
- Produces: `storyPaths()` returning static paths for timeline entries with `journey: true`, props `{ title, chapters, next?, devlog }`; route `/about/<id>/` (generated only for those entries; throws if an entry sets `journey: true` but has no chapters in `src/content/journeys/<id>/`).
- `JourneyView` gains an optional `devlog?: DevlogItem[]` prop (rendered by the component built in Task 8; until then it is accepted and ignored).

- [ ] **Step 1: Write `src/lib/story-paths.ts`**

```ts
import { getCollection } from 'astro:content';
import { journeyChapters, published } from './content';
import { forProject, newestFirst, toDevlog } from './journal';
import { nextStory, sortTimeline } from './timeline';

export async function storyPaths() {
  const [timeline, chapters, journal] = await Promise.all([
    getCollection('timeline'),
    getCollection('journeys'),
    getCollection('journal'),
  ]);
  const sorted = sortTimeline(published(timeline));
  const live = published(chapters);
  const posts = newestFirst(published(journal));

  return sorted
    .filter((e) => e.data.journey)
    .map((entry) => {
      const own = journeyChapters(live, entry.id);
      if (own.length === 0) {
        throw new Error(`timeline/${entry.id} has journey: true but no chapters in src/content/journeys/${entry.id}/`);
      }
      const next = nextStory(sorted, entry.id);
      return {
        params: { slug: entry.id },
        props: {
          title: entry.data.org ?? entry.data.title,
          chapters: own,
          devlog: toDevlog(forProject(posts, entry.id)),
          next: next ? { title: next.data.org ?? next.data.title, href: `/about/${next.id}/` } : undefined,
        },
      };
    });
}
```

- [ ] **Step 2: Write the route**

`src/pages/about/[slug].astro`:
```astro
---
import JourneyView from '../../components/JourneyView.astro';
import { storyPaths } from '../../lib/story-paths';

export function getStaticPaths() {
  return storyPaths();
}
const { title, chapters, next, devlog } = Astro.props;
---
<JourneyView title={title} chapters={chapters} backHref="/about/" next={next} devlog={devlog} />
```

- [ ] **Step 3: Teach `JourneyView` and `journeyPaths` about devlog**

In `src/components/JourneyView.astro` change `interface Props` to:
```astro
import type { DevlogItem } from '../lib/journal';

interface Props {
  title: string;
  chapters: CollectionEntry<'journeys'>[];
  backHref: string;
  next?: { title: string; href: string };
  devlog?: DevlogItem[];
}
const { title, chapters, backHref, next, devlog = [] } = Astro.props;
```
(replace the existing `const { … } = Astro.props;` line; keep the rest.)

In `src/lib/journey-paths.ts` add `getCollection('journal')` to the `Promise.all`, import `forProject`, `newestFirst`, `toDevlog` from `./journal`, compute `const posts = newestFirst(published(journal));` and add `devlog: toDevlog(forProject(posts, ref.id)),` to each `props` object.

- [ ] **Step 4: Verify with a throwaway involvement journey, then revert it**

```bash
npm run verify
```
Expected: passes (no timeline entry has `journey: true`).

Then: set `journey: true` in `src/content/timeline/croozz.md`, and create `src/content/journeys/croozz/01-test.md`:
```markdown
---
project: croozz
order: 1
title: Test chapter
---
Test body.
```
Run `npm run build`. Expected: `/about/croozz/index.html` exists, with the heading `Croozz Technologies: the journey`, and the Croozz entry in the timeline links to it. Delete the chapter file only and rebuild; expected FAIL with `timeline/croozz has journey: true but no chapters`. Revert: `git checkout src/content/timeline/croozz.md && rm -rf src/content/journeys/croozz`; rebuild passes.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: add involvement journeys under /about/<slug>/"
```

---

### Task 8: Devlog series on project pages and journeys

**Files:**
- Create: `src/components/Devlog.astro`
- Modify: `src/components/ProjectPage.astro`, `src/components/JourneyView.astro`

**Interfaces:**
- Consumes: `DevlogItem`, `toDevlog`, `forProject`, `newestFirst`, `formatDay`.
- Produces: `<Devlog items />` (renders nothing when empty); project pages show "From the devlog"; journey pages show the same list after the chapters.

- [ ] **Step 1: Write `src/components/Devlog.astro`**

```astro
---
import type { DevlogItem } from '../lib/journal';
import { formatDay } from '../lib/dates';

interface Props {
  items: DevlogItem[];
}
const { items } = Astro.props;
---
{
  items.length > 0 && (
    <section class="stack" aria-labelledby="devlog-title">
      <h2 id="devlog-title">From the devlog</h2>
      <ol class="entries">
        {
          items.map((i) => (
            <li class="entry">
              <a class="entry__link" href={i.href}>
                <p class="stamp">
                  <time datetime={i.date.toISOString().slice(0, 10)}>{formatDay(i.date)}</time>
                </p>
                <p>{i.text}</p>
              </a>
            </li>
          ))
        }
      </ol>
    </section>
  )
}
```

- [ ] **Step 2: Show it on project pages**

In `src/components/ProjectPage.astro` frontmatter add:
```astro
import { getCollection } from 'astro:content';
import Devlog from './Devlog.astro';
import { forProject, newestFirst, toDevlog } from '../lib/journal';
import { published } from '../lib/content';
```
(merge with the existing `render, type CollectionEntry` import from `astro:content`), then:
```astro
const devlog = toDevlog(forProject(newestFirst(published(await getCollection('journal'))), entry.id));
```
and render `<Devlog items={devlog} />` between the collaborators paragraph and the closing `</article>`.

- [ ] **Step 3: Show it on journey pages**

In `src/components/JourneyView.astro` add `import Devlog from './Devlog.astro';` and render `<Devlog items={devlog} />` after the chapters loop and before the `next` button.

- [ ] **Step 4: Verify with a throwaway post**

```bash
npm run verify
```
Expected: passes.

Create `src/content/journal/2026-10-24.md`:
```markdown
---
date: 2026-10-24
tags: [rust]
project: smobb
---
Fixed the web build today.
```
`npm run build`. Expected: `dist/personal/games/smobb/index.html` contains `From the devlog` and a link to `/journal/2026-10-24/`; `dist/personal/games/skoobl/index.html` does not. The journal entry page links back to the S.M.O.B.B. project page. Remove the post: `rm src/content/journal/2026-10-24.md`.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: show project devlog on project and journey pages"
```

---

### Task 9: Themed 404 and `/uses`

**Files:**
- Create: `src/pages/404.astro`, `src/pages/uses.astro`, `src/data/uses.ts`
- Modify: `src/components/Footer.astro`, `scripts/check-dist.mjs`

**Interfaces:**
- Produces: `/404.html` (served by GitHub Pages for unknown URLs), `/uses/`; footer links to Resume, Uses and RSS (Resume arrives in Task 10).

- [ ] **Step 1: Write the 404 page**

`src/pages/404.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import SpeechBubble from '../components/SpeechBubble.astro';
---
<Base title="Page not found" description="That page does not exist.">
  <div class="wrap stack">
    <SpeechBubble><h1>Page not found</h1><p>This panel is blank. The page you wanted is not here.</p></SpeechBubble>
    <p class="email">
      <a class="btn btn--solid" href="/">Home</a>
      <a class="btn" href="/work/">Work</a>
      <a class="btn" href="/personal/">Personal</a>
      <a class="btn" href="/journal/">Journal</a>
    </p>
  </div>
</Base>
```

- [ ] **Step 2: Write `/uses`**

`src/data/uses.ts` (only verified items; hardware and editor are added by the owner):
```ts
import { skills } from './skills';

export const uses = [
  { group: 'Languages and frameworks', items: skills.stack },
  { group: 'Infrastructure', items: ['Docker', 'PostgreSQL', 'Redis', 'GitHub Actions'] },
  { group: 'Game engines', items: ['Unity', 'Godot', 'Unreal Engine'] },
  { group: 'Writing and notes', items: ['Obsidian'] },
  { group: 'Version control', items: ['Git', 'GitHub'] },
];
```

`src/pages/uses.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import { uses } from '../data/uses';
---
<Base title="Uses" description="The languages, tools and engines Ali Khalaf builds with.">
  <div class="wrap stack">
    <h1>Uses</h1>
    <p class="lede">What I build with.</p>
    {
      uses.map((g, n) => (
        <section class="stack" aria-labelledby={`uses-${n}`}>
          <h2 id={`uses-${n}`}>{g.group}</h2>
          <ul class="tags">{g.items.map((item) => <li>{item}</li>)}</ul>
        </section>
      ))
    }
  </div>
</Base>
```

- [ ] **Step 3: Footer links**

In `src/components/Footer.astro`, replace the `<ul>` with:
```astro
    <ul>
      <li><a href={site.links.github} rel="me noopener">GitHub</a></li>
      <li><a href={site.links.linkedin} rel="me noopener">LinkedIn</a></li>
      <li><a href="/uses/">Uses</a></li>
      <li><a href="/rss.xml">RSS</a></li>
    </ul>
```
(the Resume link is added in Task 10).

- [ ] **Step 4: Require the 404 in the build**

In `scripts/check-dist.mjs` add `'404.html'` to the `required` array from Task 3.

- [ ] **Step 5: Verify**

```bash
npm run verify
```
Expected: passes; `dist/404.html` and `dist/uses/index.html` exist.

- [ ] **Step 6: Commit**

```bash
git add src scripts
git commit -m "feat: add themed 404 and uses page"
```

---

### Task 10: Resume page and PDF

**Files:**
- Create: `src/data/resume.ts`, `src/pages/resume.astro`, `src/styles/print.css`, `scripts/make-resume-pdf.mjs`
- Create: `public/Ali-Khalaf-CV.pdf` (generated)
- Modify: `package.json`, `src/components/Footer.astro`

**Interfaces:**
- Consumes: `timeline` (work and education entries), `skills`, `site`, `CopyEmail`, `sortTimeline`, `periodLabel`.
- Produces: `/resume/` (print-styled; shows the real email address once the page script has run); `npm run resume:pdf` writes `public/Ali-Khalaf-CV.pdf`; a "Download PDF" button on the page; footer link.

- [ ] **Step 1: Write `src/data/resume.ts`** (copy adapted from the owner's CV)

```ts
export const resume = {
  profile:
    'Software engineer who designs and ships real-world applications across web and backend systems. Skilled in Go, JavaScript, React and Laravel, with experience in startup-paced environments and client-facing projects. Interested in building efficient systems and continuously improving how software is made.',
  projects: [
    { name: 'Nocturne', stack: 'React (Vite) + Go', line: 'Served as the bridge between frontend and backend development, coordinating integration and keeping functionality and code quality consistent across the project.' },
    { name: 'Overworld', stack: 'React Native', line: 'Built a mobile app that automatically plays user-selected music when connecting to specific WiFi networks or Bluetooth devices.' },
    { name: 'go-byte', stack: 'Go (SDL2)', line: 'Built a CHIP-8 emulator in Go using SDL2 for graphics and input handling.' },
    { name: 'S.M.O.B.B.', stack: 'Rust', line: 'A text adventure about AI, released with a terminal and web version.' },
  ],
};
```

- [ ] **Step 2: Write `src/styles/print.css`**

```css
@media print {
  @page {
    size: A4;
    margin: 14mm;
  }
  body {
    font-size: 10pt;
    line-height: 1.45;
  }
  .nav,
  .footer,
  .skip,
  .btn,
  .no-print,
  .tone {
    display: none !important;
  }
  main {
    padding: 0;
  }
  .wrap {
    max-inline-size: none;
    padding-inline: 0;
  }
  a {
    text-decoration: none;
  }
  h1 {
    font-size: 24pt;
  }
  h2 {
    margin-block-start: 6mm;
    padding-block-end: 1mm;
    border-block-end: 1.5pt solid var(--ink);
    font-size: 13pt;
  }
  .timeline {
    border-inline-start: 0;
    padding-inline-start: 0;
  }
  .timeline__item,
  .resume__project {
    break-inside: avoid;
  }
}
```

- [ ] **Step 3: Write `src/pages/resume.astro`**

```astro
---
import '../styles/print.css';
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import CopyEmail from '../components/CopyEmail.astro';
import { published } from '../lib/content';
import { periodLabel, sortTimeline } from '../lib/timeline';
import { site } from '../data/site';
import { skills } from '../data/skills';
import { resume } from '../data/resume';

const entries = sortTimeline(published(await getCollection('timeline')));
const work = entries.filter((e) => e.data.kind === 'work');
const education = entries.filter((e) => e.data.kind === 'education');
---
<Base title="Resume" description="Resume of Ali Khalaf, software engineer in Bahrain.">
  <article class="wrap stack resume">
    <header class="stack">
      <h1>{site.name}</h1>
      <p class="lede">{site.role} · {site.location}</p>
      <CopyEmail />
      <p>
        <a href={site.links.github} rel="me noopener">github.com/Kwaddo</a> ·
        <a href={site.links.linkedin} rel="me noopener">LinkedIn</a>
      </p>
      <p class="no-print"><a class="btn btn--solid" href="/Ali-Khalaf-CV.pdf" download>Download PDF</a></p>
    </header>

    <section class="stack" aria-labelledby="r-profile"><h2 id="r-profile">Profile</h2><p>{resume.profile}</p></section>

    <section class="stack" aria-labelledby="r-exp">
      <h2 id="r-exp">Experience</h2>
      <ol class="timeline">
        {
          work.map((e) => (
            <li class="timeline__item">
              <p class="timeline__period">{periodLabel(e.data.start, e.data.end)}</p>
              <div>
                <p class="timeline__title">{e.data.title} <span class="timeline__org">· {e.data.org}</span></p>
                {e.data.summary && <p class="timeline__summary">{e.data.summary}</p>}
              </div>
            </li>
          ))
        }
      </ol>
    </section>

    <section class="stack" aria-labelledby="r-edu">
      <h2 id="r-edu">Education</h2>
      <ol class="timeline">
        {
          education.map((e) => (
            <li class="timeline__item">
              <p class="timeline__period">{periodLabel(e.data.start, e.data.end)}</p>
              <div>
                <p class="timeline__title">{e.data.title} <span class="timeline__org">· {e.data.org}</span></p>
                {e.data.summary && <p class="timeline__summary">{e.data.summary}</p>}
              </div>
            </li>
          ))
        }
      </ol>
    </section>

    <section class="stack" aria-labelledby="r-proj">
      <h2 id="r-proj">Projects</h2>
      {
        resume.projects.map((p) => (
          <div class="resume__project">
            <p class="timeline__title">{p.name} <span class="timeline__org">· {p.stack}</span></p>
            <p class="timeline__summary">{p.line}</p>
          </div>
        ))
      }
    </section>

    <section class="stack" aria-labelledby="r-skills">
      <h2 id="r-skills">Skills</h2>
      <ul class="tags">{skills.stack.map((s) => <li>{s}</li>)}</ul>
      <p>Languages: {skills.languages.join(', ')}</p>
    </section>
  </article>
</Base>
```

- [ ] **Step 4: Write `scripts/make-resume-pdf.mjs`**

```js
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const port = 4322;
const base = `http://127.0.0.1:${port}`;
const server = spawn('npx', ['astro', 'preview', '--host', '127.0.0.1', '--port', String(port), '--ignore-lock'], { stdio: 'ignore' });

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(`${base}/resume/`)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview server did not start (run `npm run build` first)');
}

try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${base}/resume/`, { waitUntil: 'networkidle' });
  await page.pdf({
    path: new URL('../public/Ali-Khalaf-CV.pdf', import.meta.url).pathname,
    format: 'A4',
    printBackground: false,
    preferCSSPageSize: true,
  });
  await browser.close();
  console.log('Wrote public/Ali-Khalaf-CV.pdf');
} finally {
  server.kill();
}
```

- [ ] **Step 5: Add the script and the footer link**

`package.json` scripts: add `"resume:pdf": "node scripts/make-resume-pdf.mjs"`.

In `src/components/Footer.astro` add `<li><a href="/resume/">Resume</a></li>` before the Uses link.

- [ ] **Step 6: Build, generate the PDF and inspect it**

```bash
npm run verify
npm run resume:pdf
ls -l public/Ali-Khalaf-CV.pdf
```
Expected: verify passes; the PDF exists and is non-empty. Read it with the Read tool (`pages: "1-2"`). Expected: one to two A4 pages, no nav, footer or buttons; header shows the real email address (not the spelled-out form), GitHub and LinkedIn; Experience and Education in timeline order; no phone number; no AI-tooling words; no Tanami detail beyond "Software Engineer · Tanami".

- [ ] **Step 7: Rebuild so the PDF is part of `dist`, and commit**

```bash
npm run build && npm run check:dist
git add src scripts package.json public/Ali-Khalaf-CV.pdf
git commit -m "feat: add print-styled resume page and generated PDF"
```

---

### Task 11: Extend Playwright coverage

**Files:**
- Modify: `e2e/layout.spec.ts`

**Interfaces:**
- Consumes: routes added in this phase.

- [ ] **Step 1: Add the new routes to the layout spec**

In `e2e/layout.spec.ts` extend `routes` with:
```ts
  '/journal/',
  '/resume/',
  '/uses/',
  '/404.html',
```
(Journal entry, tag and involvement-journey pages only exist once content does; Task 12 adds their routes when they are published.)

- [ ] **Step 2: Run**

```bash
npm run e2e
```
Expected: all PASS in both projects and both directions. A failure names the route and direction; fix the CSS (for example the timeline grid or `.entries`) with `min-inline-size: 0` or wrapping, then rerun.

- [ ] **Step 3: Commit**

```bash
git add e2e
git commit -m "test: cover journal, resume, uses and 404 layouts"
```

---

### Task 12: Content from the owner (journal seeds, journeys, "now", events)

These tasks need the owner's writing in `~/Documents/notes/Portfolio Stories.md`. For every item: if its section is empty, skip it and say so; never invent a story. Each one follows the story intake rules in Global Constraints and ends with `npm run verify`, `npm run e2e` and a commit after the owner approves the change note.

**Files:** per item below.

- [ ] **Step 1: Journal seed posts (section D, three to five posts)**

For each filled `D<n>`: create `src/content/journal/<date>.md` (the owner's date; if none, today's via `npm run new`):
```markdown
---
date: 2026-10-24
tags: [rust]
project: smobb
---
<edited text>
```
Omit `project` and `tags` values the owner did not give. The first sentence becomes the meta description, so make it a good one. Verify `/journal/`, an entry page and RSS.
Commit: `feat: add journal seed posts`.

- [ ] **Step 2: Project journeys (sections B2 skoobl, B3 smoke-break, then any others)**

Per project: write chapters to `src/content/journeys/<slug>/NN-<kebab-title>.md` (frontmatter `project`, `order`, `title`, optional `date`), then set `journey: true` in the project's entry. Verify `/personal/games/<slug>/journey/` and that "Read the journey" appears.
Commit per project: `feat: publish the <slug> journey`.

- [ ] **Step 3: Involvement journeys (section C)**

Employers and education: edit for discretion (growth story only, no client, product, internal-tool, metric or colleague detail; Tanami stays especially discreet). Write chapters to `src/content/journeys/<timeline-id>/NN-<kebab-title>.md` with `project: <timeline-id>`, then set `journey: true` in `src/content/timeline/<timeline-id>.md`. Verify `/about/<id>/` and the timeline link.
Commit per story: `feat: publish the <id> story`.

- [ ] **Step 4: StartUp Bahrain and the Build Hackathon (sections C8, C9)**

Needs from the owner: the three StartUp Bahrain years and roles, and the Build Hackathon's year, team, role and result. Create one timeline entry per dated event, `kind: event`:
```markdown
---
start: '2025-11'
end: '2025-11'
kind: event
title: Build Hackathon
org: Reboot Coding Institute
summary: <one factual line from the owner>
---
```
If the owner confirms `codeweavers-build-hackathon` is the Build Hackathon repo, also add `src/content/lab/codeweavers-hackathon.md` in the same shape as the other lab entries, and `link: /personal/lab/codeweavers-hackathon/` on the event. Verify the timeline order.
Commit: `feat: add StartUp Bahrain and Build Hackathon to the timeline`.

- [ ] **Step 5: The "now" blurb (section A5)**

Create `src/data/now.ts` with the owner's text:
```ts
export const now = { date: '2026-10-25', text: '<owner text, 80 to 150 words>' };
```
In `src/pages/about.astro` import it and render, after the chapters and before the timeline:
```astro
    <section class="stack" aria-labelledby="now-title">
      <h2 id="now-title">Now</h2>
      <p class="chapter__date">Updated {formatDay(new Date(now.date))}</p>
      <p class="prose">{now.text}</p>
    </section>
```
with `import { formatDay } from '../lib/dates';`.
Commit: `feat: add the now blurb to About`.

- [ ] **Step 6: Add the newly published routes to the layout spec**

In `e2e/layout.spec.ts` add each new route that now exists (a journal entry, a tag page, journeys, `/about/<id>/`). Run `npm run e2e`; commit `test: cover published journal and journey routes`.

---

### Task 13: Phase 2 sign-off

**Files:** none.

- [ ] **Step 1: Full gate from a clean install**

```bash
rm -rf node_modules dist .astro
npm ci
npm run verify
npm run e2e
```
Expected: everything passes.

- [ ] **Step 2: Check against the spec**

Phase 2 items present: journal (date titles, tags, prev/next, RSS, `npm run new`), landing ticker, timeline on Work and About (with seed data and the two credentials only), resume page and PDF, `/uses`, themed 404, devlog on project and journey pages, involvement journeys route, drafts excluded everywhere (try `draft: true` on a throwaway entry and confirm it disappears from pages, tags, RSS and sitemap).

- [ ] **Step 3: Tag**

```bash
git tag phase-2
```

---

## Self-Review (completed)

**Spec coverage (Phase 2 scope):** journal date-titled with filename/URL rules, tag filter, prev/next, RSS, scaffold → Tasks 1-4. Landing ticker → Task 5. Timeline (collection, order rule, seed table, Work and About strips, education via timeline) → Task 6. Involvement journeys and route → Task 7. Devlog series → Task 8. 404 and `/uses` → Task 9. Resume page, print stylesheet, PDF, footer link, contact privacy (PDF holds the public address by owner's choice, no phone) → Task 10. Owner-supplied content (journal seeds, project and involvement journeys, StartUp Bahrain and Build Hackathon events, "now") → Task 12 with the intake workflow. Draft handling verified in Task 13.

**Placeholder scan:** none; Task 12 items state prerequisites and exact files.

**Type consistency:** `formatDay`, `excerpt`, `firstSentence`, `newestFirst`, `neighbors`, `tagsOf`, `tagSlug`, `postFilename`, `forProject`, `toDevlog`, `DevlogItem`, `monthLabel`, `periodLabel`, `sortTimeline`, `nextStory`, `storyPaths`, `JourneyView` props (`devlog`), `Devlog` props (`items`) are used with identical names and signatures across tasks and match Phase 1's `published`, `journeyChapters`, `JourneyRef`.
