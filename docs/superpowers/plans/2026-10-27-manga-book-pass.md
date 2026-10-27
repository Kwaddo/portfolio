# Manga Book Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portfolio read as a printed manga volume: book chrome, art-first panels, varied SFX lettering, plus three visual bug fixes.

**Architecture:** Extend the existing Astro components (`Sfx`, `Spread`, `ProjectCard`, `FigurePanel`, `CopyEmail`, `StatusBadge`) and the split stylesheets in `src/styles/`. Page numbers come from a CSS counter, chapter numbers from `nav` order. No new dependency, font or framework.

**Tech Stack:** Astro 7.4.2 (static), plain CSS, inline SVG, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-27-manga-book-pass-design.md`

## Global Constraints

- Node: `export PATH="$HOME/.local/share/fnm/node-versions/v22.23.4/installation/bin:$PATH"` before any npm command (default Node is too old).
- No new runtime or dev dependency, no new font, no framework.
- Decorative words allowed: existing `WORK PLAY LAB LOG HELLO HUH? KWADDO` plus `PSST`, `COPIED!`, `TO BE CONTINUED`, `VOL. 01`, `CONTENTS`, `CH. 0N`, `CHAPTER 0N`, `AK <year>`. Nothing else new in visible copy. All decorative elements `aria-hidden`.
- English SFX only. Paper `#fafafa` / ink `#0a0a0a` / tone tokens only, no accent colour.
- Logical CSS properties; RTL mirrors every offset, arrow and shadow. No horizontal scroll at 360 px.
- Text contrast 4.5:1: text never on art or tone, only on solid paper or ink.
- Reduced motion: no transforms on hover, no animations.
- Landing under 200 KB transferred; Lighthouse performance and accessibility at or above 0.95.
- Content rules: no AI-tool names, no phone digits, no plain email in HTML, "Kwaddo" only in URLs and the approved hero word. No `Co-Authored-By` trailers in commits.
- Before each commit: `grep -rniE "claude|anthropic|openai|chatgpt|copilot|@gmail\.com" src e2e tests scripts` returns nothing new (the email lives split in `site.emailParts`).
- Each task ends with `npm run verify` and `npx playwright test --project=desktop --project=phone` green, then a commit on branch `phase-5`. The full matrix (`npm run e2e`) runs in Task 7.

## File map

| File | Change |
|---|---|
| `src/lib/sfx.ts` | new: `SfxWord`, `SfxLook` types |
| `src/lib/nav.ts` | add `chapterOf()` |
| `src/components/Sfx.astro` | `look` prop, word union from `sfx.ts` |
| `src/components/Spread.astro` | `sfxLook` prop |
| `src/components/FigurePanel.astro` | SFX moves above the figure; `look` prop; default slot |
| `src/components/Kicker.astro` | new: chapter kicker |
| `src/components/ProjectCard.astro` | art-first markup, title-card |
| `src/components/StatusBadge.astro` | sparkle on live/released |
| `src/components/CopyEmail.astro` | `COPIED!` pop |
| `src/components/WorkWithMe.astro`, `ProjectPage.astro`, `JourneyView.astro`, `Footer.astro` | words, looks, TO BE CONTINUED, colophon |
| `src/pages/index.astro`, `work/index.astro`, `personal/index.astro`, `journal/index.astro`, `about.astro`, `contact.astro`, `404.astro`, `work/[slug].astro` | kickers, cover frame, looks, chapter title cards, sweat drop |
| `src/styles/type.css` | SFX looks, kicker |
| `src/styles/landing.css` | hero word selectors, cover frame, contents label |
| `src/styles/panels.css` | folios, art-first cards, title-card, reduced-motion hover |
| `src/styles/media.css` | TO BE CONTINUED tag |
| `src/styles/art.css` | timeline word clearance |
| `src/styles/components.css` | About chapter title card, badge sparkle, copy pop, sweat drop |
| `tests/nav.test.ts` | `chapterOf` tests |
| `e2e/book.spec.ts` | new: every check for this pass |
| `lighthouserc.json` | add `/personal/` and `/work/` |

---

### Task 1: Fixes (hero word over figure, PSST, timeline word clearance)

**Files:**
- Create: `src/lib/sfx.ts`, `e2e/book.spec.ts`
- Modify: `src/components/Sfx.astro`, `src/components/Spread.astro`, `src/components/FigurePanel.astro`, `src/components/WorkWithMe.astro`, `src/styles/landing.css`, `src/styles/art.css`

**Interfaces:**
- Produces: `SfxWord` and `SfxLook` types in `src/lib/sfx.ts`; `e2e/book.spec.ts` with `test.use({ reducedMotion: 'reduce' })` at the top and a `desktopOnly(testInfo)` helper later tasks reuse; the hero word is now `.hero__end-cell > .sfx` (not inside `.hero__end`).

- [ ] **Step 1: Write the failing tests** — create `e2e/book.spec.ts`:

```ts
import { expect, test, type TestInfo } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

const desktopOnly = (testInfo: TestInfo) => test.skip(testInfo.project.name !== 'desktop', 'desktop project only');

for (const figure of ['a', 'b'] as const) {
  test(`the hero word is lettered over figure ${figure}`, async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.addInitScript((f) => {
      sessionStorage.setItem('figure', f);
      sessionStorage.setItem('hero', '1');
    }, figure);
    for (const width of [1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator('.hero__figure img').waitFor();
      // the figure layer ignores the pointer; let hit-testing see every layer of the cell
      await page.addStyleTag({ content: '.hero__end-cell * { pointer-events: auto !important; }' });
      const onTop = await page.evaluate(() => {
        const span = document.querySelector('.hero__end-cell > .sfx > span');
        const text = span?.firstChild;
        if (!text?.textContent) return 'no word above the figure';
        const range = document.createRange();
        range.setStart(text, text.textContent.length - 1);
        range.setEnd(text, text.textContent.length);
        const r = range.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit?.closest('.sfx') ? 'ok' : `covered by ${hit?.tagName}`;
      });
      expect(onTop, `${width}px`).toBe('ok');
    }
  });
}

test('the Say Hello panel says PSST, and HUH? is left to the 404 page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.wwm .sfx')).toHaveText('PSST');
  await expect(page.locator('main .sfx', { hasText: 'HUH?' })).toHaveCount(0);
});

test('the work timeline word clears every entry', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/work/');
  const hits = await page.evaluate(() => {
    // the visible word: its lettering box cut to the clipping box around it
    const sfx = document.querySelector('.spread--ink > .sfx')!;
    const a = sfx.getBoundingClientRect();
    const b = sfx.querySelector('span')!.getBoundingClientRect();
    const word = { left: Math.max(a.left, b.left), right: Math.min(a.right, b.right), top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom) };
    return [...document.querySelectorAll('.spread--ink .timeline__item')].filter((li) => {
      const r = li.getBoundingClientRect();
      return r.left < word.right && r.right > word.left && r.top < word.bottom && r.bottom > word.top;
    }).length;
  });
  expect(hits).toBe(0);
});
```

- [ ] **Step 2: Run, expect 3 failures** (hero: "no word above the figure"; PSST: got `HUH?`; timeline: hits > 0)

Run: `npx playwright test e2e/book.spec.ts --project=desktop`

- [ ] **Step 3: Types** — create `src/lib/sfx.ts`:

```ts
/** Decorative words an Sfx may letter (owner-approved list; adding one is a content decision). */
export type SfxWord = 'WORK' | 'PLAY' | 'LAB' | 'LOG' | 'HELLO' | 'NEXT' | 'HUH?' | 'KWADDO' | 'PSST' | 'COPIED!';
/** Lettering treatments: outline is the default stroked word. */
export type SfxLook = 'outline' | 'rough' | 'motion' | 'burst';
```

In `src/components/Sfx.astro` replace the `word` line of `Props` with `word: SfxWord;` and add `import type { SfxWord } from '../lib/sfx';` at the top of the frontmatter. In `src/components/Spread.astro` do the same for `sfx?: SfxWord;`. In `src/components/FigurePanel.astro` change `word: 'KWADDO' | 'HELLO' | 'HUH?';` to `word: SfxWord;` with the same import.

- [ ] **Step 4: Hero word over the figure** — in `src/components/FigurePanel.astro` move `<Sfx word={word} rotate={rotate} paper />` out of the `<Panel>` and place it after the closing `</div>` of `.hero__figure` (last child of `.hero__end-cell`). The panel isolates its stacking context, so the word must be a sibling of the figure to sit above it. Then repoint the selectors and lift the word:

```bash
sed -i '' -e "s/\.hero__end-cell:has(img\[data-figure='b'\]) > \.hero__end > \.sfx/.hero__end-cell:has(img[data-figure='b']) > .sfx/g" -e 's/\.hero__end > \.sfx/.hero__end-cell > .sfx/g' src/styles/landing.css
grep -n "hero__end > .sfx" src/styles/*.css   # expect nothing
```

Append to the hero section of `src/styles/landing.css` (after the `.hero__figure img` rules):

```css
/* the word is lettered over the figure, as manga SFX overlap a character; clipped to the panel's box like before */
.hero__end-cell > .sfx {
  z-index: 3;
}
```

The `.sfx` is absolutely positioned against `.hero__end-cell` (already `position: relative`, same box as the panel), so its clip box is unchanged.

- [ ] **Step 5: PSST** — in `src/components/WorkWithMe.astro` change `<Sfx word="HUH?" rotate="-8deg" paper />` to `<Sfx word="PSST" rotate="-8deg" paper />`. Rename nothing else; `.wwm__ink > .sfx` styles keep applying.

- [ ] **Step 6: Timeline word clearance** — in `src/styles/art.css` after the `.stack > h2 + .spread--ink:has(> .sfx)` rule add:

```css
/* the peeking word hangs over the black page's top band; at desktop the first row starts below it */
@media (min-width: 48rem) {
  .stack > h2 + .spread--ink:has(> .sfx) {
    padding-block-start: calc(var(--ink-pad) + 4.5rem);
  }
}
```

Run the timeline test; if it still overlaps, raise `4.5rem` in 0.5rem steps until it passes, then screenshot `/work/` at 1280 to check the band does not look empty (the word fills it).

- [ ] **Step 7: Run tests, expect pass**

Run: `npx playwright test e2e/book.spec.ts --project=desktop --project=phone`

- [ ] **Step 8: Visual check** — screenshot `/`, `/about/`, `/404.html` at 1280 and 390 with each figure (set `sessionStorage.figure`). The word must read fully on all three pages; the figure's face must not be covered. If HELLO on About covers the face, lower that word with a page-scoped `inset-block-start` in `landing.css` under `.hero__end-cell--inset > .sfx`.

- [ ] **Step 9: Verify and commit**

```bash
npm run verify && npx playwright test --project=desktop --project=phone
git add -A src e2e && git commit -m "fix: hero word sits over the figure, PSST says hello, timeline word clears the entries"
```

---

### Task 2: SFX looks

**Files:**
- Modify: `src/components/Sfx.astro`, `src/components/Spread.astro`, `src/components/FigurePanel.astro`, `src/styles/type.css`, call sites (`WorkWithMe.astro`, `ProjectPage.astro`, `JourneyView.astro`, `pages/personal/index.astro`, `pages/journal/index.astro`, `pages/work/[slug].astro`, `pages/404.astro`), `e2e/book.spec.ts`

**Interfaces:**
- Consumes: `SfxLook` from Task 1.
- Produces: `<Sfx look="outline|rough|motion|burst">` rendering class `sfx--rough|sfx--motion|sfx--burst` (none for outline); `<Spread sfxLook=…>`; `<FigurePanel look=…>`.

- [ ] **Step 1: Failing test** — append to `e2e/book.spec.ts`:

```ts
test('SFX letter in more than one look', async ({ page }) => {
  await page.goto('/personal/');
  await expect(page.locator('.sfx.sfx--rough')).toHaveCount(1);
  await expect(page.locator('.sfx.sfx--motion')).toHaveCount(1);
  await page.goto('/');
  await expect(page.locator('.wwm .sfx.sfx--burst')).toHaveCount(1);
  await page.goto('/404.html');
  await expect(page.locator('.sfx.sfx--rough')).toHaveCount(1);
});
```

- [ ] **Step 2: Run, expect FAIL** (`toHaveCount(1)` got 0). Run: `npx playwright test e2e/book.spec.ts -g "more than one look" --project=desktop`

- [ ] **Step 3: Component props** — `src/components/Sfx.astro` becomes:

```astro
---
import type { SfxLook, SfxWord } from '../lib/sfx';

interface Props {
  word: SfxWord;
  rotate?: string;
  paper?: boolean;
  look?: SfxLook;
}
const { word, rotate = '-6deg', paper = false, look = 'outline' } = Astro.props;
---
<span class:list={['sfx', paper && 'sfx--paper', look !== 'outline' && `sfx--${look}`]} aria-hidden="true" style={`--sfx-rotate: ${rotate}`}><span>{word}</span></span>
```

`Spread.astro`: add `sfxLook?: SfxLook;` to Props, destructure `sfxLook`, render `<Sfx word={sfx} paper={sfxPaper || ink} look={sfxLook} />`. `FigurePanel.astro`: add `look?: SfxLook;`, destructure, pass `look={look}` to its `<Sfx>`.

- [ ] **Step 4: CSS** — append to `src/styles/type.css` after the `.sfx` rules:

```css
/* ---------- SFX looks (outline is the default above) ---------- */
/* rough: the inked-edge filter on the glyphs, desktop only like every SVG filter here */
@media (min-width: 48rem) {
  .sfx--rough > span {
    filter: url(#ink) drop-shadow(0.04em 0.04em 0 var(--sfx-stroke));
  }
  [dir='rtl'] .sfx--rough > span {
    filter: url(#ink) drop-shadow(-0.04em 0.04em 0 var(--sfx-stroke));
  }
}
/* motion: fading ghosts trail the word against the reading direction */
.sfx--motion > span {
  text-shadow:
    -0.08em 0.02em 0 color-mix(in srgb, var(--sfx-stroke) 45%, transparent),
    -0.16em 0.04em 0 color-mix(in srgb, var(--sfx-stroke) 25%, transparent),
    -0.24em 0.06em 0 color-mix(in srgb, var(--sfx-stroke) 12%, transparent);
}
[dir='rtl'] .sfx--motion > span {
  text-shadow:
    0.08em 0.02em 0 color-mix(in srgb, var(--sfx-stroke) 45%, transparent),
    0.16em 0.04em 0 color-mix(in srgb, var(--sfx-stroke) 25%, transparent),
    0.24em 0.06em 0 color-mix(in srgb, var(--sfx-stroke) 12%, transparent);
}
/* burst: the word on a sixteen-spike starburst; the stroke colour becomes the field, the fill colour the letters */
.sfx--burst > span {
  padding: 0.45em 0.85em;
  background: var(--sfx-stroke);
  color: var(--sfx-fill);
  -webkit-text-stroke: 0;
  filter: none;
  clip-path: polygon(50% 0%, 57% 13%, 69% 4%, 71% 18%, 85% 15%, 82% 29%, 96% 31%, 87% 43%, 100% 50%, 87% 57%, 96% 69%, 82% 71%, 85% 85%, 71% 82%, 69% 96%, 57% 87%, 50% 100%, 43% 87%, 31% 96%, 29% 82%, 15% 85%, 18% 71%, 4% 69%, 13% 57%, 0% 50%, 13% 43%, 4% 31%, 18% 29%, 15% 15%, 29% 18%, 31% 4%, 43% 13%);
}
@media (min-width: 48rem) {
  .sfx--burst > span,
  [dir='rtl'] .sfx--burst > span {
    filter: none;
  }
}
```

- [ ] **Step 5: Assign looks** (no page repeats a look back to back):
  - `WorkWithMe.astro`: `<Sfx word="PSST" rotate="-8deg" paper look="burst" />`
  - `pages/personal/index.astro`: games spread `sfxLook="rough"`, lab spread `sfxLook="motion"`
  - `ProjectPage.astro` line with `word={kind === 'games' ? 'PLAY' : 'LAB'}`: add `look="motion"`
  - `pages/work/[slug].astro` `<Sfx word="WORK" …>`: add `look="motion"`
  - `JourneyView.astro` `<Sfx word="LOG" …>` and `pages/journal/index.astro` `<Sfx word="LOG" …>`: add `look="rough"`
  - `pages/404.astro`: `<FigurePanel word="HUH?" rotate="-8deg" inset look="rough" />`
  - Hero `KWADDO`, About `HELLO`, work timeline `WORK`: stay outline.

- [ ] **Step 6: Run test, expect PASS.** Then screenshot `/`, `/personal/`, `/personal/games/skoobl/`, `/404.html` at 1280 and 390. Check the burst's spikes do not clip letters (raise the `padding` if they do) and the motion ghosts stay inside the word's clip box.

- [ ] **Step 7: Verify and commit**

```bash
npm run verify && npx playwright test --project=desktop --project=phone
git add -A src e2e && git commit -m "feat: SFX letter in four looks: outline, rough, motion, burst"
```

---

### Task 3: Chapter kickers and the contents label

**Files:**
- Create: `src/components/Kicker.astro`
- Modify: `src/lib/nav.ts`, `tests/nav.test.ts`, `src/pages/{work/index,personal/index,journal/index,about,contact,index}.astro`, `src/styles/type.css`, `src/styles/landing.css`, `e2e/book.spec.ts`

**Interfaces:**
- Produces: `chapterOf(pathname: string): number | undefined`; `<Kicker href?: string short?: boolean class?: string />` rendering `<p class="kicker" aria-hidden="true">Chapter 01</p>` (or `Ch. 01` when `short`), nothing for non-chapter paths.

- [ ] **Step 1: Failing unit test** — append inside `describe('nav', …)` in `tests/nav.test.ts` and add `chapterOf` to the import:

```ts
  test('numbers each primary page as a chapter, in nav order', () => {
    expect(chapterOf('/work/')).toBe(1);
    expect(chapterOf('/contact/')).toBe(5);
  });
  test('other pages are not chapters', () => {
    expect(chapterOf('/')).toBeUndefined();
    expect(chapterOf('/work/tanami/')).toBeUndefined();
  });
```

- [ ] **Step 2: Run, expect FAIL** (`chapterOf` is not exported). Run: `npx vitest run tests/nav.test.ts`

- [ ] **Step 3: Implement** — append to `src/lib/nav.ts`:

```ts
/** A primary page's chapter number: its place in the nav, from 1. Any other path is not a chapter. */
export const chapterOf = (pathname: string): number | undefined => {
  const i = nav.findIndex((n) => n.href === pathname);
  return i === -1 ? undefined : i + 1;
};
```

Run the unit test: PASS.

- [ ] **Step 4: Failing e2e** — append to `e2e/book.spec.ts`:

```ts
test('section pages open as numbered chapters', async ({ page }) => {
  for (const [route, label] of [['/work/', 'Chapter 01'], ['/personal/', 'Chapter 02'], ['/journal/', 'Chapter 03'], ['/about/', 'Chapter 04'], ['/contact/', 'Chapter 05']] as const) {
    await page.goto(route);
    await expect(page.locator('main .kicker').first(), route).toHaveText(label);
  }
});

test('the landing doors read as a contents page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.split__contents')).toHaveText('Contents');
  await expect(page.locator('.split__door--work .kicker')).toHaveText('Ch. 01');
  await expect(page.locator('.split__door--personal .kicker')).toHaveText('Ch. 02');
});
```

Run: FAIL (no `.kicker`).

- [ ] **Step 5: Component** — create `src/components/Kicker.astro`:

```astro
---
// Decorative chapter number above a primary page's title, numbered from the nav so it never drifts from the menu.
import { chapterOf } from '../lib/nav';

interface Props {
  href?: string;
  short?: boolean;
  class?: string;
}
const { href = Astro.url.pathname, short = false, class: cls } = Astro.props;
const n = chapterOf(href);
---
{n && <p class:list={['kicker', cls]} aria-hidden="true">{short ? 'Ch.' : 'Chapter'} {String(n).padStart(2, '0')}</p>}
```

- [ ] **Step 6: Place it** — `import Kicker from '../components/Kicker.astro';` (adjust depth) and put `<Kicker />` directly before the `<h1>` in `work/index.astro`, `personal/index.astro`, `journal/index.astro` (after the `<Sfx>`), `about.astro` (inside `.page-head__text`), `contact.astro`. In `index.astro` put `<Kicker href="/work/" short />` before `<h2>Work</h2>`, `<Kicker href="/personal/" short />` before `<h2>Personal</h2>`, and as the first child of `section.split`: `<span class="split__contents" aria-hidden="true">Contents</span>`.

- [ ] **Step 7: CSS** — append to `src/styles/type.css`:

```css
/* ---------- chapter kicker: the small numbered line over a chapter's title ---------- */
.kicker {
  font: 400 clamp(0.85rem, 1.4vw, 1rem) / 1 var(--font-display);
  letter-spacing: 0.3em;
  text-transform: uppercase;
}
.kicker + h1 {
  margin-block-start: 0.35rem;
}
```

Append to `src/styles/landing.css` after the `.split__door` rules:

```css
/* the doors are the volume's contents: one inked label on the seam */
.split {
  position: relative;
}
.split__contents {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 50%;
  z-index: 3;
  translate: -50% -50%;
  padding: 0.35rem 0.9rem;
  border: 2px solid var(--paper);
  background: var(--ink);
  color: var(--paper);
  font: 400 0.9rem/1 var(--font-display);
  letter-spacing: 0.3em;
  text-transform: uppercase;
}
[dir='rtl'] .split__contents {
  translate: 50% -50%;
}
```

If `.split__door > :not(…)` (landing.css ~line 176) positions the kicker oddly, add `.kicker` to the flow children there; the kicker should sit right above the door heading.

- [ ] **Step 8: Run e2e and unit tests, expect PASS.** Screenshot `/` and `/work/` at 1280 and 390: the CONTENTS label must sit on the line between the hero and the doors, not over the door headings.

- [ ] **Step 9: Verify and commit**

```bash
npm run verify && npx playwright test --project=desktop --project=phone
git add -A src tests e2e && git commit -m "feat: section pages open as numbered chapters, doors as contents"
```

---

### Task 4: Landing cover frame and colophon

**Files:**
- Modify: `src/pages/index.astro`, `src/components/Footer.astro`, `src/styles/landing.css`, `e2e/book.spec.ts`

**Interfaces:**
- Produces: `.cover__spine`, `.cover__vol`, `.cover__stamp` elements on `/`; footer line `© <year> Ali Khalaf · Vol. 01`.

- [ ] **Step 1: Failing e2e** — append:

```ts
test('the landing is framed as a volume cover', async ({ page }, testInfo) => {
  const year = String(new Date().getFullYear());
  await page.goto('/');
  await expect(page.locator('.cover__vol')).toHaveText('Vol. 01');
  await expect(page.locator('.cover__stamp')).toContainText('AK');
  await expect(page.locator('.cover__stamp')).toContainText(year);
  await expect(page.locator('.cover__spine')).toBeVisible({ visible: testInfo.project.name === 'desktop' });
  await expect(page.locator('footer')).toContainText(`${year} Ali Khalaf · Vol. 01`);
});
```

Run: FAIL.

- [ ] **Step 2: Markup** — in `src/pages/index.astro` add `const year = new Date().getFullYear();` to the frontmatter and change the hero:

```astro
  <Spread layout="stack" class="hero wrap">
    <span class="cover__spine" aria-hidden="true">{site.name} · Vol. 01</span>
    <Panel weight={5} shadow class="hero__start">
      <span class="cover__vol" aria-hidden="true">Vol. 01</span>
      <Bubble shape="shout" class="hero__bubble">
        <h1>{site.name}</h1>
        <p class="hero__role">{site.role}</p>
      </Bubble>
      <Bubble shape="caption" as="div" class="hero__avail">{site.availability}</Bubble>
      <span class="cover__stamp" aria-hidden="true"><b>AK</b>{year}</span>
    </Panel>
    <FigurePanel word="KWADDO" rotate="-8deg" />
  </Spread>
```

In `src/components/Footer.astro` change `<p>&copy; {year} {site.name}</p>` to `<p>&copy; {year} {site.name} · Vol. 01</p>`.

- [ ] **Step 3: CSS** — append to the hero section of `src/styles/landing.css`:

```css
/* ---------- cover frame: volume badge, spine on the start gutter, publisher-style stamp ---------- */
.cover__vol {
  position: absolute;
  inset-block-start: -0.9rem;
  inset-inline-start: clamp(1rem, 3vw, 2rem);
  z-index: 2;
  padding: 0.3rem 0.7rem;
  background: var(--ink);
  color: var(--paper);
  font: 400 clamp(0.85rem, 1.4vw, 1.05rem) / 1 var(--font-display);
  letter-spacing: 0.25em;
  text-transform: uppercase;
}
.cover__stamp {
  position: absolute;
  inset-block-end: -1rem;
  inset-inline-end: 0.5rem;
  z-index: 3;
  display: grid;
  place-content: center;
  inline-size: 4.25rem;
  aspect-ratio: 1;
  border: 3px double var(--ink);
  border-radius: 50%;
  background: var(--paper);
  font: 400 0.75rem/1 var(--font-display);
  letter-spacing: 0.15em;
  text-align: center;
  rotate: -12deg;
}
.cover__stamp b {
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 0.05em;
}
[dir='rtl'] .cover__stamp {
  rotate: 12deg;
}
.cover__spine {
  display: none;
}
@media (min-width: 48rem) {
  .cover__stamp {
    inset-inline-end: -1rem;
  }
  /* the spine runs down the start gutter beside the panels, like the edge of a tankobon */
  .cover__spine {
    position: absolute;
    inset-block: 2rem 1rem; /* the hero's own block padding */
    inset-inline-start: 0;
    display: grid;
    place-items: center;
    inline-size: calc(var(--gutter) - 0.25rem);
    background: var(--ink);
    color: var(--paper);
    writing-mode: vertical-rl;
    font: 400 0.7rem/1 var(--font-display);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
  }
}
```

- [ ] **Step 4: Run e2e, expect PASS.** Screenshot `/` at 1024, 1280, 390 and in RTL (`document.documentElement.dir = 'rtl'`). Check: stamp clear of the bubble tail and the availability caption; badge clear of the shout bubble outline; spine text readable and not crossing the panels; the layout spec's "nothing passes the wrap's edges" still green (`npx playwright test e2e/layout.spec.ts -g "^/ fits"`).

- [ ] **Step 5: Verify and commit**

```bash
npm run verify && npx playwright test --project=desktop --project=phone
git add -A src e2e && git commit -m "feat: the landing wears a volume cover frame"
```

---

### Task 5: Page numbers and TO BE CONTINUED

**Files:**
- Modify: `src/styles/panels.css`, `src/styles/media.css`, `src/styles/print.css`, `src/components/ProjectPage.astro`, `src/components/JourneyView.astro`, `src/lib/sfx.ts`, `e2e/book.spec.ts`

**Interfaces:**
- Produces: every `.spread` shows `::after` page number from counter `folio`, reset per `main`; `.next-panel > .tbc` arrow tag; `NEXT` removed from `SfxWord`.

- [ ] **Step 1: Failing e2e** — append:

```ts
test('every spread carries a page number', async ({ page }) => {
  for (const route of ['/', '/work/', '/personal/', '/personal/games/skoobl/']) {
    await page.goto(route);
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll('main .spread')].filter((el) => !getComputedStyle(el, '::after').content.includes('counter(folio')).length,
    );
    expect(missing, route).toBe(0);
  }
});

test('the next panel reads TO BE CONTINUED', async ({ page }) => {
  await page.goto('/personal/games/skoobl/');
  const next = page.locator('a.next-panel');
  await expect(next.locator('.tbc')).toHaveText('To be continued');
  await expect(next.locator('.sfx')).toHaveCount(0);
  await expect(next).toContainText('Smoke Break');
});
```

Run: FAIL.

- [ ] **Step 2: Page numbers** — append to `src/styles/panels.css`:

```css
/* ---------- page numbers: each spread is a page; its number hangs on the bottom outer corner.
   The empty alternative text keeps it out of the accessibility tree; a browser without that syntax drops the rule and shows none. */
main {
  counter-reset: folio;
}
.spread {
  counter-increment: folio;
}
.spread::after {
  content: counter(folio, decimal-leading-zero) / '';
  position: absolute;
  inset-block-end: -0.7rem;
  inset-inline-end: 0.5rem;
  z-index: 4;
  padding: 0.15rem 0.45rem;
  border: 2px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  font: 400 0.75rem/1 var(--font-display);
  letter-spacing: 0.15em;
  pointer-events: none;
}
.spread--ink::after {
  border-color: var(--paper);
  background: var(--ink);
  color: var(--paper);
}
```

Add inside the existing print block of `src/styles/print.css`: `.spread::after { content: none; }`.

- [ ] **Step 3: TO BE CONTINUED** — in `ProjectPage.astro` and `JourneyView.astro` replace `<Sfx word="NEXT" rotate="-3deg" />` with `<span class="tbc" aria-hidden="true">To be continued</span>`. Remove the now-unused `Sfx` import from `JourneyView.astro` only if `LOG` no longer uses it (it does, keep it). Remove `'NEXT' |` from `SfxWord` in `src/lib/sfx.ts`. In `src/styles/media.css` replace the `.next-panel > .sfx` block and its hover block (the rules under the comment "the NEXT word sits on the end side…") with:

```css
/* the arrow tag: a pointed ink box on the end side reading TO BE CONTINUED, like the last panel of a chapter */
.tbc {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: clamp(0.75rem, 3vw, 2rem);
  z-index: 1;
  translate: 0 -50%;
  padding: 0.6rem 2.6rem 0.6rem 1.2rem;
  background: var(--ink);
  color: var(--paper);
  font: 400 clamp(1rem, 2.6vw, 1.75rem) / 1 var(--font-display);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
  clip-path: polygon(0 0, calc(100% - 1.6rem) 0, 100% 50%, calc(100% - 1.6rem) 100%, 0 100%, 0.6rem 50%);
}
[dir='rtl'] .tbc {
  padding: 0.6rem 1.2rem 0.6rem 2.6rem;
  clip-path: polygon(1.6rem 0, 100% 0, calc(100% - 0.6rem) 50%, 100% 100%, 1.6rem 100%, 0 50%);
}
a.next-panel:hover > .tbc,
a.next-panel:focus-visible > .tbc {
  background: var(--paper);
  color: var(--ink);
}
/* phones: the tag drops under the title box instead of covering it */
@media (max-width: 47.99rem) {
  .tbc {
    position: relative;
    inset: auto;
    translate: none;
    display: block;
    inline-size: fit-content;
    order: 2;
    margin: 0 0.75rem 0.75rem auto;
  }
  [dir='rtl'] .tbc {
    margin: 0 auto 0.75rem 0.75rem;
  }
}
```

If `.next-panel` is not a flex/grid container at phone width, `order` is inert; then move the `<span class="tbc">` after `.panel__body` in both components instead (it is absolutely positioned at desktop, so DOM order does not matter there).

- [ ] **Step 4: Run e2e, expect PASS.** Screenshot `/`, `/personal/`, `/personal/games/skoobl/` at 1280 and 390: page numbers sit on each spread's bottom outer corner without covering a panel caption or the next spread's heading; the arrow tag never overlaps the "Next game" box at 768 to 1024.

- [ ] **Step 5: Verify and commit**

```bash
npm run verify && npx playwright test --project=desktop --project=phone
git add -A src e2e && git commit -m "feat: spreads carry page numbers, next panels read to be continued"
```

---

### Task 6: Art-first cards, title-cards, About chapter title cards

**Files:**
- Modify: `src/components/ProjectCard.astro`, `src/styles/panels.css`, `src/pages/about.astro`, `src/styles/components.css`, `lighthouserc.json`, `e2e/book.spec.ts`

**Interfaces:**
- Produces: card markup `.panel.card > .panel__media(.panel__titlecard)? + .panel__body > .panel__cap(.panel__caps?, .panel__title) + .panel__meta? + .panel__text + .panel__more`; `.panel__initial`/`.panel__letter` no longer exist.

- [ ] **Step 1: Failing e2e** — append:

```ts
test('cards are art first: no letter fillers, a caption box on every card', async ({ page }) => {
  for (const route of ['/work/', '/personal/']) {
    await page.goto(route);
    await expect(page.locator('.panel__initial'), route).toHaveCount(0);
    const cards = await page.locator('a.panel.card').count();
    expect(cards, route).toBeGreaterThan(0);
    await expect(page.locator('a.panel.card .panel__cap'), route).toHaveCount(cards);
  }
  await page.goto('/work/');
  await expect(page.locator('.panel__titlecard .panel__word', { hasText: 'Tanami' })).toHaveCount(1);
});

test.describe('hover under reduced motion', () => {
  test('a card inverts but does not move or zoom', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto('/personal/');
    const card = page.locator('a.panel.card').filter({ has: page.locator('.panel__media img') }).first();
    await card.hover();
    await page.waitForTimeout(400);
    const moved = await card.evaluate((el) => {
      const img = el.querySelector('.panel__media img')!;
      return [getComputedStyle(el).translate, getComputedStyle(img).scale];
    });
    expect(moved).toEqual(['none', 'none']);
  });
});

test('About chapters carry a title card, not an empty box', async ({ page }) => {
  await page.goto('/about/');
  const sides = await page.locator('.chapter__side').count();
  await expect(page.locator('.chapter__side > .speed')).toHaveCount(sides);
});
```

Run: FAIL.

- [ ] **Step 2: Card markup** — in `src/components/ProjectCard.astro` replace everything from `<Panel` to `</Panel>` with:

```astro
<Panel href={href} tilt={tilt} index={index} fill={fill} burst={false} shadow class="card">
  {
    cover ? (
      <div class:list={['panel__media', wide && 'panel__media--wide', tall && 'panel__media--tall']}>
        <span class="tone-coarse" aria-hidden="true"></span>
        <span class="speed" aria-hidden="true"></span>
        <Image src={cover} alt={coverAlt ?? ''} widths={[400, 800]} sizes="(min-width: 48rem) 33vw, 100vw" />
      </div>
    ) : (
      <div class="panel__media panel__titlecard" aria-hidden="true">
        <span class={confidential ? 'hatch' : 'tone-coarse'}></span>
        <span class="speed"></span>
        <span class="panel__word">{title}</span>
      </div>
    )
  }
  <div class="panel__body">
    <div class="panel__cap">
      {(status || confidential) && (
        <div class="panel__caps">
          {status && <StatusBadge status={status} />}
          {confidential && <Bubble shape="caption" as="span">Confidential</Bubble>}
        </div>
      )}
      <Tag class="panel__title">{title}</Tag>
    </div>
    {meta && <p class="panel__meta">{meta}</p>}
    <p class="panel__text">{summary}</p>
    <span class="panel__more" aria-hidden="true">Read more</span>
  </div>
</Panel>
```

Delete the now-unused `const letter = …` line.

- [ ] **Step 3: Rename the filler rules into title-card rules**

```bash
sed -i '' -e 's/panel__initial/panel__titlecard/g' -e 's/panel__letter/panel__word/g' src/styles/panels.css
grep -rn "panel__initial\|panel__letter" src e2e tests   # expect nothing
```

Then in `src/styles/panels.css` replace the `.panel__titlecard` and `.panel__word` base rules (formerly `.panel__initial`/`.panel__letter`, ~lines 185-197) with:

```css
.panel__titlecard {
  display: grid;
  place-items: center;
  container-type: inline-size;
  background: var(--paper);
}
/* the name itself is the panel's art: huge, skewed, stroked, sized to the panel's width so long names stay whole */
.panel__word {
  position: relative;
  z-index: 1;
  max-inline-size: 92%;
  padding-block-end: 2.75rem; /* clear of the caption box laid over the foot */
  font: 400 clamp(2.25rem, 15cqi, 8rem) / 0.86 var(--font-display);
  text-align: center;
  text-transform: uppercase;
  color: var(--paper);
  -webkit-text-stroke: 3px var(--ink);
  paint-order: stroke fill;
  rotate: -4deg;
  filter: drop-shadow(0.05em 0.05em 0 var(--ink));
}
[dir='rtl'] .panel__word {
  rotate: 4deg;
  filter: drop-shadow(-0.05em 0.05em 0 var(--ink));
}
```

In the hover rule renamed from `a.panel:hover .panel__letter` change its body to `-webkit-text-stroke-color: var(--paper); color: var(--ink); filter: drop-shadow(0.05em 0.05em 0 var(--paper));`. In the reduced-motion/transition block rename `-webkit-text-stroke-color` transition target stays as is.

- [ ] **Step 4: Caption box over the art** — append to `src/styles/panels.css`:

```css
/* ---------- art-first cards: the art fills the panel; badge and title sit in a paper caption box over the art's foot ---------- */
.card > .panel__body {
  margin-block-start: -3.25rem;
}
.panel__cap {
  justify-self: start;
  display: grid;
  gap: 0.4rem;
  max-inline-size: 100%;
  padding: 0.6rem 0.85rem 0.7rem;
  border: 3px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  box-shadow: 4px 4px 0 var(--ink);
}
[dir='rtl'] .panel__cap {
  box-shadow: -4px 4px 0 var(--ink);
}
/* on hover the card goes to ink around a caption box that stays paper, edged in paper so it still reads as a box */
a.card:hover .panel__cap,
a.card:focus-visible .panel__cap {
  box-shadow: 4px 4px 0 var(--paper);
}
[dir='rtl'] a.card:hover .panel__cap,
[dir='rtl'] a.card:focus-visible .panel__cap {
  box-shadow: -4px 4px 0 var(--paper);
}
/* phones: enough art above the box that it never covers more than about half */
@media (max-width: 35.99rem) {
  .card > .panel__media {
    min-block-size: 11rem;
  }
}
/* impact frame: the art pushes in a touch more; none of it moves under reduced motion */
a.card:hover .panel__media img,
a.card:focus-visible .panel__media img {
  scale: 1.04;
}
@media (prefers-reduced-motion: reduce) {
  a.panel:hover,
  a.panel:focus-visible {
    translate: none;
  }
  a.panel:hover .panel__media img,
  a.panel:focus-visible .panel__media img {
    scale: none;
  }
}
```

Delete the old "badges invert with the card" block (`a.panel:hover .badge, a.panel:focus-visible .badge { … }`): every card badge now sits on the paper caption box and keeps its own colours.

The slanted-cut rules in `src/styles/art.css` (~lines 125-195) pad `.panel__body` past the cut; the caption box lives inside the body, so it inherits that padding. Check the cut panels on `/work/` and `/personal/` at 1280 in Step 6.

- [ ] **Step 5: About chapter title cards** — in `src/pages/about.astro` inside `.chapter__side` add `<span class="speed" aria-hidden="true"></span>` after the tone span. Append to `src/styles/components.css` after the `.chapter__num` rule:

```css
/* the side panel is the chapter's title card: a solid numeral over a fixed speed burst */
.chapter__side > .speed {
  inset: -10%;
  opacity: 0.35;
  background: repeating-conic-gradient(from 0deg at 65% 75%, currentColor 0deg 1deg, transparent 1deg 7deg);
  mask-image: radial-gradient(circle at 65% 75%, transparent 14%, #000 70%);
}
.chapter__num {
  z-index: 1;
  color: var(--ink);
  -webkit-text-stroke: 0;
  opacity: 1;
  filter: drop-shadow(0.04em 0.04em 0 var(--paper)) drop-shadow(0.025em 0.025em 0 var(--ink));
}
```

- [ ] **Step 6: Run e2e, expect PASS.** Screenshot `/work/`, `/personal/`, `/about/` at 1280, 768 and 390, LTR and RTL, plain and hovered (hover the first card). Check: caption boxes never cover more than half the art; long names (`Tech Bay IT Solutions`, `Croozz Technologies`, `Nocturne Network`) stay whole in title-cards; the slanted cuts do not clip a caption box; hovered cards show the paper box on ink.

- [ ] **Step 7: Lighthouse URLs** — in `lighthouserc.json` add `"/work/index.html"` and `"/personal/index.html"` to `ci.collect.url`.

- [ ] **Step 8: Verify and commit**

```bash
npm run verify && npx playwright test --project=desktop --project=phone
git add -A src e2e lighthouserc.json && git commit -m "feat: cards are art first, with title cards where there is no art"
```

---

### Task 7: Emanata (sparkle, COPIED!, sweat drop) and final gates

**Files:**
- Modify: `src/components/StatusBadge.astro`, `src/components/CopyEmail.astro`, `src/components/FigurePanel.astro`, `src/pages/404.astro`, `src/styles/components.css`, `e2e/book.spec.ts`

**Interfaces:**
- Consumes: `Sfx` with `look="burst"` (Task 2).
- Produces: `.badge-host > .badge + svg.badge__spark` for live/released; `.email__pop` shown for 1.2 s after a successful copy; `FigurePanel` default slot; `.lost__sweat` on 404.

- [ ] **Step 1: Failing e2e** — append:

```ts
test('live and released badges sparkle', async ({ page }) => {
  await page.goto('/personal/');
  const bright = await page.locator('.badge--live, .badge--released').count();
  expect(bright).toBeGreaterThan(0);
  await expect(page.locator('.badge__spark')).toHaveCount(bright);
});

test('copying the email pops a COPIED! burst', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Copy email' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied');
  await expect(page.locator('.email__pop')).toBeVisible();
  await expect(page.locator('.email__pop')).toHaveText('COPIED!');
  await expect(page.locator('.email__pop')).toBeHidden({ timeout: 2500 });
});

test('the 404 figure sweats', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('.lost__sweat')).toHaveCount(1);
});
```

Run: FAIL.

- [ ] **Step 2: Sparkle** — `src/components/StatusBadge.astro` becomes:

```astro
---
interface Props {
  status: 'live' | 'released' | 'prototype' | 'showcase' | 'archived';
}
const { status } = Astro.props;
const labels = { live: 'Live', released: 'Released', prototype: 'Prototype', showcase: 'Showcase', archived: 'Archived' };
const spark = status === 'live' || status === 'released';
---
<span class="badge-host">
  <span class={`badge badge--${status}`}>{labels[status]}</span>
  {spark && (
    <svg class="badge__spark" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 0 9.6 6.4 16 8 9.6 9.6 8 16 6.4 9.6 0 8 6.4 6.4Z" />
    </svg>
  )}
</span>
```

Before editing, `grep -rn "\.badge\b\|> \.badge\|+ \.badge" src/styles e2e` and update any child-combinator selector that expected `.badge` directly inside `.panel__caps` or `.facts-panel` to allow the host (e.g. `.panel__caps > .badge` becomes `.panel__caps .badge`).

- [ ] **Step 3: COPIED! pop** — in `src/components/CopyEmail.astro` add `import Sfx from './Sfx.astro';` to the frontmatter and, after the button, `<span class="email__pop" aria-hidden="true" hidden><Sfx word="COPIED!" look="burst" rotate="-8deg" /></span>`. In the script, after `const status = …` add `const pop = root.querySelector<HTMLElement>('.email__pop')!;` and replace the click handler's body with:

```ts
      const ok = await copy(address, link);
      const message = ok ? 'Copied' : 'Selected, press copy to finish';
      status.textContent = message;
      button.textContent = ok ? 'Copied' : 'Copy email';
      // the burst is decoration on top of the spoken status; it shows only for a real copy
      pop.hidden = !ok;
      clearTimeout(timer);
      timer = setTimeout(() => {
        pop.hidden = true;
      }, 1200);
      setTimeout(() => {
        status.textContent = '';
        button.textContent = 'Copy email';
      }, 2000);
```

(Two timers: the pop leaves at 1.2 s, the status at 2 s as before.)

- [ ] **Step 4: Sweat drop** — in `src/components/FigurePanel.astro` add `<slot />` as the last child of `.hero__end-cell`. In `src/pages/404.astro`:

```astro
      <FigurePanel word="HUH?" rotate="-8deg" inset look="rough">
        <svg class="lost__sweat" viewBox="0 0 20 30" aria-hidden="true" focusable="false"><path d="M10 0C10 0 0 14 0 20a10 10 0 0 0 20 0C20 14 10 0 10 0Z" /></svg>
      </FigurePanel>
```

- [ ] **Step 5: CSS** — append to `src/styles/components.css`:

```css
/* ---------- emanata: small drawn marks around a state ---------- */
.badge-host {
  position: relative;
  display: inline-flex;
}
.badge__spark {
  position: absolute;
  inset-block-start: -0.55rem;
  inset-inline-end: -0.55rem;
  inline-size: 0.95rem;
  fill: var(--paper);
  stroke: var(--ink);
  stroke-width: 1.5;
  pointer-events: none;
}
/* COPIED!: a small burst over the copy button with shock lines, popped once */
.email {
  position: relative;
}
.email__pop {
  position: absolute;
  inset-block-end: 100%;
  inset-inline-start: 6rem;
  z-index: 3;
  pointer-events: none;
}
.email__pop::before {
  content: '';
  position: absolute;
  inset: -60%;
  background: repeating-conic-gradient(from 0deg, currentColor 0deg 2deg, transparent 2deg 14deg);
  mask-image: radial-gradient(circle, transparent 38%, #000 42%, transparent 70%);
}
.email__pop > .sfx {
  position: relative;
  inset: auto;
  overflow: visible;
  font-size: 1.5rem;
}
.on-ink .email__pop > .sfx {
  --sfx-stroke: var(--paper);
  --sfx-fill: var(--ink);
}
@media (prefers-reduced-motion: no-preference) {
  .email__pop:not([hidden]) {
    animation: pop var(--t-fast) var(--ease-snap);
  }
}
@keyframes pop {
  from {
    opacity: 0;
    scale: 0.6;
  }
}
/* 404: one sweat drop beside the figure's head */
.lost__sweat {
  position: absolute;
  inset-block-start: 10%;
  inset-inline-end: 34%;
  z-index: 4;
  inline-size: 1.4rem;
  fill: var(--paper);
  stroke: var(--ink);
  stroke-width: 2;
  rotate: 18deg;
}
```

If `--ease-snap` or `--t-fast` is not defined in `src/styles/tokens.css`/`motion.css`, use the names that are (`grep -n "\-\-ease\|\-\-t-" src/styles/tokens.css src/styles/motion.css`).

- [ ] **Step 6: Run e2e, expect PASS.** Screenshot `/personal/` (badges), `/contact/` after clicking Copy (desktop and phone), `/404.html` with figure a and b. Move `.lost__sweat`'s `inset-*` until the drop sits beside the head for both figures (it is the same cell for both; pick values that work for both).

- [ ] **Step 7: Full gates**

```bash
npm run verify
npm run e2e 2>&1 | tail -15
npm run lighthouse 2>&1 | grep -iE "assert|fail|passed" | tail -10
grep -rniE "claude|anthropic|openai|chatgpt|copilot|@gmail\.com" src e2e tests scripts
```

Expected: verify green, every e2e project green, Lighthouse assertions pass for all six URLs, the grep prints nothing.

- [ ] **Step 8: Commit**

```bash
git add -A src e2e && git commit -m "feat: emanata: sparkling badges, a COPIED! burst, a sweating 404"
```

- [ ] **Step 9: Owner review** — screenshot every primary page at 1280 and 390 into the scratchpad and show the owner before merging `phase-5` into `main`.
