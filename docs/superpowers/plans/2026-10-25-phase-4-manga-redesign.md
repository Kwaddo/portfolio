# Phase 4: Manga Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the working but plain site into the "printed manga page" described in `docs/superpowers/specs/2026-10-25-manga-redesign-design.md`: irregular panel spreads, real screentone, SFX lettering, speech bubbles, inked dividers, framed halftone images, a diagonal page-wipe between routes and staggered panel reveals, all paper-white, all static under reduced motion, all inside the existing budgets.

**Architecture:** Same static Astro 7 site. New presentational components (`Spread`, `Panel`, `Bubble`, `Sfx`, `InkRule`, `Frame`) replace ad-hoc markup; the one growing `manga.css` is split into focused stylesheets; Astro's built-in `ClientRouter` drives route transitions; two tiny inline scripts (reveal observer, focus-after-swap) are the only new JavaScript. Pure helpers (`nextProject`, `isDarkBuffer`) are unit-tested; Playwright covers reduced motion, the wipe and overflow.

**Tech Stack:** Astro 7.4.2, `astro:transitions` ClientRouter (no new dependency), CSS (logical properties, grid, clip-path, view transitions), inline SVG, `sharp` at build time (already a devDependency), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-25-manga-redesign-design.md`. Base rules: `docs/superpowers/specs/2026-10-25-portfolio-design.md`.

## Global Constraints

Everything from the Phase 1-3 Global Constraints still binds. Restated and extended for this phase:

- **Node 22.23.4:** `export PATH="$HOME/.local/share/fnm/node-versions/v22.23.4/installation/bin:$PATH"` before any node/npm/npx command.
- **Content rules:** no AI-tooling or assistant mention anywhere (copy, markup, commit messages); Tanami role line only, no media; two credentials only; "Ali Khalaf" everywhere, "Kwaddo" only inside URLs, "Quad" never; phone never; plain email never in HTML. The repo will be public: no committed text file may contain the phone number, a plain `name@domain` email or AI-tool names. Before every commit run `git grep -nIiE 'claude|anthropic|copilot|chatgpt|openai|superpowers|36000253|@gmail\.com' -- . ':!docs' ':!package-lock.json'` and confirm it prints nothing.
- **Decorative words:** the only new visible copy is the SFX vocabulary: `WORK`, `PLAY`, `LAB`, `LOG`, `HELLO`, `NEXT`, `HUH?`. All SFX words are `aria-hidden="true"`.
- **Palette:** paper `#fafafa`, ink `#0a0a0a`, `--tone #5c5c5c`, `--tone-fill #e6e6e6`. No other colours. No dark mode.
- **Motion:** every transition under 600 ms; every reveal runs once; nothing loops; no scroll hijacking; no cursor effects. Under `prefers-reduced-motion: reduce` every animation and transition is off and every element is visible in its final state. Transforms and opacity only (no animated layout properties).
- **No JavaScript dependency for content:** without JS every element is visible (reveal classes only apply under `html.js`).
- **CSS:** logical properties only (`margin-inline`, `inset-inline-start`, `inline-size`...), never `left`/`right`/`width`/`height` physical names except inside `clip-path` polygons, `box-shadow` offsets (mirrored for RTL with a `[dir='rtl']` rule) and SVG attributes. `360px` wide: no horizontal scroll. RTL mirrors slants, wipes, tails and bleeds.
- **Accessibility:** text contrast at least 4.5:1; tone never behind body text; visible focus on every interactive element; one `h1` per page, no skipped heading levels.
- **Performance:** landing under 200 KB transferred (`npm run check:budget`), Lighthouse performance and accessibility at or above 95 (`npm run lighthouse`). SVG filters only on feature panels at desktop widths. No new runtime dependency.
- **Quality gate:** `npm run verify` and `npm run e2e` pass before every commit that touches code. Ports 4321 (e2e) and 4400 (the owner's preview) must be free of anything you started when you finish.
- **Commits:** conventional prefixes; never a `Co-Authored-By` trailer; do not push.

## File Structure

```
src/styles/tokens.css        extended: motion, rules, shadow tokens
src/styles/base.css          unchanged except main overflow clip and the js/reveal guard
src/styles/motion.css        NEW: reveal, page wipe, pop, ink-draw, hero sequence, reduced-motion
src/styles/tone.css          NEW: screentone densities, gradient tone, hatch
src/styles/type.css          NEW: display scale, SFX word, vertical labels, drop caps, chips
src/styles/panels.css        NEW: spread grid, panel, initial panel, speed lines, bleed, tilt, inked edge
src/styles/components.css    SPLIT from manga.css: buttons, badges, bubbles, facts, back link, email row, work-with-me
src/styles/nav.css           SPLIT: nav, footer
src/styles/media.css         SPLIT + rewritten: frame, gallery, game player, play page
src/styles/journal.css       SPLIT: stamp, strips, pager, timeline (incl. alternating spine)
src/styles/landing.css       NEW: hero, doors
src/styles/manga.css         DELETED at the end of Task 1 (everything moved)
src/components/Spread.astro  Panel.astro  Bubble.astro  Sfx.astro  InkRule.astro  Frame.astro   NEW
src/components/SpeechBubble.astro  Shot.astro                                                   DELETED
src/components/ProjectCard.astro  ProjectPage.astro  Nav.astro  Footer.astro  WorkWithMe.astro
              JournalTicker.astro  Devlog.astro  Timeline.astro  JourneyView.astro  GamePlayer.astro  REWRITTEN
src/lib/content.ts (+nextProject)  src/lib/luminance.ts (NEW)
src/layouts/Base.astro       ClientRouter, head scripts, SVG filter defs, new stylesheet imports
src/pages/*                  rewritten page by page (Tasks 4-8)
tests/content.test.ts (+nextProject)  tests/luminance.test.ts (NEW)
e2e/motion.spec.ts (NEW)  e2e/layout.spec.ts (routes kept)
```

---

### Task 1: Split the stylesheet, add motion foundation and route transitions

**Files:**
- Create: `src/styles/motion.css`, `src/styles/components.css`, `src/styles/nav.css`, `src/styles/media.css`, `src/styles/journal.css`, `src/styles/panels.css`
- Modify: `src/styles/tokens.css`, `src/styles/base.css`, `src/layouts/Base.astro`
- Delete: `src/styles/manga.css`
- Test: `e2e/motion.spec.ts`

**Interfaces:**
- Produces: tokens `--rule-4`, `--rule-5`, `--shadow-ink`, `--t-fast/base/slow`, `--ease-out`, `--ease-snap`, `--bleed`; the `data-reveal` attribute (+ optional `style="--i: n"` for stagger) that any element can carry to fade/slide in once; `html.js` and `html.seen` classes; the view-transition page wipe; `<svg>` filter `#ink` available on every page; `.pop` class; `.ink-draw` behaviour.

- [ ] **Step 1: Move the existing rules out of `manga.css` by section (no visual change yet)**

Create the five split files by copying blocks from `src/styles/manga.css` exactly as they are today:

- `src/styles/components.css`: the `/* buttons */` block, `/* badges */`, `/* speech bubble */` (`.bubble*`, `.hero`), `/* work with me, facts, chapters */` (`.wwm*`, `.email`, `.facts*`, `.chapter*`), and `.back::before` + `[dir='rtl'] .back::before`, and the `.tone`, `.tone--paper`, `.wash` rules from the first block.
- `src/styles/nav.css`: the `/* nav and footer */` block.
- `src/styles/panels.css`: the `/* panels */` block (`.panel-grid` through `@keyframes panel-reveal`) and the `/* landing split */` block.
- `src/styles/media.css`: the `/* screenshots */` block (`.shot*`, `.shots`) and the `/* game player */` block (`.player*`, `.play*`).
- `src/styles/journal.css`: the `/* journal */` block (`.stamp`, `.entries`, `.entry__link*`, `.pager`) and the `/* timeline */` block.

Then delete `src/styles/manga.css`. Every rule must land in exactly one file; use `grep -c '^\.' ` before and after to compare selector counts (expected: the sum over the five files equals the count in the original).

- [ ] **Step 2: Extend tokens**

Replace `src/styles/tokens.css` with:
```css
:root {
  --paper: #fafafa;
  --ink: #0a0a0a;
  --tone: #5c5c5c; /* secondary text, 6.4:1 on paper */
  --tone-fill: #e6e6e6; /* flat screentone fill, never behind small text */
  --font-display: 'Anton', 'Arial Narrow', Impact, sans-serif;
  --font-body: 'Inter Variable', system-ui, -apple-system, 'Segoe UI', 'Geeza Pro', 'Noto Sans Arabic', sans-serif;
  --rule: 3px solid var(--ink);
  --rule-4: 4px solid var(--ink);
  --rule-5: 5px solid var(--ink);
  --shadow-ink: 6px 6px 0 var(--ink);
  --gutter: clamp(0.75rem, 3vw, 1.75rem);
  --measure: 68ch;
  --wrap: 72rem;
  --nav-h: 3.5rem;
  /* distance from the wrap's content edge to the viewport edge; 100cqi is main's width, so no scrollbar error */
  --bleed: calc(max(0px, (100cqi - var(--wrap)) / 2) + var(--gutter));
  --t-fast: 160ms;
  --t-base: 280ms;
  --t-slow: 520ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-snap: cubic-bezier(0.3, 1.4, 0.4, 1);
  color-scheme: light;
}
```

- [ ] **Step 3: Base adjustments**

In `src/styles/base.css` replace the `main { ... }` rule with:
```css
main {
  display: block;
  flex: 1 0 auto;
  padding-block: clamp(1.5rem, 4vw, 3rem);
  container-type: inline-size;
  overflow-x: clip;
  overflow-clip-margin: 0;
}
```
(`container-type` makes `100cqi` available for `--bleed`; `overflow-x: clip` stops sub-pixel transform overflow from tilted panels creating a horizontal scrollbar while leaving vertical overflow visible.)

- [ ] **Step 4: Write `src/styles/motion.css`**

```css
/* ---------- reveal (only when JS runs; without JS everything is simply visible) ---------- */
html.js [data-reveal] {
  opacity: 0;
  translate: 0 1.25rem;
  transition:
    opacity var(--t-slow) var(--ease-out),
    translate var(--t-slow) var(--ease-out);
  transition-delay: calc(var(--i, 0) * 60ms);
}
html.js [data-reveal].is-in {
  opacity: 1;
  translate: 0 0;
}

/* ---------- pop (bubbles on first paint) ---------- */
@keyframes pop {
  from {
    scale: 0.92;
    opacity: 0;
  }
  70% {
    scale: 1.02;
    opacity: 1;
  }
  to {
    scale: 1;
  }
}
html.js .pop {
  animation: pop var(--t-base) var(--ease-snap) both;
}

/* ---------- ink draw (heading underline, timeline spine) ---------- */
.ink-draw path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 400ms var(--ease-out) 120ms;
}
html:not(.js) .ink-draw path,
.is-in .ink-draw path,
.ink-draw.is-in path {
  stroke-dashoffset: 0;
}

/* ---------- page wipe between routes (Astro ClientRouter view transitions) ---------- */
@keyframes wipe-start {
  from {
    clip-path: polygon(0 0, 0 0, -20% 100%, -20% 100%);
  }
  to {
    clip-path: polygon(0 0, 120% 0, 100% 100%, 0 100%);
  }
}
@keyframes wipe-end {
  from {
    clip-path: polygon(100% 0, 100% 0, 120% 100%, 120% 100%);
  }
  to {
    clip-path: polygon(-20% 0, 100% 0, 100% 100%, 0 100%);
  }
}
@keyframes rm-fade {
  from {
    opacity: 0;
  }
}
:root::view-transition-old(root) {
  animation: none;
  mix-blend-mode: normal;
}
:root::view-transition-new(root) {
  animation: wipe-start 420ms var(--ease-out) both;
  mix-blend-mode: normal;
}
:root[data-astro-transition='back']::view-transition-new(root),
:root[dir='rtl']::view-transition-new(root) {
  animation-name: wipe-end;
}
:root[dir='rtl'][data-astro-transition='back']::view-transition-new(root) {
  animation-name: wipe-start;
}

/* ---------- reduced motion: everything static, everything visible ---------- */
@media (prefers-reduced-motion: reduce) {
  html.js [data-reveal] {
    opacity: 1;
    translate: none;
    transition: none;
  }
  html.js .pop {
    animation: none;
  }
  .ink-draw path {
    stroke-dashoffset: 0;
    transition: none;
  }
  :root::view-transition-old(root),
  :root::view-transition-new(root) {
    animation: rm-fade 120ms linear both;
  }
}
```

- [ ] **Step 5: Rewrite `src/layouts/Base.astro`**

```astro
---
import '@fontsource/anton/latin-400.css';
import '@fontsource-variable/inter/wght.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/motion.css';
import '../styles/components.css';
import '../styles/nav.css';
import '../styles/panels.css';
import '../styles/media.css';
import '../styles/journal.css';
import { ClientRouter } from 'astro:transitions';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import { canonical, pageTitle } from '../lib/seo';
import { site } from '../data/site';
import { ogImageFor } from '../lib/og';

interface Props {
  title?: string;
  description?: string;
  lang?: 'en' | 'ar';
  noindex?: boolean;
}
const {
  title,
  description = `${site.name} is a ${site.role.toLowerCase()} in ${site.location}. Work, games and the stories behind them.`,
  lang = 'en',
  noindex = false,
} = Astro.props;
const dir = lang === 'ar' ? 'rtl' : 'ltr';
const url = canonical(Astro.url.pathname);
const full = pageTitle(title);
const image = canonical(ogImageFor(Astro.url.pathname));
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
    <link rel="alternate" type="application/rss+xml" title={`${site.name}: journal`} href="/rss.xml" />
    <meta name="theme-color" content="#fafafa" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={site.name} />
    <meta property="og:title" content={full} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={url} />
    <meta property="og:image" content={image} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={image} />
    {noindex && <meta name="robots" content="noindex" />}
    <script is:inline>
      // Marks JS as available (reveal styles apply only then) and remembers whether the landing sequence already played.
      (function () {
        var h = document.documentElement;
        h.classList.add('js');
        try {
          if (sessionStorage.getItem('hero')) h.classList.add('seen');
          else sessionStorage.setItem('hero', '1');
        } catch (e) {}
      })();
    </script>
    <ClientRouter />
    <slot name="head" />
  </head>
  <body>
    <svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
      <filter id="ink" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
    <a class="skip" href="#main">Skip to content</a>
    <Nav pathname={Astro.url.pathname} />
    <main id="main"><slot /></main>
    <Footer />
    <script>
      // Reveal once per element; re-run after every client-side navigation.
      const reveal = () => {
        const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)');
        if (!('IntersectionObserver' in window)) {
          els.forEach((el) => el.classList.add('is-in'));
          return;
        }
        const io = new IntersectionObserver(
          (entries) => {
            for (const en of entries) {
              if (en.isIntersecting) {
                en.target.classList.add('is-in');
                io.unobserve(en.target);
              }
            }
          },
          { rootMargin: '0px 0px -10% 0px' },
        );
        els.forEach((el) => io.observe(el));
      };
      reveal();
      document.addEventListener('astro:page-load', reveal);
      document.addEventListener('astro:after-swap', () => {
        // The router replaces <html> attributes; restore our flags before paint, then move focus to the new page.
        document.documentElement.classList.add('js', 'seen');
        const main = document.getElementById('main');
        if (main) {
          main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
        }
      });
    </script>
  </body>
</html>
```

- [ ] **Step 6: Write the Playwright motion spec**

`e2e/motion.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing animates and everything is visible', async ({ page }) => {
    await page.goto('/personal/');
    await page.waitForTimeout(300);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    expect(running).toBe(0);
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => getComputedStyle(el).opacity !== '1').length,
    );
    expect(hidden).toBe(0);
  });
});

test('panels reveal as they scroll into view', async ({ page }) => {
  await page.goto('/personal/');
  const count = await page.locator('[data-reveal]').count();
  expect(count).toBeGreaterThan(0);
  await page.mouse.wheel(0, 20000);
  await page.waitForTimeout(800);
  const notIn = await page.locator('[data-reveal]:not(.is-in)').count();
  expect(notIn).toBe(0);
});

test('client-side navigation wipes to the new page without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Work', exact: true }).first().click();
  await expect(page).toHaveURL(/\/work\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Work');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const focused = await page.evaluate(() => document.activeElement?.id);
  expect(focused).toBe('main');
});
```
Restrict it to Chromium in `playwright.config.ts`: the `firefox` and `webkit-phone` projects already match only `layout.spec.ts`, so nothing to change.

- [ ] **Step 7: Verify**

```bash
npm run verify && npm run e2e
```
Expected: verify passes (the budget rises by about 6 KB for the router, still far under 200000); e2e passes with the three new tests (phone + desktop). Then `npm run build && grep -c 'astro-view-transitions-enabled' dist/index.html` prints `1`, and `grep -c 'filter id="ink"' dist/index.html` prints `1`.

- [ ] **Step 8: Commit**

```bash
git add src e2e
git commit -m "feat: split stylesheets, add route wipe, reveal and motion tokens"
```

---

### Task 2: Tone, SFX, ink rules and bubbles

**Files:**
- Create: `src/styles/tone.css`, `src/styles/type.css`, `src/components/Sfx.astro`, `src/components/InkRule.astro`, `src/components/Bubble.astro`
- Modify: `src/layouts/Base.astro` (imports), `src/styles/components.css` (replace old `.bubble*`, `.tone*`, `.wash`), `src/pages/index.astro`, `src/pages/404.astro` (use `Bubble`), `src/pages/about.astro`, `src/components/JourneyView.astro` (`InkRule` instead of `hr.wash`)
- Delete: `src/components/SpeechBubble.astro`

**Interfaces:**
- Produces: classes `.tone-fine`, `.tone-mid`, `.tone-coarse` (+ `.tone--paper` modifier), `.tone-grad`, `.hatch`; `<Sfx word rotate? paper? />`; `<InkRule variant="splat-a|splat-b|splat-c|draw" />`; `<Bubble shape="round|shout|thought|caption" tail="start|center|end" as? href? class? />`; `.chips` (restyled `.tags`), `.vlabel`, `.dropcap`.

- [ ] **Step 1: Write `src/styles/tone.css`**

```css
/* Screentone layers. Always decorative, never behind body text. */
.tone-fine,
.tone-mid,
.tone-coarse,
.tone-grad,
.hatch {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.tone-fine {
  opacity: 0.18;
  background-image: radial-gradient(circle at center, var(--ink) 0.8px, transparent 1.2px);
  background-size: 4px 4px;
}
.tone-mid {
  opacity: 0.22;
  background-image: radial-gradient(circle at center, var(--ink) 1px, transparent 1.4px);
  background-size: 6px 6px;
}
.tone-coarse {
  opacity: 0.28;
  background-image: radial-gradient(circle at center, var(--ink) 1.6px, transparent 2.1px);
  background-size: 10px 10px;
}
.tone-grad {
  opacity: 0.3;
  background-image: radial-gradient(circle at center, var(--ink) 1px, transparent 1.4px);
  background-size: 6px 6px;
  mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
}
.hatch {
  opacity: 0.35;
  background-image: repeating-linear-gradient(45deg, var(--ink) 0 1px, transparent 1px 6px);
}
.tone--paper {
  background-image: radial-gradient(circle at center, var(--paper) 1px, transparent 1.4px);
}
.hatch.tone--paper {
  background-image: repeating-linear-gradient(45deg, var(--paper) 0 1px, transparent 1px 6px);
}
/* anything that carries a tone layer must stack its content above it */
.has-tone {
  position: relative;
}
.has-tone > :not(.tone-fine):not(.tone-mid):not(.tone-coarse):not(.tone-grad):not(.hatch):not(.sfx) {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 2: Write `src/styles/type.css`**

```css
/* ---------- display scale ---------- */
h1 {
  font-size: clamp(3rem, 11vw, 7.5rem);
  line-height: 0.92;
}
h2 {
  font-size: clamp(2.25rem, 6vw, 4rem);
  line-height: 0.95;
}
h3 {
  font-size: clamp(1.5rem, 2.4vw, 2.1rem);
}

/* ---------- SFX word: decorative, outlined, clipped to its own box so it can never overflow the page ---------- */
.sfx {
  position: absolute;
  inset-inline: 0;
  inset-block-start: -0.25em;
  z-index: 0;
  overflow: hidden;
  font: 400 clamp(5rem, 20vw, 15rem) / 1 var(--font-display);
  letter-spacing: 0.02em;
  text-align: end;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}
.sfx > span {
  display: inline-block;
  color: transparent;
  -webkit-text-stroke: 2px var(--ink);
  opacity: 0.8;
  rotate: var(--sfx-rotate, -6deg);
  translate: 0.08em 0;
}
.sfx--paper > span {
  -webkit-text-stroke-color: var(--paper);
}

/* ---------- vertical labels ---------- */
.vlabel {
  font: 400 1rem/1 var(--font-display);
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--tone);
  writing-mode: vertical-rl;
}

/* ---------- drop caps ---------- */
.dropcap > p:first-of-type::first-letter {
  float: inline-start;
  margin-inline-end: 0.12em;
  padding: 0.08em 0.18em 0 0.1em;
  background: var(--ink);
  color: var(--paper);
  font: 400 3.4em/0.9 var(--font-display);
}

/* ---------- chips (stack tags etc.) ---------- */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-block-end: 0;
  margin-inline: 0;
  padding: 0;
  list-style: none;
}
.chips li {
  padding: 0.15rem 0.6rem;
  border: 2px solid var(--ink);
  box-shadow: 3px 3px 0 var(--ink);
  font: 600 0.8rem/1.5 var(--font-body);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
[dir='rtl'] .chips li {
  box-shadow: -3px 3px 0 var(--ink);
}
```
In `src/styles/base.css` delete the `.tags` and `.tags li` rules; everywhere the markup says `class="tags"` change it to `class="chips"` (`grep -rl 'class="tags"' src/pages src/components`). Keep the `aria-label` attributes.

- [ ] **Step 3: Write `src/components/Sfx.astro`**

```astro
---
interface Props {
  word: 'WORK' | 'PLAY' | 'LAB' | 'LOG' | 'HELLO' | 'NEXT' | 'HUH?';
  rotate?: string;
  paper?: boolean;
}
const { word, rotate = '-6deg', paper = false } = Astro.props;
---
<span class:list={['sfx', paper && 'sfx--paper']} aria-hidden="true" style={`--sfx-rotate: ${rotate}`}><span>{word}</span></span>
```

- [ ] **Step 4: Write `src/components/InkRule.astro`**

```astro
---
interface Props {
  variant?: 'splat-a' | 'splat-b' | 'splat-c' | 'draw';
}
const { variant = 'splat-a' } = Astro.props;
const splats = {
  'splat-a': 'M0 26 C30 10 60 34 95 18 S170 6 210 24 S300 38 340 16 S390 20 400 24 L400 40 L0 40 Z',
  'splat-b': 'M0 20 C40 30 70 6 110 22 S190 36 230 14 S310 8 350 26 S385 16 400 20 L400 40 L0 40 Z',
  'splat-c': 'M0 28 C50 8 80 30 130 16 S200 32 250 10 S320 34 370 20 L400 28 L400 40 L0 40 Z',
} as const;
---
{
  variant === 'draw' ? (
    <svg class="ink-draw" viewBox="0 0 400 12" preserveAspectRatio="none" aria-hidden="true" data-reveal>
      <path d="M2 8 C60 2 120 11 200 6 S340 3 398 7" pathLength="1" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke" />
    </svg>
  ) : (
    <svg class="splat" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
      <path d={splats[variant]} fill="currentColor" />
      <circle cx="60" cy="12" r="4" fill="currentColor" />
      <circle cx="300" cy="9" r="3" fill="currentColor" />
      <circle cx="372" cy="14" r="2" fill="currentColor" />
    </svg>
  )
}
```
Note: `.ink-draw` carries `data-reveal` so the observer adds `is-in` and the stroke draws; the `html.js [data-reveal]` opacity rule must not hide it, so add to `motion.css`: `html.js .ink-draw[data-reveal] { opacity: 1; translate: none; }`.

- [ ] **Step 5: Write `src/components/Bubble.astro`**

```astro
---
interface Props {
  shape?: 'round' | 'shout' | 'thought' | 'caption';
  tail?: 'start' | 'center' | 'end';
  as?: 'div' | 'p' | 'span' | 'a';
  href?: string;
  class?: string;
}
const { shape = 'round', tail = 'start', as: Tag = 'div', href, class: cls } = Astro.props;
---
<Tag class:list={['bubble', `bubble--${shape}`, `bubble--tail-${tail}`, cls]} href={href}>
  {
    shape === 'shout' && (
      <svg class="bubble__bg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
        <polygon
          points="4,30 12,20 2,10 16,12 14,2 26,10 36,0 42,10 54,2 60,12 72,4 76,14 90,8 86,20 98,22 90,32 100,42 86,44 92,56 78,50 70,60 62,52 50,60 44,50 32,58 28,48 14,54 18,42 4,46 10,36"
          vector-effect="non-scaling-stroke"
        />
      </svg>
    )
  }
  {
    shape === 'thought' && (
      <svg class="bubble__bg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M20 12 Q10 0 26 4 Q36 -4 46 4 Q58 -4 66 6 Q82 0 82 14 Q98 16 92 30 Q100 44 84 46 Q80 58 64 52 Q54 62 44 54 Q30 62 24 50 Q6 52 10 38 Q0 26 12 22 Q8 12 20 12 Z"
          vector-effect="non-scaling-stroke"
        />
      </svg>
    )
  }
  {
    shape === 'round' && (
      <svg class="bubble__tail" viewBox="0 0 40 30" aria-hidden="true">
        <path class="bubble__tail-fill" d="M0 0 H34 L8 30 Q10 14 0 0 Z" />
        <path class="bubble__tail-line" d="M34 0 L8 30 Q10 14 0 0" fill="none" vector-effect="non-scaling-stroke" />
      </svg>
    )
  }
  {
    shape === 'thought' && (
      <span class="bubble__dots" aria-hidden="true">
        <i></i>
        <i></i>
      </span>
    )
  }
  <div class="bubble__body"><slot /></div>
</Tag>
```

- [ ] **Step 6: Replace the bubble and tone rules in `src/styles/components.css`**

Delete the old `.tone`, `.tone--paper`, `.wash`, `.bubble`, `.bubble::after`, `[dir='rtl'] .bubble::after`, `.bubble h1`, `.bubble p` rules and add:
```css
/* ---------- bubbles ---------- */
.bubble {
  position: relative;
  display: inline-block;
  isolation: isolate;
  color: var(--ink);
  text-decoration: none;
}
.bubble__body {
  position: relative;
}
.bubble--round {
  max-inline-size: 34rem;
  padding: 1rem 1.5rem;
  border: var(--rule);
  border-radius: 1.75rem;
  background: var(--paper);
}
.bubble__tail {
  position: absolute;
  inset-block-start: calc(100% - 2px);
  inline-size: 2.4rem;
  block-size: 1.8rem;
  overflow: visible;
}
.bubble__tail-fill {
  fill: var(--paper);
}
.bubble__tail-line {
  stroke: var(--ink);
  stroke-width: 3px;
  stroke-linejoin: round;
}
.bubble--tail-start .bubble__tail {
  inset-inline-start: 2rem;
}
.bubble--tail-center .bubble__tail {
  inset-inline-start: calc(50% - 1.2rem);
}
.bubble--tail-end .bubble__tail {
  inset-inline-end: 2rem;
  transform: scaleX(-1);
}
[dir='rtl'] .bubble--tail-start .bubble__tail {
  transform: scaleX(-1);
}
[dir='rtl'] .bubble--tail-end .bubble__tail {
  transform: none;
}
.bubble__bg {
  position: absolute;
  inset: -10% -6%;
  inline-size: 112%;
  block-size: 120%;
  z-index: -1;
  overflow: visible;
  fill: var(--paper);
  stroke: var(--ink);
  stroke-width: 3px;
  stroke-linejoin: round;
}
.bubble--shout {
  padding: 1.5rem 2.75rem;
}
.bubble--shout .bubble__body {
  font-family: var(--font-display);
  text-transform: uppercase;
}
.bubble--ink .bubble__bg {
  fill: var(--ink);
}
.bubble--ink {
  color: var(--paper);
}
a.bubble--shout:hover .bubble__bg,
a.bubble--shout:focus-visible .bubble__bg {
  fill: var(--ink);
}
a.bubble--shout:hover,
a.bubble--shout:focus-visible {
  color: var(--paper);
}
a.bubble--ink:hover .bubble__bg,
a.bubble--ink:focus-visible .bubble__bg {
  fill: var(--paper);
}
a.bubble--ink:hover,
a.bubble--ink:focus-visible {
  color: var(--ink);
}
.bubble--thought {
  padding: 2rem 2.5rem;
}
.bubble__dots {
  position: absolute;
  inset-block-start: calc(100% + 0.25rem);
  inset-inline-start: 1.5rem;
  display: flex;
  gap: 0.4rem;
  align-items: flex-end;
}
.bubble__dots i {
  display: block;
  inline-size: 1rem;
  block-size: 1rem;
  border: var(--rule);
  border-radius: 50%;
  background: var(--paper);
}
.bubble__dots i:last-child {
  inline-size: 0.6rem;
  block-size: 0.6rem;
}
.bubble--caption {
  padding: 0.3rem 0.65rem;
  border: var(--rule);
  background: var(--paper);
  font: 700 0.75rem/1.4 var(--font-body);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.bubble h1 {
  font-size: clamp(2.25rem, 7vw, 4.25rem);
}
.bubble p {
  margin-block-start: 0.5rem;
  color: var(--tone);
}
.bubble--ink p {
  color: var(--paper);
}

/* ---------- ink rules ---------- */
.splat {
  display: block;
  inline-size: 100%;
  block-size: 1.25rem;
  margin-block: 1.5rem;
  color: var(--ink);
}
.ink-draw {
  display: block;
  inline-size: min(100%, 14rem);
  block-size: 0.6rem;
  margin-block-start: 0.35rem;
  color: var(--ink);
}
```

- [ ] **Step 7: Use the new components**

- `src/pages/index.astro`: replace `import SpeechBubble ...` with `import Bubble from '../components/Bubble.astro';` and `<SpeechBubble>...</SpeechBubble>` with `<Bubble shape="round" class="pop">...</Bubble>` (same children).
- `src/pages/404.astro`: same import swap; use `<Bubble shape="thought" class="pop">` with the same children.
- `src/pages/about.astro` and `src/components/JourneyView.astro`: import `InkRule` and replace every `<hr class="wash" />` with `<InkRule variant={['splat-a', 'splat-b', 'splat-c'][i % 3] as 'splat-a' | 'splat-b' | 'splat-c'} />` inside the chapter loops (the stand-alone `<hr class="wash" />` before Stack on About becomes `<InkRule variant="splat-b" />`).
- `src/layouts/Base.astro`: add `import '../styles/tone.css';` and `import '../styles/type.css';` after `motion.css`.
- Delete `src/components/SpeechBubble.astro`; `grep -rn SpeechBubble src` must print nothing.

- [ ] **Step 8: Verify and look**

```bash
npm run verify && npm run e2e
```
Expected: pass. Then build, start `npx astro preview --host 127.0.0.1 --port 4321 --ignore-lock` in the background, screenshot `/` and `/404.html` and `/about/` at 1440x900 with a small Playwright script into `/private/tmp/claude-501/shots/`, open each with the Read tool and confirm: the landing bubble has an SVG tail; the 404 has a jagged-cloud thought bubble with two trailing dots; About chapters are separated by black splat shapes. Stop the preview (`lsof -i :4321` empty).

- [ ] **Step 9: Commit**

```bash
git add src
git commit -m "feat: add screentone, sfx lettering, ink rules and bubble shapes"
```

---

### Task 3: Spreads, panels and the project card

**Files:**
- Create: `src/components/Spread.astro`, `src/components/Panel.astro`
- Modify: `src/styles/panels.css` (rewrite the `/* panels */` block; keep the `/* landing split */` block for Task 4), `src/components/ProjectCard.astro`, `src/pages/personal/index.astro`, `src/pages/work/index.astro`
- Test: `tests/content.test.ts` (+`nextProject`), `src/lib/content.ts`

**Interfaces:**
- Produces: `<Spread layout="3up|feature-start|feature-end|stack|strips" label? sfx? sfxPaper? class? />` (grid section, renders `<Sfx>` and a vertical label when given); `<Panel w=1|2|3 tall? bleed="start|end"? tilt? weight=3|4|5 tone="fine|mid|coarse|grad|hatch"? href? class? index? />` (`index` sets `--i` stagger and `data-reveal`); `ProjectCard` props as before plus `w`, `index`, `confidential`; `nextProject(refs, kind, id)` in `src/lib/content.ts`.

- [ ] **Step 1: `nextProject` (TDD)**

Append to `tests/content.test.ts`:
```ts
describe('nextProject', () => {
  const refs: JourneyRef[] = [
    { kind: 'games', id: 'a', title: 'A', journey: false },
    { kind: 'games', id: 'b', title: 'B', journey: false },
    { kind: 'lab', id: 'c', title: 'C', journey: false },
  ];
  test('returns the next entry of the same kind', () => {
    expect(nextProject(refs, 'games', 'a')?.id).toBe('b');
  });
  test('wraps to the first entry of the other kind at the end of a list', () => {
    expect(nextProject(refs, 'games', 'b')?.id).toBe('c');
    expect(nextProject(refs, 'lab', 'c')?.id).toBe('a');
  });
  test('returns undefined for an unknown id', () => {
    expect(nextProject(refs, 'games', 'zzz')).toBeUndefined();
  });
});
```
(add `nextProject` to the import). Run `npm run test -- content`; expected FAIL. Then append to `src/lib/content.ts`:
```ts
export const nextProject = (refs: JourneyRef[], kind: JourneyRef['kind'], id: string): JourneyRef | undefined => {
  const same = refs.filter((r) => r.kind === kind);
  const i = same.findIndex((r) => r.id === id);
  if (i === -1) return undefined;
  if (i + 1 < same.length) return same[i + 1];
  return refs.find((r) => r.kind !== kind);
};
```
Run again; expected PASS.

- [ ] **Step 2: Replace the `/* panels */` block in `src/styles/panels.css`**

Delete everything from `/* ---------- panels ---------- */` up to (not including) `/* ---------- landing split ---------- */` and write:
```css
/* ---------- spreads: a page is a sequence of 12-column grids ---------- */
.spread {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-flow: dense;
  gap: var(--gutter);
  align-items: start;
}
.spread > * {
  grid-column: span 12;
}
.spread__label {
  grid-column: span 12;
}
@media (min-width: 48rem) {
  .spread > .panel--w1 {
    grid-column: span 4;
  }
  .spread > .panel--w2 {
    grid-column: span 8;
  }
  .spread > .panel--w3 {
    grid-column: span 12;
  }
  .spread > .panel--tall {
    grid-row: span 2;
  }
  .spread--3up > :not(.spread__label):not(.sfx) {
    grid-column: span 4;
  }
  .spread--feature-start > :not(.spread__label):not(.sfx) {
    grid-column: span 4;
  }
  .spread--feature-start > :not(.spread__label):not(.sfx):first-of-type {
    grid-column: span 8;
    grid-row: span 2;
  }
  .spread--feature-end > :not(.spread__label):not(.sfx) {
    grid-column: span 4;
  }
  .spread--feature-end > :not(.spread__label):not(.sfx):first-of-type {
    grid-column: 5 / -1;
    grid-row: span 2;
  }
  .spread--stack > :not(.spread__label):not(.sfx) {
    grid-column: span 12;
  }
  .spread--strips {
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  }
  .spread--strips > * {
    grid-column: auto;
  }
  .spread--labelled {
    padding-inline-start: 2.5rem;
  }
  .spread__label {
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: 0;
    grid-column: auto;
    block-size: 100%;
    padding-inline-end: 0.75rem;
    border-inline-end: var(--rule);
  }
}
.spread--slant {
  --slant: 5deg;
}

/* ---------- panel ---------- */
.panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
  min-block-size: 10rem;
  border: var(--rule);
  background: var(--paper);
  color: var(--ink);
  text-decoration: none;
  isolation: isolate;
}
.panel--weight-4 {
  border: var(--rule-4);
}
.panel--weight-5 {
  border: var(--rule-5);
}
.panel--shadow {
  box-shadow: var(--shadow-ink);
}
[dir='rtl'] .panel--shadow {
  box-shadow: -6px 6px 0 var(--ink);
}
.panel > .tone-fine,
.panel > .tone-mid,
.panel > .tone-coarse,
.panel > .tone-grad,
.panel > .hatch {
  z-index: 0;
}
.panel__media {
  position: relative;
  z-index: 1;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-block-end: inherit;
  border-block-end-width: 3px;
  background: var(--tone-fill);
}
.panel__media img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.05);
  transition: filter var(--t-base);
}
.panel__initial {
  display: grid;
  place-items: center;
  background: var(--paper);
}
.panel__letter {
  position: relative;
  z-index: 1;
  font: 400 clamp(5rem, 12vw, 7rem) / 1 var(--font-display);
  color: transparent;
  -webkit-text-stroke: 3px var(--ink);
}
.panel__body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
}
.panel__title {
  font: 400 clamp(1.5rem, 2.4vw, 2.1rem) / 1 var(--font-display);
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
.panel__caps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* bleed: the panel runs to the viewport edge and loses that border */
@media (min-width: 48rem) {
  .panel--bleed-end {
    margin-inline-end: calc(-1 * var(--bleed));
    border-inline-end: 0;
  }
  .panel--bleed-start {
    margin-inline-start: calc(-1 * var(--bleed));
    border-inline-start: 0;
  }
  .panel--tilt {
    rotate: -1.2deg;
  }
  [dir='rtl'] .panel--tilt {
    rotate: 1.2deg;
  }
  /* hand-inked edge on feature panels: a displaced copy of the border */
  .panel--inked {
    border-color: transparent;
  }
  .panel--inked::before {
    content: '';
    position: absolute;
    inset: -1px;
    z-index: 2;
    border: inherit;
    border-color: var(--ink);
    filter: url(#ink);
    pointer-events: none;
  }
}

/* speed lines: radial burst shown on hover/focus of a link panel */
.speed {
  position: absolute;
  inset: -20%;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  background: repeating-conic-gradient(from 0deg at 50% 50%, currentColor 0deg 0.5deg, transparent 0.5deg 6deg);
  mask-image: radial-gradient(circle at 50% 50%, transparent 25%, #000 75%);
  transition: opacity var(--t-fast);
}
a.panel:hover,
a.panel:focus-visible {
  background: var(--ink);
  color: var(--paper);
}
a.panel:hover .speed,
a.panel:focus-visible .speed {
  opacity: 0.18;
}
a.panel:hover .panel__meta,
a.panel:hover .panel__text,
a.panel:focus-visible .panel__meta,
a.panel:focus-visible .panel__text {
  color: var(--paper);
}
a.panel:hover .badge--archived,
a.panel:focus-visible .badge--archived {
  color: var(--paper);
}
a.panel:hover .panel__letter,
a.panel:focus-visible .panel__letter {
  -webkit-text-stroke-color: var(--paper);
}
a.panel:hover .panel__media img,
a.panel:focus-visible .panel__media img {
  filter: none;
}
@media (hover: hover) {
  .panel__more {
    opacity: 0;
    translate: 0 0.4rem;
    transition:
      opacity var(--t-fast),
      translate var(--t-fast);
  }
  a.panel:hover .panel__more,
  a.panel:focus-visible .panel__more {
    opacity: 1;
    translate: 0 0;
  }
  a.panel {
    transition:
      translate var(--t-fast),
      box-shadow var(--t-fast),
      background var(--t-fast),
      color var(--t-fast);
  }
  a.panel:hover {
    translate: 0 -2px;
    box-shadow: 10px 10px 0 var(--ink);
  }
  [dir='rtl'] a.panel:hover {
    box-shadow: -10px 10px 0 var(--ink);
  }
}
```
(The old `@supports (animation-timeline: view())` reveal is removed: `data-reveal` replaces it.)

- [ ] **Step 3: Write `src/components/Spread.astro`**

```astro
---
import Sfx from './Sfx.astro';

interface Props {
  layout?: '3up' | 'feature-start' | 'feature-end' | 'stack' | 'strips';
  label?: string;
  sfx?: 'WORK' | 'PLAY' | 'LAB' | 'LOG' | 'HELLO' | 'NEXT' | 'HUH?';
  sfxPaper?: boolean;
  class?: string;
  as?: 'section' | 'div' | 'header' | 'ol' | 'ul';
  ariaLabelledby?: string;
}
const { layout = '3up', label, sfx, sfxPaper = false, class: cls, as: Tag = 'section', ariaLabelledby } = Astro.props;
---
<Tag class:list={['spread', `spread--${layout}`, label && 'spread--labelled', sfx && 'has-tone', cls]} aria-labelledby={ariaLabelledby}>
  {label && <span class="spread__label vlabel" aria-hidden="true">{label}</span>}
  {sfx && <Sfx word={sfx} paper={sfxPaper} />}
  <slot />
</Tag>
```

- [ ] **Step 4: Write `src/components/Panel.astro`**

```astro
---
interface Props {
  w?: 1 | 2 | 3;
  tall?: boolean;
  bleed?: 'start' | 'end';
  tilt?: boolean;
  weight?: 3 | 4 | 5;
  tone?: 'fine' | 'mid' | 'coarse' | 'grad' | 'hatch';
  shadow?: boolean;
  inked?: boolean;
  href?: string;
  index?: number;
  class?: string;
  as?: 'div' | 'article' | 'li' | 'section';
}
const { w, tall = false, bleed, tilt = false, weight = 3, tone, shadow = false, inked = false, href, index, class: cls, as = 'div' } = Astro.props;
const Tag = href ? 'a' : as;
const toneClass = tone === 'hatch' ? 'hatch' : tone ? `tone-${tone}` : undefined;
---
<Tag
  class:list={[
    'panel',
    w && `panel--w${w}`,
    tall && 'panel--tall',
    bleed && `panel--bleed-${bleed}`,
    tilt && 'panel--tilt',
    weight !== 3 && `panel--weight-${weight}`,
    shadow && 'panel--shadow',
    inked && 'panel--inked',
    cls,
  ]}
  href={href}
  data-reveal={index !== undefined ? '' : undefined}
  style={index !== undefined ? `--i: ${index}` : undefined}
>
  {toneClass && <span class={toneClass} aria-hidden="true"></span>}
  {href && <span class="speed" aria-hidden="true"></span>}
  <slot />
</Tag>
```

- [ ] **Step 5: Rewrite `src/components/ProjectCard.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import Panel from './Panel.astro';
import StatusBadge from './StatusBadge.astro';
import Bubble from './Bubble.astro';

interface Props {
  href: string;
  title: string;
  summary: string;
  status?: 'live' | 'released' | 'prototype' | 'showcase' | 'archived';
  cover?: ImageMetadata;
  coverAlt?: string;
  meta?: string;
  level?: 2 | 3;
  w?: 1 | 2 | 3;
  tall?: boolean;
  tilt?: boolean;
  index?: number;
  confidential?: boolean;
}
const { href, title, summary, status, cover, coverAlt, meta, level = 3, w, tall = false, tilt = false, index, confidential = false } = Astro.props;
const Tag = level === 2 ? 'h2' : 'h3';
const letter = title.trim().charAt(0).toUpperCase();
---
<Panel href={href} w={w} tall={tall} tilt={tilt} index={index} tone={confidential ? 'hatch' : undefined} shadow>
  {
    cover ? (
      <div class="panel__media">
        <Image src={cover} alt={coverAlt ?? ''} widths={[400, 800]} sizes="(min-width: 48rem) 33vw, 100vw" />
      </div>
    ) : (
      <div class="panel__media panel__initial" aria-hidden="true">
        <span class="tone-coarse"></span>
        <span class="panel__letter">{letter}</span>
      </div>
    )
  }
  <div class="panel__body">
    <div class="panel__caps">
      {status && <StatusBadge status={status} />}
      {confidential && <Bubble shape="caption" as="span">Confidential</Bubble>}
    </div>
    <Tag class="panel__title">{title}</Tag>
    {meta && <p class="panel__meta">{meta}</p>}
    <p class="panel__text">{summary}</p>
    <span class="panel__more" aria-hidden="true">Read more</span>
  </div>
</Panel>
```
Note: `.panel__initial` contains a `.tone-coarse` that is `position: absolute` inside a `position: relative` media box: that is already true because `.panel__media` is `position: relative`.

- [ ] **Step 6: Rewrite `src/pages/personal/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import Spread from '../../components/Spread.astro';
import ProjectCard from '../../components/ProjectCard.astro';
import InkRule from '../../components/InkRule.astro';
import { byOrder, published } from '../../lib/content';
import { formatMonth } from '../../lib/dates';

const games = byOrder(published(await getCollection('games')));
const lab = byOrder(published(await getCollection('lab')));
---
<Base title="Personal" description="Games and experiments by Ali Khalaf, built for the love of it.">
  <div class="wrap stack">
    <header class="page-head">
      <h1>Personal</h1>
      <p class="lede">Games and experiments, built for the love of it. Each has a short overview, and some have a longer story behind them.</p>
    </header>

    <h2 id="games">Games<InkRule variant="draw" /></h2>
    <Spread layout="feature-start" label="Games" sfx="PLAY" ariaLabelledby="games">
      {
        games.map((g, i) => (
          <ProjectCard
            href={`/personal/games/${g.id}/`}
            title={g.data.title}
            summary={g.data.summary}
            status={g.data.status}
            cover={g.data.cover}
            coverAlt={g.data.coverAlt}
            meta={`Last worked ${formatMonth(g.data.lastWorked)}`}
            tilt={i === 0}
            index={i}
          />
        ))
      }
    </Spread>

    <InkRule variant="splat-c" />

    <h2 id="lab">Lab<InkRule variant="draw" /></h2>
    <Spread layout="3up" label="Lab" sfx="LAB" ariaLabelledby="lab">
      {
        lab.map((l, i) => (
          <ProjectCard
            href={`/personal/lab/${l.id}/`}
            title={l.data.title}
            summary={l.data.summary}
            status={l.data.status}
            cover={l.data.cover}
            coverAlt={l.data.coverAlt}
            meta={`Last worked ${formatMonth(l.data.lastWorked)}`}
            index={i}
          />
        ))
      }
    </Spread>
  </div>
</Base>
```
Add to `src/styles/type.css`:
```css
.page-head {
  display: grid;
  gap: 1rem;
}
h2 > .ink-draw {
  margin-block-start: 0.2em;
}
```

- [ ] **Step 7: Rewrite the card grid in `src/pages/work/index.astro`**

Replace the `<div class="panel-grid"> ... </div>` block with:
```astro
    <Spread layout="feature-start" label="Roles" sfx="WORK">
      {
        work.map((entry, i) => (
          <ProjectCard
            level={2}
            href={`/work/${entry.id}/`}
            title={entry.data.title}
            summary={entry.data.summary}
            meta={`${entry.data.role} · ${entry.data.period}`}
            cover={entry.data.cover}
            coverAlt={entry.data.coverAlt}
            confidential={entry.data.confidential}
            index={i}
          />
        ))
      }
    </Spread>
```
and add `import Spread from '../../components/Spread.astro';`. Wrap the existing `<h1>` and `<p class="lede">` in `<header class="page-head">`.

- [ ] **Step 8: Verify and look**

```bash
grep -rn 'panel-grid' src | wc -l   # expect 0
npm run verify && npm run e2e
```
Expected: pass (unit tests now 85). Screenshot `/personal/` and `/work/` at 1440x900 and 360x740 (preview on 4321, stop it afterwards) and confirm with the Read tool: the first game panel is wide and slightly tilted; the giant outlined PLAY/LAB words sit behind the grids and are clipped at the grid edge; cards without a cover show a big outlined initial over coarse tone; the Tanami card shows hatching and a "Confidential" caption; at 360 px everything stacks in one column with no horizontal scroll.

- [ ] **Step 9: Commit**

```bash
git add src tests
git commit -m "feat: add spread and panel system, rebuild project cards and indexes"
```

---

### Task 4: Landing page

**Files:**
- Create: `src/styles/landing.css`
- Modify: `src/pages/index.astro`, `src/components/WorkWithMe.astro`, `src/styles/panels.css` (delete the old `/* landing split */` block), `src/styles/components.css` (delete `.hero`, `.wwm*`), `src/layouts/Base.astro` (import)

**Interfaces:**
- Consumes: `Bubble`, `Sfx`, `Panel`, `Spread`, `CopyEmail`, `JournalTicker`, `html.seen`.
- Produces: the hero sequence (plays once per session), doors with SFX words and speed lines, Work-with-me as three panels.

- [ ] **Step 1: Write `src/styles/landing.css`**

```css
/* ---------- hero ---------- */
.hero {
  position: relative;
  display: grid;
  gap: 1rem;
  padding-block: clamp(1rem, 4vw, 3rem) 2.5rem;
  overflow: hidden;
}
.hero__speed {
  inset: -60% -30%;
  opacity: 0.1;
  color: var(--ink);
  mask-image: radial-gradient(circle at 25% 50%, transparent 10%, #000 55%, transparent 80%);
}
.hero__bubble {
  justify-self: start;
  max-inline-size: 100%;
}
.hero__bubble h1 {
  font-size: clamp(2.5rem, 8vw, 5.5rem);
}
.hero__role {
  margin-block-start: 0.25rem;
  font: 400 clamp(1.1rem, 2.4vw, 1.6rem) / 1.1 var(--font-display);
  letter-spacing: 0.08em;
}
.hero__avail {
  position: relative;
  z-index: 1;
  max-inline-size: var(--measure);
  color: var(--tone);
}

/* ---------- doors ---------- */
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
  isolation: isolate;
}
.split__door > * {
  position: relative;
  z-index: 1;
}
.split__door > .tone-mid,
.split__door > .sfx,
.split__door > .speed {
  z-index: 0;
}
.split__door .sfx {
  inset-block-start: auto;
  inset-block-end: -0.1em;
  font-size: clamp(7rem, 26vw, 20rem);
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
.split__door .speed {
  inset: -40%;
  mask-image: radial-gradient(circle at 50% 70%, transparent 20%, #000 70%);
}
.split__door:hover .speed,
.split__door:focus-visible .speed {
  opacity: 0.16;
}
.split__door:focus-visible {
  outline: 4px solid currentColor;
  outline-offset: -10px;
}
.split__door--work:hover,
.split__door--work:focus-visible {
  background: var(--ink);
  color: var(--paper);
}
.split__door--work:hover .sfx > span,
.split__door--work:focus-visible .sfx > span {
  -webkit-text-stroke-color: var(--paper);
}
.split__door--personal:hover,
.split__door--personal:focus-visible {
  background: var(--paper);
  color: var(--ink);
}
.split__door--personal:hover .sfx > span,
.split__door--personal:focus-visible .sfx > span {
  -webkit-text-stroke-color: var(--ink);
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

/* ---------- work with me: three panels ---------- */
.wwm {
  padding-block: 3rem 1rem;
}
.wwm__list {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding-inline-start: 1.25rem;
}
.wwm .panel__body {
  gap: 0.75rem;
}

/* ---------- opening sequence: once per session, JS only, never under reduced motion ---------- */
@keyframes fade-in {
  from {
    opacity: 0;
  }
}
@keyframes slide-start {
  from {
    translate: -8% 0;
    opacity: 0;
  }
}
@keyframes slide-end {
  from {
    translate: 8% 0;
    opacity: 0;
  }
}
html.js:not(.seen) .hero__speed {
  animation: fade-in 200ms var(--ease-out) both;
}
html.js:not(.seen) .hero__bubble {
  animation: pop 180ms var(--ease-snap) 150ms both;
}
html.js:not(.seen) .hero__avail {
  animation: fade-in 150ms var(--ease-out) 300ms both;
}
html.js:not(.seen) .split__door--work {
  animation: slide-start 350ms var(--ease-out) 350ms both;
}
html.js:not(.seen) .split__door--personal {
  animation: slide-end 350ms var(--ease-out) 350ms both;
}
[dir='rtl'] html.js:not(.seen) .split__door--work,
html[dir='rtl'].js:not(.seen) .split__door--work {
  animation-name: slide-end;
}
html[dir='rtl'].js:not(.seen) .split__door--personal {
  animation-name: slide-start;
}
html.js:not(.seen) .wwm {
  animation: fade-in 200ms var(--ease-out) 700ms both;
}
@media (prefers-reduced-motion: reduce) {
  html.js:not(.seen) .hero__speed,
  html.js:not(.seen) .hero__bubble,
  html.js:not(.seen) .hero__avail,
  html.js:not(.seen) .split__door--work,
  html.js:not(.seen) .split__door--personal,
  html.js:not(.seen) .wwm {
    animation: none;
  }
}
```
Delete the old `/* landing split */` block from `panels.css` and the `.hero`, `.wwm`, `.wwm__list` rules from `components.css`. Add `import '../styles/landing.css';` to `Base.astro` after `journal.css`.

- [ ] **Step 2: Rewrite `src/components/WorkWithMe.astro`**

```astro
---
import CopyEmail from './CopyEmail.astro';
import Spread from './Spread.astro';
import Panel from './Panel.astro';
import { site } from '../data/site';
---
<section class="wwm wrap stack" aria-labelledby="wwm-title">
  <h2 id="wwm-title">Work with me</h2>
  <Spread layout="3up">
    <Panel shadow index={0}>
      <div class="panel__body">
        <h3 class="panel__title">What I take on</h3>
        <ul class="wwm__list">
          <li>Full-stack web: React, TypeScript, Laravel and Go.</li>
          <li>Mobile apps with React Native.</li>
          <li>Backend services in Go, Laravel and NestJS.</li>
          <li>Game prototypes and small multiplayer games.</li>
        </ul>
      </div>
    </Panel>
    <Panel shadow index={1}>
      <div class="panel__body">
        <h3 class="panel__title">How to start</h3>
        <p>{site.availability}</p>
        <p>Send a short brief: what you're building, your timeline and a budget range. {site.responseTime}</p>
      </div>
    </Panel>
    <Panel shadow tone="fine" index={2}>
      <div class="panel__body">
        <h3 class="panel__title">Say hello</h3>
        <CopyEmail />
      </div>
    </Panel>
  </Spread>
</section>
```

- [ ] **Step 3: Rewrite `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Bubble from '../components/Bubble.astro';
import Sfx from '../components/Sfx.astro';
import WorkWithMe from '../components/WorkWithMe.astro';
import JournalTicker from '../components/JournalTicker.astro';
import { site } from '../data/site';
---
<Base>
  <section class="hero wrap">
    <span class="speed hero__speed" aria-hidden="true"></span>
    <Bubble shape="shout" class="hero__bubble">
      <h1>{site.name}</h1>
      <p class="hero__role">{site.role}</p>
    </Bubble>
    <p class="hero__avail">{site.availability}</p>
  </section>
  <section class="split" aria-label="Choose a track">
    <a class="split__door split__door--work" href="/work/">
      <span class="tone-mid" aria-hidden="true"></span>
      <Sfx word="WORK" rotate="-4deg" />
      <span class="speed" aria-hidden="true"></span>
      <h2>Work</h2>
      <p>Roles, and the systems behind them.</p>
    </a>
    <a class="split__door split__door--personal on-ink" href="/personal/">
      <span class="tone-mid tone--paper" aria-hidden="true"></span>
      <Sfx word="PLAY" rotate="-4deg" paper />
      <span class="speed" aria-hidden="true"></span>
      <h2>Personal</h2>
      <p>Games, experiments and the stories behind them.</p>
    </a>
  </section>
  <JournalTicker />
  <WorkWithMe />
</Base>
```
`.hero__role` is a `<p>` inside the bubble: the `.bubble p` colour rule turns it grey; override in `landing.css` (already there: `.hero__role` sets font only, so add `color: var(--ink);` to that rule).

- [ ] **Step 4: Verify and look**

```bash
npm run verify && npm run e2e
```
Expected: pass; the e2e motion test "client-side navigation" still finds the `Work` nav link. Screenshot `/` at 1440x900 and 360x740 twice: first in a fresh context (sequence plays; take the shot after 1200 ms) and once more after reload (no sequence). Confirm with the Read tool: jagged shout bubble with the name; faint radial speed lines behind it; the two doors with giant outlined WORK/PLAY words along their bottom edges; three Work-with-me panels with hard shadows; no horizontal overflow at 360 px. Record the budget line from `npm run check:budget` (must stay under 200000).

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: rebuild the landing page as a manga spread with an opening sequence"
```

---

### Task 5: Frames, project pages, play page

**Files:**
- Create: `src/components/Frame.astro`, `src/lib/luminance.ts`
- Modify: `src/components/ProjectPage.astro`, `src/components/GamePlayer.astro`, `src/pages/personal/games/[slug]/play.astro`, `src/styles/media.css` (replace the `/* screenshots */` block; keep and extend the player block), `src/pages/work/[slug].astro` (use `Frame` for its gallery and cover)
- Delete: `src/components/Shot.astro`
- Test: `tests/luminance.test.ts`

**Interfaces:**
- Produces: `isDarkBuffer(data: Uint8Array | Buffer): boolean` (mean < 90) and `isDark(img: ImageMetadata): Promise<boolean>` (build-time, cached, false when the file path is unknown); `<Frame src alt caption? tilt? eager? sizes? />` rendering `figure.frame.frame--{portrait|landscape|square}[data-dark]`; `.gallery` grid; `nextProject` wired into a "Next" bleed panel on every game and lab page.

- [ ] **Step 1: Luminance helper (TDD)**

`tests/luminance.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { isDarkBuffer } from '../src/lib/luminance';

describe('isDarkBuffer', () => {
  test('a mostly black buffer is dark', () => {
    expect(isDarkBuffer(new Uint8Array([10, 20, 30, 40]))).toBe(true);
  });
  test('a light buffer is not dark', () => {
    expect(isDarkBuffer(new Uint8Array([200, 220, 240]))).toBe(false);
  });
  test('the threshold sits at a mean of 90', () => {
    expect(isDarkBuffer(new Uint8Array([89, 89]))).toBe(true);
    expect(isDarkBuffer(new Uint8Array([90, 90]))).toBe(false);
  });
  test('an empty buffer is not dark', () => {
    expect(isDarkBuffer(new Uint8Array([]))).toBe(false);
  });
});
```
Run `npm run test -- luminance`; expected FAIL. Then `src/lib/luminance.ts`:
```ts
import sharp from 'sharp';
import type { ImageMetadata } from 'astro';

export const isDarkBuffer = (data: Uint8Array): boolean => {
  if (data.length === 0) return false;
  let sum = 0;
  for (const v of data) sum += v;
  return sum / data.length < 90;
};

const cache = new Map<string, Promise<boolean>>();

/** Build-time: true when the image's mean luminance is low, so the halftone overlay must lighten instead of multiply. */
export async function isDark(img: ImageMetadata): Promise<boolean> {
  // Astro attaches the source path as a non-enumerable property on imported images.
  const path = (img as ImageMetadata & { fsPath?: string }).fsPath;
  if (!path) return false;
  let pending = cache.get(path);
  if (!pending) {
    pending = sharp(path)
      .resize(32, 32, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer()
      .then((buf) => isDarkBuffer(new Uint8Array(buf)))
      .catch(() => false);
    cache.set(path, pending);
  }
  return pending;
}
```
Run again; expected PASS.

- [ ] **Step 2: Write `src/components/Frame.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { isDark } from '../lib/luminance';

interface Props {
  src: ImageMetadata;
  alt: string;
  caption?: string;
  tilt?: boolean;
  eager?: boolean;
  sizes?: string;
  class?: string;
}
const { src, alt, caption, tilt = false, eager = false, sizes = '(min-width: 48rem) 60vw, 100vw', class: cls } = Astro.props;
const ratio = src.width / src.height;
const orient = ratio > 1.2 ? 'landscape' : ratio < 0.85 ? 'portrait' : 'square';
const dark = await isDark(src);
---
<figure class:list={['frame', `frame--${orient}`, tilt && 'frame--tilt', cls]} data-frame data-dark={dark ? 'true' : 'false'} data-color="false">
  <button type="button" aria-pressed="false" data-frame-toggle>
    <Image src={src} alt={alt} widths={[480, 960, 1440]} sizes={sizes} loading={eager ? 'eager' : 'lazy'} />
    <span class="visually-hidden">, toggle colour</span>
  </button>
  {caption && <figcaption class="frame__cap">{caption}</figcaption>}
</figure>

<script>
  const bind = () => {
    document.querySelectorAll<HTMLElement>('[data-frame]:not([data-bound])').forEach((figure) => {
      figure.dataset.bound = '1';
      const button = figure.querySelector<HTMLButtonElement>('[data-frame-toggle]')!;
      button.addEventListener('click', () => {
        const on = figure.dataset.color !== 'true';
        figure.dataset.color = String(on);
        button.setAttribute('aria-pressed', String(on));
      });
    });
  };
  bind();
  document.addEventListener('astro:page-load', bind);
</script>
```

- [ ] **Step 3: Replace the `/* screenshots */` block in `src/styles/media.css`**

Delete `.shot*` and `.shots` rules and write:
```css
/* ---------- frames ---------- */
.frame {
  position: relative;
  align-self: start;
  margin: 0;
  border: var(--rule);
  background: var(--ink);
  box-shadow: var(--shadow-ink);
}
[dir='rtl'] .frame {
  box-shadow: -6px 6px 0 var(--ink);
}
@media (min-width: 48rem) {
  .frame--tilt {
    rotate: -1.5deg;
  }
  [dir='rtl'] .frame--tilt {
    rotate: 1.5deg;
  }
}
.frame button {
  all: unset;
  display: block;
  inline-size: 100%;
  cursor: pointer;
}
.frame button:focus-visible {
  outline: 3px solid var(--paper);
  outline-offset: -6px;
}
.frame img {
  display: block;
  inline-size: 100%;
  filter: grayscale(1) contrast(1.05);
  transition: filter var(--t-base);
}
.frame::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: multiply;
  opacity: 0.25;
  background-image: radial-gradient(circle at center, var(--ink) 0.9px, transparent 1.3px);
  background-size: 5px 5px;
  transition: opacity var(--t-base);
}
.frame[data-dark='true']::after {
  mix-blend-mode: screen;
  opacity: 0.1;
  background-image: radial-gradient(circle at center, var(--paper) 0.9px, transparent 1.3px);
}
.frame[data-color='true'] img,
.frame:hover img,
.frame:focus-within img {
  filter: none;
}
.frame[data-color='true']::after,
.frame:hover::after,
.frame:focus-within::after {
  opacity: 0;
}
.frame__cap {
  position: absolute;
  inset-block-end: -0.9rem;
  inset-inline-start: -0.6rem;
  z-index: 1;
  max-inline-size: 85%;
  padding: 0.3rem 0.65rem;
  border: var(--rule);
  background: var(--paper);
  color: var(--ink);
  font: 600 0.8rem/1.35 var(--font-body);
}

/* gallery: portrait frames take narrow columns, landscape ones wide columns */
.gallery {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-flow: dense;
  gap: calc(var(--gutter) + 0.75rem);
  padding-block-end: 1rem;
}
.gallery > * {
  grid-column: span 12;
}
@media (min-width: 48rem) {
  .gallery > .frame--portrait {
    grid-column: span 4;
  }
  .gallery > .frame--square {
    grid-column: span 6;
  }
  .gallery > .frame--landscape {
    grid-column: span 8;
  }
}

/* project hero */
.hero-spread {
  align-items: center;
}
.hero-spread__text {
  grid-column: span 12;
  display: grid;
  gap: 1rem;
}
.hero-spread__media {
  grid-column: span 12;
}
@media (min-width: 48rem) {
  .hero-spread__text {
    grid-column: 1 / span 7;
  }
  .hero-spread__media {
    grid-column: 8 / -1;
    margin-inline-end: calc(-1 * var(--bleed));
  }
  .hero-spread__media .frame {
    border-inline-end: 0;
    box-shadow: -6px 6px 0 var(--ink);
  }
  [dir='rtl'] .hero-spread__media .frame {
    box-shadow: 6px 6px 0 var(--ink);
  }
}
.cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.25rem;
  align-items: center;
}
.credits {
  color: var(--tone);
}
.next-panel {
  margin-block-start: 2rem;
}
.next-panel .panel__body {
  padding: 1.5rem;
}
```

- [ ] **Step 4: Rewrite `src/components/ProjectPage.astro`**

```astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import StatusBadge from './StatusBadge.astro';
import Frame from './Frame.astro';
import Bubble from './Bubble.astro';
import Panel from './Panel.astro';
import Sfx from './Sfx.astro';
import InkRule from './InkRule.astro';
import Devlog from './Devlog.astro';
import { formatMonth } from '../lib/dates';
import { forProject, newestFirst, toDevlog } from '../lib/journal';
import { byOrder, nextProject, published, type JourneyRef } from '../lib/content';

interface Props {
  kind: 'games' | 'lab';
  entry: CollectionEntry<'games'> | CollectionEntry<'lab'>;
}
const { kind, entry } = Astro.props;
const { data } = entry;
const { Content } = await render(entry);
const [journal, games, lab] = await Promise.all([getCollection('journal'), getCollection('games'), getCollection('lab')]);
const devlog = toDevlog(forProject(newestFirst(published(journal)), entry.id));
const refs: JourneyRef[] = [
  ...byOrder(published(games)).map((e) => ({ kind: 'games' as const, id: e.id, title: e.data.title, journey: e.data.journey })),
  ...byOrder(published(lab)).map((e) => ({ kind: 'lab' as const, id: e.id, title: e.data.title, journey: e.data.journey })),
];
const next = nextProject(refs, kind, entry.id);

const base = `/personal/${kind}/${entry.id}/`;
const playable = 'playable' in data ? data.playable : 'none';
const playUrl = 'playUrl' in data ? data.playUrl : undefined;
const downloadUrl = 'downloadUrl' in data ? data.downloadUrl : undefined;
const liveUrl = 'liveUrl' in data ? data.liveUrl : undefined;
const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
const letter = data.title.trim().charAt(0).toUpperCase();
---
<Base title={data.title} description={data.summary}>
  <article class="wrap stack">
    <p><a class="back" href="/personal/">All personal projects</a></p>

    <header class="spread hero-spread has-tone">
      <Sfx word={kind === 'games' ? 'PLAY' : 'LAB'} rotate="-5deg" />
      <div class="hero-spread__text">
        <h1>{data.title}</h1>
        <p class="lede">{data.summary}</p>
        <div class="panel__caps">
          <StatusBadge status={data.status} />
          <Bubble shape="caption" as="span">Last worked {formatMonth(data.lastWorked)}</Bubble>
        </div>
        {data.stack.length > 0 && <ul class="chips" aria-label="Stack">{data.stack.map((s) => <li>{s}</li>)}</ul>}
      </div>
      <div class="hero-spread__media">
        {
          data.cover ? (
            <Frame src={data.cover} alt={data.coverAlt!} eager sizes="(min-width: 48rem) 42vw, 100vw" />
          ) : (
            <Panel weight={4} shadow>
              <div class="panel__media panel__initial" aria-hidden="true">
                <span class="tone-coarse"></span>
                <span class="panel__letter">{letter}</span>
              </div>
            </Panel>
          )
        }
      </div>
    </header>

    <div class="prose dropcap"><Content /></div>

    <div class="cta-row">
      {playable === 'embed' && <Bubble shape="shout" as="a" href={`${base}play/`} class="bubble--ink">Play</Bubble>}
      {playable === 'external' && playUrl && <Bubble shape="shout" as="a" href={playUrl} class="bubble--ink">Play</Bubble>}
      {liveUrl && <a class="btn btn--solid" href={liveUrl} {...external}>Open live site</a>}
      {downloadUrl && <a class="btn" href={downloadUrl} {...external}>Download</a>}
      {data.repoUrl && <a class="btn" href={data.repoUrl} {...external}>Source</a>}
      {data.journey && <a class="btn" href={`${base}journey/`}>Read the journey</a>}
    </div>

    {
      data.gallery.length > 0 && (
        <section aria-labelledby="gallery" class="stack">
          <h2 id="gallery">Gallery<InkRule variant="draw" /></h2>
          <div class="gallery">
            {data.gallery.map((g, i) => <Frame src={g.src} alt={g.alt} caption={g.caption} tilt={i % 3 === 1} />)}
          </div>
        </section>
      )
    }

    {
      data.collaborators.length > 0 && (
        <p class="credits">
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
    <Devlog items={devlog} />

    {
      next && (
        <Panel href={`/personal/${next.kind}/${next.id}/`} bleed="end" weight={4} tone="fine" class="next-panel has-tone">
          <Sfx word="NEXT" rotate="-3deg" />
          <div class="panel__body">
            <p class="panel__meta">Next {next.kind === 'games' ? 'game' : 'experiment'}</p>
            <p class="panel__title">{next.title}</p>
            <span class="panel__more" aria-hidden="true">Read more</span>
          </div>
        </Panel>
      )
    }
  </article>
</Base>
```
The external `playable === 'external'` shout link opens the same tab; add `{...external}` to it as well so it matches the previous behaviour: `<Bubble shape="shout" as="a" href={playUrl} class="bubble--ink">` cannot spread attributes, so for the external case use `<a class="bubble bubble--shout bubble--ink" href={playUrl} target="_blank" rel="noopener noreferrer"><span class="bubble__body">Play</span></a>` with the jagged SVG copied from `Bubble` (or add `target` and `rel` props to `Bubble`: do that, it is two optional props passed straight to the `<Tag>`).

- [ ] **Step 5: Play page and player**

In `src/components/GamePlayer.astro` change the start button to a shout: replace
```astro
    <button class="btn btn--solid player__start" type="button" data-start>Play {title}</button>
```
with
```astro
    <button class="player__start" type="button" data-start>
      <svg class="player__burst" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
        <polygon points="4,30 12,20 2,10 16,12 14,2 26,10 36,0 42,10 54,2 60,12 72,4 76,14 90,8 86,20 98,22 90,32 100,42 86,44 92,56 78,50 70,60 62,52 50,60 44,50 32,58 28,48 14,54 18,42 4,46 10,36" vector-effect="non-scaling-stroke" />
      </svg>
      <span>Play {title}</span>
    </button>
```
and in `media.css` replace `.player__start { position: relative; }` with:
```css
.player__start {
  position: relative;
  display: grid;
  place-items: center;
  min-inline-size: 12rem;
  padding: 1.5rem 2.5rem;
  border: 0;
  background: none;
  color: var(--ink);
  font: 400 1.5rem/1 var(--font-display);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}
.player__burst {
  position: absolute;
  inset: -12% -8%;
  inline-size: 116%;
  block-size: 124%;
  z-index: 0;
  overflow: visible;
  fill: var(--paper);
  stroke: var(--ink);
  stroke-width: 3px;
  stroke-linejoin: round;
  transition: fill var(--t-fast);
}
.player__start > span {
  position: relative;
  z-index: 1;
}
.player__start:hover .player__burst,
.player__start:focus-visible .player__burst {
  fill: var(--ink);
}
.player__start:hover,
.player__start:focus-visible {
  color: var(--paper);
}
.player__start:focus-visible {
  outline: 3px solid var(--paper);
  outline-offset: 6px;
}
```
In `src/pages/personal/games/[slug]/play.astro` wrap the player: replace `<GamePlayer ... />` with
```astro
    <Panel weight={4} shadow class="play__panel">
      <GamePlayer src={data.playUrl!} title={data.title} poster={data.cover} posterAlt={data.coverAlt} frameWidth={data.frameWidth} frameHeight={data.frameHeight} />
    </Panel>
```
(import `Panel`), and in `media.css` change `.play .player { ... }` to target `.play .play__panel { margin-inline: auto; inline-size: min(100%, calc((100svh - 13rem) * var(--play-ratio, 1.7778))); }` and add `.play__panel .player { border: 0; }` so the panel carries the border.

- [ ] **Step 6: Work detail gallery**

In `src/pages/work/[slug].astro` import `Frame` and replace the cover `<Image ... />` line with `{data.cover && <Frame src={data.cover} alt={data.coverAlt!} eager sizes="(min-width: 72rem) 68rem, 100vw" />}` and the gallery `<Shot .../>` with `<Frame src={g.src} alt={g.alt} caption={g.caption} tilt={i % 3 === 1} />` (map with index). Replace `class="shots"` with `class="gallery"`. Delete `src/components/Shot.astro`; `grep -rn "Shot\b" src` prints nothing.

- [ ] **Step 7: Verify and look**

```bash
npm run verify && npm run e2e
```
Expected: pass (unit tests 89). Screenshot `/personal/games/skoobl/` and `/personal/games/smobb/` at 1440x900 and 360x740 and confirm with the Read tool: the cover sits in a framed panel that runs to the viewport's end edge beside the title; status and "Last worked" render as caption chips; the gallery places phone shots in narrow columns and desktop shots in wide ones with no black voids; the dark S.M.O.B.B. shots are legible (screen-blend dots, not mud); a NEXT panel closes the page; the Play shout bubble appears on S.M.O.B.B. Check `/personal/games/smobb/play/` still fits a 1280x720 viewport after clicking Play.

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "feat: framed halftone images, project hero spreads and next-project panels"
```

---

### Task 6: Work pages and the timeline spine

**Files:**
- Modify: `src/pages/work/index.astro`, `src/pages/work/[slug].astro`, `src/components/Timeline.astro`, `src/styles/journal.css` (timeline rules)

**Interfaces:**
- Produces: `<Timeline entries alternate? />`; `.timeline--alt` layout (spine that draws in, entries alternating sides at desktop); work detail hero with role caption and hatch notice.

- [ ] **Step 1: Timeline component**

Replace `src/components/Timeline.astro` with:
```astro
---
import type { CollectionEntry } from 'astro:content';
import Bubble from './Bubble.astro';
import { periodLabel, sortTimeline } from '../lib/timeline';

interface Props {
  entries: CollectionEntry<'timeline'>[];
  alternate?: boolean;
}
const { entries, alternate = false } = Astro.props;
const items = sortTimeline(entries);
const href = (e: CollectionEntry<'timeline'>) => (e.data.journey ? `/about/${e.id}/` : e.data.link);
---
<ol class:list={['timeline', alternate && 'timeline--alt']} data-reveal={alternate ? '' : undefined}>
  {
    items.map((e, i) => (
      <li class="timeline__item" data-reveal style={`--i: ${i}`}>
        <Bubble shape="caption" as="p" class="timeline__period">{periodLabel(e.data.start, e.data.end)}</Bubble>
        <div class="timeline__text">
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
Replace the `/* timeline */` block in `src/styles/journal.css` with:
```css
/* ---------- timeline ---------- */
.timeline {
  position: relative;
  display: grid;
  gap: 1.25rem;
  margin-block-end: 0;
  margin-inline: 0;
  padding: 0 0 0 1.25rem;
  padding-inline-start: 1.25rem;
  list-style: none;
}
.timeline::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 3px;
  background: var(--ink);
  transform-origin: top;
}
.timeline__item {
  display: grid;
  gap: 0.35rem 1.5rem;
  align-items: start;
}
.timeline__period {
  justify-self: start;
  margin: 0;
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
@media (min-width: 40rem) {
  .timeline:not(.timeline--alt) .timeline__item {
    grid-template-columns: 11rem 1fr;
  }
}
/* alternating layout: spine down the middle, entries left and right of it */
@media (min-width: 48rem) {
  .timeline--alt {
    padding-inline-start: 0;
    grid-template-columns: 1fr 3rem 1fr;
    column-gap: 0;
  }
  .timeline--alt::before {
    inset-inline-start: calc(50% - 1.5px);
  }
  .timeline--alt .timeline__item {
    grid-template-columns: 1fr;
    padding: 1rem;
    border: var(--rule);
    background: var(--paper);
  }
  .timeline--alt .timeline__item:nth-child(odd) {
    grid-column: 1;
    text-align: end;
  }
  .timeline--alt .timeline__item:nth-child(odd) .timeline__period {
    justify-self: end;
  }
  .timeline--alt .timeline__item:nth-child(even) {
    grid-column: 3;
  }
  html.js .timeline--alt::before {
    scale: 1 0;
    transition: scale 900ms var(--ease-out);
  }
  html.js .timeline--alt.is-in::before {
    scale: 1 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  html.js .timeline--alt::before {
    scale: 1 1;
    transition: none;
  }
}
```
(The resume page keeps the plain `.timeline`; About and Work pass `alternate`.)

- [ ] **Step 2: Work index**

In `src/pages/work/index.astro` change `<Timeline entries={timeline} />` to `<Timeline entries={timeline} alternate />` and give the heading an ink draw: `<h2 id="timeline-title">Timeline<InkRule variant="draw" /></h2>` (import `InkRule`). Insert `<InkRule variant="splat-a" />` between the spread and the timeline section.

- [ ] **Step 3: Work detail**

Replace `src/pages/work/[slug].astro` with:
```astro
---
import { getCollection, render } from 'astro:content';
import Base from '../../layouts/Base.astro';
import Frame from '../../components/Frame.astro';
import Bubble from '../../components/Bubble.astro';
import Sfx from '../../components/Sfx.astro';
import InkRule from '../../components/InkRule.astro';
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
    <p><a class="back" href="/work/">All work</a></p>
    <header class="spread hero-spread has-tone">
      <Sfx word="WORK" rotate="-5deg" />
      <div class="hero-spread__text">
        <h1>{data.title}</h1>
        <div class="panel__caps">
          <Bubble shape="caption" as="span">{data.role}</Bubble>
          <Bubble shape="caption" as="span">{data.period}</Bubble>
        </div>
        {data.stack.length > 0 && <ul class="chips" aria-label="Stack">{data.stack.map((s) => <li>{s}</li>)}</ul>}
      </div>
      {
        data.cover && (
          <div class="hero-spread__media">
            <Frame src={data.cover} alt={data.coverAlt!} eager sizes="(min-width: 48rem) 42vw, 100vw" />
          </div>
        )
      }
    </header>
    {
      data.confidential && (
        <p class="notice has-tone">
          <span class="hatch" aria-hidden="true"></span>
          <span>This work is confidential. This page lists only my role and dates.</span>
        </p>
      )
    }
    <div class="prose dropcap"><Content /></div>
    {
      data.gallery.length > 0 && (
        <section aria-labelledby="gallery" class="stack">
          <h2 id="gallery">Screenshots<InkRule variant="draw" /></h2>
          <div class="gallery">
            {data.gallery.map((g, i) => <Frame src={g.src} alt={g.alt} caption={g.caption} tilt={i % 3 === 1} />)}
          </div>
        </section>
      )
    }
  </article>
</Base>
```
The `.notice` with a hatch layer needs `position: relative` (`.has-tone` gives it) and its text above the tone (the `.has-tone > :not(...)` rule gives it). The content guard still forbids media on `work/tanami/`: the Tanami entry has no cover or gallery, so none renders; `npm run check:dist` enforces it.

- [ ] **Step 4: Verify and look**

```bash
npm run verify && npm run e2e
```
Screenshot `/work/`, `/work/tanami/`, `/work/cuspio/` at 1440x900 and 360x740 and confirm: Tanami card hatched with a "Confidential" caption; the timeline alternates sides around a central spine at desktop and is a single column on phone; the Tanami page shows the hatched notice and no image; `check-dist` reports the Tanami page clean.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: work spreads, hatched confidential notice and alternating timeline spine"
```

---

### Task 7: About and journey pages

**Files:**
- Modify: `src/pages/about.astro`, `src/components/JourneyView.astro`, `src/styles/components.css` (chapter and facts rules)

**Interfaces:**
- Produces: `.chapter` as an alternating two-panel spread with a vertical chapter label, a big outlined numeral and a drop cap; facts strip as caption bubbles; optional portrait panel on About (auto-detected `src/assets/portrait.{png,jpg,jpeg,webp}`); "Next journey" bleed panel.

- [ ] **Step 1: Chapter and facts styles**

In `src/styles/components.css` replace the `.facts*`, `.chapter*` rules with:
```css
/* ---------- facts strip ---------- */
.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0;
}
.facts > div {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  border: var(--rule);
  background: var(--paper);
  box-shadow: 4px 4px 0 var(--ink);
}
[dir='rtl'] .facts > div {
  box-shadow: -4px 4px 0 var(--ink);
}
.facts dt {
  color: var(--tone);
  font: 700 0.7rem/1.4 var(--font-body);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.facts dd {
  margin: 0;
  font-weight: 600;
}

/* ---------- chapters: text panel + side panel, alternating ---------- */
.chapter {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--gutter);
  align-items: stretch;
}
.chapter__side {
  position: relative;
  grid-column: span 12;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 0.5rem;
  min-block-size: 7rem;
  padding: 1rem;
  border: var(--rule);
  overflow: hidden;
  isolation: isolate;
}
.chapter__no {
  position: relative;
  z-index: 1;
  font: 400 1rem/1 var(--font-display);
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--tone);
}
.chapter__num {
  position: absolute;
  inset-inline-end: -0.05em;
  inset-block-end: -0.2em;
  z-index: 0;
  font: 400 clamp(7rem, 16vw, 13rem) / 1 var(--font-display);
  color: transparent;
  -webkit-text-stroke: 3px var(--ink);
  opacity: 0.9;
  pointer-events: none;
  user-select: none;
}
.chapter__text {
  grid-column: span 12;
  display: grid;
  gap: 1rem;
  padding: clamp(1rem, 3vw, 2rem);
  border: var(--rule);
  background: var(--paper);
  box-shadow: var(--shadow-ink);
}
[dir='rtl'] .chapter__text {
  box-shadow: -6px 6px 0 var(--ink);
}
.chapter__date {
  color: var(--tone);
  font-size: 0.9rem;
}
@media (min-width: 48rem) {
  .chapter__side {
    grid-column: 1 / span 4;
  }
  .chapter__text {
    grid-column: 5 / -1;
  }
  .chapter--alt .chapter__side {
    grid-column: 9 / -1;
  }
  .chapter--alt .chapter__text {
    grid-column: 1 / span 8;
    grid-row: 1;
  }
  .chapter__no {
    writing-mode: vertical-rl;
  }
}
.chapter__portrait {
  grid-column: span 12;
}
@media (min-width: 48rem) {
  .chapter__portrait {
    grid-column: 9 / -1;
  }
}
```

- [ ] **Step 2: Rewrite `src/pages/about.astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import type { ImageMetadata } from 'astro';
import Base from '../layouts/Base.astro';
import Timeline from '../components/Timeline.astro';
import InkRule from '../components/InkRule.astro';
import Frame from '../components/Frame.astro';
import Panel from '../components/Panel.astro';
import Sfx from '../components/Sfx.astro';
import { byOrder, published } from '../lib/content';
import { site } from '../data/site';
import { skills } from '../data/skills';
import { jsonLdScript, personLd } from '../lib/jsonld';

const timeline = published(await getCollection('timeline'));
const chapters = byOrder(published(await getCollection('about')));
const rendered = await Promise.all(chapters.map(async (c) => ({ c, Content: (await render(c)).Content })));
const splats = ['splat-a', 'splat-b', 'splat-c'] as const;
// An optional portrait: drop a file at src/assets/portrait.(png|jpg|jpeg|webp) and it appears beside chapter one.
const portraits = import.meta.glob<{ default: ImageMetadata }>('../assets/portrait.{png,jpg,jpeg,webp}', { eager: true });
const portrait = Object.values(portraits)[0]?.default;
---
<Base title="About" description="The story of Ali Khalaf: a software engineer from Bahrain who learns by building.">
  <script slot="head" type="application/ld+json" set:html={jsonLdScript(personLd())} />
  <div class="wrap stack">
    <header class="page-head has-tone" style="position: relative">
      <Sfx word="HELLO" rotate="-5deg" />
      <h1>About</h1>
      <dl class="facts">
        <div><dt>Name</dt><dd>{site.name}</dd></div>
        <div><dt>Role</dt><dd>{site.role}</dd></div>
        <div><dt>Based in</dt><dd>{site.location}</dd></div>
        <div><dt>Languages</dt><dd>{skills.languages.join(', ')}</dd></div>
        <div>
          <dt>Elsewhere</dt>
          <dd>
            <a href={site.links.github} rel="me noopener">GitHub</a>{' · '}
            <a href={site.links.linkedin} rel="me noopener">LinkedIn</a>
          </dd>
        </div>
      </dl>
    </header>

    {
      rendered.map(({ c, Content }, i) => (
        <>
          {i > 0 && <InkRule variant={splats[i % 3]} />}
          <article class:list={['chapter', i % 2 === 1 && 'chapter--alt']} data-reveal>
            {i === 0 && portrait ? (
              <div class="chapter__portrait">
                <Frame src={portrait} alt={`Portrait of ${site.name}`} tilt eager sizes="(min-width: 48rem) 30vw, 100vw" />
              </div>
            ) : (
              <div class="chapter__side has-tone">
                <span class={i % 2 === 0 ? 'tone-mid' : 'tone-fine'} aria-hidden="true"></span>
                <p class="chapter__no">Chapter {i + 1}</p>
                <span class="chapter__num" aria-hidden="true">{i + 1}</span>
              </div>
            )}
            <div class="chapter__text">
              <h2>{c.data.title}</h2>
              <div class="prose dropcap"><Content /></div>
            </div>
          </article>
        </>
      ))
    }

    <InkRule variant="splat-b" />
    <section class="stack" aria-labelledby="stack">
      <h2 id="stack">Stack<InkRule variant="draw" /></h2>
      <Panel tone="fine" weight={4}>
        <div class="panel__body"><ul class="chips" aria-label="Stack">{skills.stack.map((s) => <li>{s}</li>)}</ul></div>
      </Panel>
    </section>

    <section class="stack" aria-labelledby="timeline-title">
      <h2 id="timeline-title">Timeline<InkRule variant="draw" /></h2>
      <Timeline entries={timeline} alternate />
    </section>
  </div>
</Base>
```
When the portrait is used for chapter one, chapter one's `chapter__text` must still occupy columns 1-8: the `.chapter` (not `--alt`) rules place `.chapter__text` at `5 / -1`; for the portrait variant add in `components.css`:
```css
@media (min-width: 48rem) {
  .chapter:has(.chapter__portrait) .chapter__text {
    grid-column: 1 / span 8;
    grid-row: 1;
  }
}
```

- [ ] **Step 3: Rewrite `src/components/JourneyView.astro`**

```astro
---
import { render, type CollectionEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import type { DevlogItem } from '../lib/journal';
import Devlog from './Devlog.astro';
import InkRule from './InkRule.astro';
import Panel from './Panel.astro';
import Sfx from './Sfx.astro';

interface Props {
  title: string;
  chapters: CollectionEntry<'journeys'>[];
  backHref: string;
  next?: { title: string; href: string };
  devlog?: DevlogItem[];
}
const { title, chapters, backHref, next, devlog = [] } = Astro.props;
const rendered = await Promise.all(
  chapters.map(async (chapter) => ({ chapter, Content: (await render(chapter)).Content })),
);
const month = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const splats = ['splat-a', 'splat-b', 'splat-c'] as const;
---
<Base title={`${title}: the journey`} description={`The story behind ${title}, told in chapters.`}>
  <div class="wrap stack">
    <p><a class="back" href={backHref}>About {title}</a></p>
    <header class="page-head has-tone" style="position: relative">
      <Sfx word="LOG" rotate="-5deg" />
      <h1>{title}: the journey</h1>
    </header>
    {
      rendered.map(({ chapter, Content }, i) => (
        <>
          {i > 0 && <InkRule variant={splats[i % 3]} />}
          <article class:list={['chapter', i % 2 === 1 && 'chapter--alt']} data-reveal>
            <div class="chapter__side has-tone">
              <span class={i % 2 === 0 ? 'tone-mid' : 'tone-fine'} aria-hidden="true"></span>
              <p class="chapter__no">Chapter {i + 1}</p>
              <span class="chapter__num" aria-hidden="true">{i + 1}</span>
            </div>
            <div class="chapter__text">
              <h2>{chapter.data.title}</h2>
              {chapter.data.date && <p class="chapter__date">{month(chapter.data.date)}</p>}
              <div class="prose dropcap"><Content /></div>
            </div>
          </article>
        </>
      ))
    }
    <Devlog items={devlog} />
    {
      next && (
        <Panel href={next.href} bleed="end" weight={4} tone="fine" class="next-panel has-tone">
          <Sfx word="NEXT" rotate="-3deg" />
          <div class="panel__body">
            <p class="panel__meta">Next journey</p>
            <p class="panel__title">{next.title}</p>
            <span class="panel__more" aria-hidden="true">Read on</span>
          </div>
        </Panel>
      )
    }
  </div>
</Base>
```

- [ ] **Step 4: Verify and look**

```bash
npm run verify && npm run e2e
```
Then prove the journey template with a throwaway fixture: set `journey: true` on `src/content/games/smobb.md`, create `src/content/journeys/smobb/01-test.md` (`project: smobb`, `order: 1`, `title: Test chapter`, body of three sentences) and `02-test.md` (`order: 2`), build, screenshot `/personal/games/smobb/journey/` and `/about/` at 1440x900 and 360x740, and confirm with the Read tool: chapters alternate side panels left/right with a giant outlined numeral and a drop cap on the first paragraph; splat dividers between chapters; the About facts strip is a row of boxed captions; the timeline alternates around a spine. Then REVERT the fixture (`git checkout src/content/games/smobb.md && rm -rf src/content/journeys/smobb`) and rebuild; `git status --short` must show only the task's files.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: chaptered spreads with drop caps for About and journeys"
```

---

### Task 8: Journal strips, contact, 404, nav, footer, resume screen

**Files:**
- Modify: `src/pages/journal/index.astro`, `src/pages/journal/[id].astro`, `src/pages/journal/tag/[tag].astro`, `src/components/JournalTicker.astro`, `src/components/Devlog.astro`, `src/pages/contact.astro`, `src/pages/404.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`, `src/pages/resume.astro`, `src/styles/journal.css`, `src/styles/nav.css`, `src/styles/print.css`

**Interfaces:**
- Produces: `.strips` (tall narrow entry panels with a vertical date); nav as an inked strip with a stamped brand; footer with a paper tone strip; contact as one shout bubble plus the three panels; 404 with a thought bubble and the `HUH?` word; resume screen view framed, print output unchanged.

- [ ] **Step 1: Strips**

Replace the `.stamp`, `.entries`, `.entry__link*`, `.pager` rules in `src/styles/journal.css` with:
```css
/* ---------- date stamp ---------- */
.stamp {
  margin: 0;
  font: 400 clamp(2rem, 7vw, 3.25rem) / 1 var(--font-display);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* ---------- strips: tall narrow panels, the date runs vertically ---------- */
.strips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 11rem), 1fr));
  gap: var(--gutter);
  margin-block-end: 0;
  margin-inline: 0;
  padding: 0;
  list-style: none;
}
.strip__link {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  min-block-size: 14rem;
  padding: 0.9rem;
  border: var(--rule);
  background: var(--paper);
  color: var(--ink);
  box-shadow: 4px 4px 0 var(--ink);
  text-decoration: none;
  isolation: isolate;
  transition:
    background var(--t-fast),
    color var(--t-fast);
}
[dir='rtl'] .strip__link {
  box-shadow: -4px 4px 0 var(--ink);
}
.strip__date {
  margin: 0;
  font: 400 1.1rem/1 var(--font-display);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  writing-mode: vertical-rl;
  padding-inline-end: 0.6rem;
  border-inline-end: 2px solid currentColor;
}
.strip__text {
  color: var(--tone);
  font-size: 0.9rem;
  display: -webkit-box;
  -webkit-line-clamp: 7;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.strip__link:hover,
.strip__link:focus-visible {
  background: var(--ink);
  color: var(--paper);
}
.strip__link:hover .strip__text,
.strip__link:focus-visible .strip__text {
  color: var(--paper);
}
.strip__link .speed {
  inset: -30%;
}
.strip__link:hover .speed,
.strip__link:focus-visible .speed {
  opacity: 0.16;
}

/* ---------- pager ---------- */
.pager {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
}
.pager .bubble--caption {
  font-size: 0.85rem;
}
.entry-panel {
  display: grid;
  gap: 1.25rem;
}
```
Add a shared partial for a strip so the index, tag page, ticker and devlog render the same markup. Create `src/components/Strip.astro`:
```astro
---
import { formatDay } from '../lib/dates';

interface Props {
  href: string;
  date: Date;
  text: string;
  index?: number;
}
const { href, date, text, index } = Astro.props;
---
<li class="strip" data-reveal style={`--i: ${index ?? 0}`}>
  <a class="strip__link" href={href}>
    <span class="speed" aria-hidden="true"></span>
    <p class="strip__date"><time datetime={date.toISOString().slice(0, 10)}>{formatDay(date)}</time></p>
    <p class="strip__text">{text}</p>
  </a>
</li>
```
Then:
- `src/pages/journal/index.astro`: import `Strip` and `Spread`/`Sfx`; wrap `<h1>` and lede in `<header class="page-head has-tone" style="position: relative"><Sfx word="LOG" rotate="-5deg" /> ... </header>`; replace the `<ol class="entries">…</ol>` with `<ol class="strips">{entries.map((e, i) => <Strip href={`/journal/${e.id}/`} date={e.data.date} text={excerpt(e.body ?? '', 220)} index={i} />)}</ol>`; the empty state becomes `<Bubble shape="caption" as="p">No entries yet. The first strip is coming.</Bubble>`; drop the `DateStamp` import if unused. Tags list keeps `class="chips"`.
- `src/pages/journal/tag/[tag].astro`: same strips replacement.
- `src/components/JournalTicker.astro`: replace the `<ol class="entries">…</ol>` with `<ol class="strips">{latest.map((e, i) => <Strip ... index={i} />)}</ol>` (import `Strip`, remove `DateStamp`).
- `src/components/Devlog.astro`: replace its list with `<ol class="strips">{items.map((i, n) => <Strip href={i.href} date={i.date} text={i.text} index={n} />)}</ol>` (import `Strip`, remove `formatDay`).
- `src/pages/journal/[id].astro`: wrap the article body: `<DateStamp date={entry.data.date} as="h1" />` stays; put the tags, content and project link inside `<Panel weight={4} shadow><div class="panel__body entry-panel"> … <div class="prose dropcap"><Content /></div> … </div></Panel>` (import `Panel`); the pager links become caption bubbles: `<Bubble shape="caption" as="a" href={...}>Older: …</Bubble>` / `Newer`. Import `Bubble`.
- `grep -rn 'class="entries"\|class="entry"' src` must print nothing afterwards.

- [ ] **Step 2: Nav and footer**

Replace `src/styles/nav.css` with:
```css
/* ---------- nav: inked strip, stamped brand ---------- */
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
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border: var(--rule);
  box-shadow: 3px 3px 0 var(--ink);
  font: 400 1.35rem/1 var(--font-display);
  letter-spacing: 0.03em;
  text-decoration: none;
  text-transform: uppercase;
  rotate: -2deg;
  transition: rotate var(--t-fast);
}
[dir='rtl'] .nav__brand {
  box-shadow: -3px 3px 0 var(--ink);
  rotate: 2deg;
}
.nav__brand:hover,
.nav__brand:focus-visible {
  rotate: 0deg;
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
  position: relative;
  text-decoration: none;
}
.nav__list a::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  inset-block-end: -0.2em;
  block-size: 3px;
  background: var(--ink);
  scale: 0 1;
  transform-origin: left;
  transition: scale var(--t-fast) var(--ease-out);
}
[dir='rtl'] .nav__list a::after {
  transform-origin: right;
}
.nav__list a:hover::after,
.nav__list a:focus-visible::after,
.nav__list a[aria-current='page']::after {
  scale: 1 1;
}
.nav__cta {
  margin-inline-start: auto;
}
@media (max-width: 40rem) {
  .nav__brand {
    flex: 1 0 auto;
  }
  .nav__contact {
    display: none;
  }
}

/* ---------- footer ---------- */
.footer {
  position: relative;
  margin-block-start: 3rem;
  padding-block: 2rem;
  background: var(--ink);
  color: var(--paper);
  isolation: isolate;
}
.footer > .tone-fine {
  z-index: 0;
}
.footer__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  align-items: center;
  justify-content: space-between;
}
.footer ul {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
```
In `src/components/Footer.astro` add `<span class="tone-fine tone--paper" aria-hidden="true"></span>` as the first child of `<footer>`. `Nav.astro` markup is unchanged (the active-link underline now comes from the `::after`), except: remove nothing, but add `transition:animate="none"` to the `<header class="nav">` element so the nav does not take part in the page wipe.

- [ ] **Step 3: Contact and 404**

`src/pages/contact.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Bubble from '../components/Bubble.astro';
import CopyEmail from '../components/CopyEmail.astro';
import WorkWithMe from '../components/WorkWithMe.astro';
import Sfx from '../components/Sfx.astro';
import { site } from '../data/site';
---
<Base title="Contact" description="How to reach Ali Khalaf about roles and freelance projects.">
  <div class="wrap stack">
    <header class="page-head has-tone" style="position: relative">
      <Sfx word="HELLO" rotate="-5deg" />
      <h1>Get in touch</h1>
    </header>
    <Bubble shape="shout" class="pop contact__bubble">
      <p class="contact__lead">Email is best.</p>
      <CopyEmail />
    </Bubble>
    <ul class="chips" aria-label="Elsewhere">
      <li><a href={site.links.github} rel="me noopener">GitHub</a></li>
      <li><a href={site.links.linkedin} rel="me noopener">LinkedIn</a></li>
    </ul>
  </div>
  <WorkWithMe />
</Base>
```
Add to `components.css`:
```css
.contact__bubble {
  justify-self: start;
  max-inline-size: 100%;
}
.contact__lead {
  margin: 0 0 0.75rem;
  font: 400 1.5rem/1 var(--font-display);
  text-transform: uppercase;
}
.contact__bubble .email {
  font-family: var(--font-body);
  text-transform: none;
}
```
`src/pages/404.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Bubble from '../components/Bubble.astro';
import Sfx from '../components/Sfx.astro';
---
<Base title="Page not found" description="That page does not exist." noindex>
  <div class="wrap stack has-tone" style="position: relative">
    <span class="tone-coarse" aria-hidden="true"></span>
    <Sfx word="HUH?" rotate="-8deg" />
    <Bubble shape="thought" class="pop">
      <h1>Page not found</h1>
      <p>This panel is blank. The page you wanted is not here.</p>
    </Bubble>
    <p class="email">
      <Bubble shape="caption" as="a" href="/">Home</Bubble>
      <Bubble shape="caption" as="a" href="/work/">Work</Bubble>
      <Bubble shape="caption" as="a" href="/personal/">Personal</Bubble>
      <Bubble shape="caption" as="a" href="/journal/">Journal</Bubble>
    </p>
  </div>
</Base>
```
The `.tone-coarse` sits behind the `h1`/bubble only (the bubble has its own paper fill); body text inside the bubble is on paper, so the contrast rule holds.

- [ ] **Step 4: Resume screen view**

In `src/pages/resume.astro` wrap each `<section>` content in a panel look without changing the print output: add class `resume__section` to every `<section>` and append to `components.css`:
```css
@media screen {
  .resume__section {
    padding: clamp(1rem, 3vw, 1.75rem);
    border: var(--rule);
    background: var(--paper);
    box-shadow: var(--shadow-ink);
  }
  [dir='rtl'] .resume__section {
    box-shadow: -6px 6px 0 var(--ink);
  }
}
```
`print.css` already resets `.timeline`; add `.resume__section { border: 0; padding: 0; box-shadow: none; }` inside its `@media print` block for safety. Regenerate the PDF (`npm run build && npm run resume:pdf`, port 4322 free before and after), open it with the Read tool and confirm it is unchanged in content: two A4 pages, no borders around sections, real email, no phone, Tanami role line only. Commit the regenerated PDF only if its bytes changed (`git status`).

- [ ] **Step 5: Verify and look**

```bash
npm run verify && npm run e2e
```
With a throwaway journal entry (`src/content/journal/2026-10-24.md`, `date: 2026-10-24`, `tags: [rust]`, `project: smobb`, a 60-word body) build and screenshot `/journal/`, `/journal/2026-10-24/`, `/` (ticker), `/contact/`, `/404.html` at 1440x900 and 360x740; confirm: strips are tall panels with the date running vertically; the entry page is a framed panel with a drop cap and caption-bubble pager; contact is one shout bubble with the copy button inside; the 404 shows a thought bubble over coarse tone with a giant outlined HUH?; the nav brand is a tilted stamp and the active link has an ink underline. Delete the throwaway entry and rebuild; `git status --short` shows only the task's files.

- [ ] **Step 6: Commit**

```bash
git add src public/Ali-Khalaf-CV.pdf
git commit -m "feat: journal strips, shout contact, thought-bubble 404, stamped nav"
```

---

### Task 9: Phase 4 gate

**Files:** none new (fixes only if a gate fails).

- [ ] **Step 1: Full gates from a clean install**

```bash
rm -rf node_modules dist .astro
npm ci
npm run verify
npm run e2e
npm run lighthouse
```
Expected: all pass; Lighthouse performance and accessibility at or above 0.95 on the four pages; budget under 200000. If Lighthouse drops below 0.95 on accessibility, the usual culprits in this redesign are: outlined SFX text (must be `aria-hidden`), caption bubbles used as links without discernible names, contrast of `--tone` text on tone layers (move the text off the tone), heading order (the `h3` panel titles inside Work-with-me under an `h2` are fine). Fix the cause, never the threshold.

- [ ] **Step 2: Content guard and spec checks**

```bash
git grep -nIiE 'claude|anthropic|copilot|chatgpt|openai|superpowers|36000253|@gmail\.com' -- . ':!docs' ':!package-lock.json'   # empty
grep -rhoE 'class="sfx[^"]*"[^>]*><span>[^<]+' dist | sed 's/.*<span>//' | sort -u          # only WORK PLAY LAB LOG HELLO NEXT HUH?
grep -c '<img\|<picture\|<video\|<iframe\|<svg' dist/work/tanami/index.html                  # the only svg allowed is the #ink filter defs + splats/sfx: confirm no <img>
```
Confirm no `<img>` on `dist/work/tanami/index.html`.

- [ ] **Step 3: Walk the site**

Serve `dist` (`npx astro preview --host 127.0.0.1 --port 4400 --ignore-lock`) for the owner and screenshot every route in `e2e/layout.spec.ts` at 1440x900, 1280x720 and 360x740 into `~/Documents/portfolio-preview/` (overwrite). Look at each with the Read tool and list anything that reads as broken (overlap, clipping, invisible text, a tone behind body text). Fix and re-run the gates. Leave the preview on 4400 running for the owner; everything on 4321/4322 stopped.

- [ ] **Step 4: Tag**

```bash
git tag phase-4
```

---

## Self-Review (completed)

**Spec coverage:** panel system (spreads, spans, bleed, slant token, border weights, inked edge, tilt, phone collapse) → Task 3; screentone densities, gradient, hatch, "never behind body text" → Task 2 and usage rules in every page task; typography scale, SFX words, vertical labels, drop caps, display numerals → Tasks 2-3, 7; speed lines, splat dividers, ink underline draw, halftone frames (with the dark-image rule), image frames with offset shadow and caption tag → Tasks 3, 5; bubbles (round with SVG tail, shout, thought, caption, pop-in) → Task 2; motion tokens, page wipe with RTL/back mirroring, panel reveal with stagger, hero sequence once per session, hover states, reduced-motion → Tasks 1, 3, 4; empty and loading states (initial panel, journal empty bubble, shout Play) → Tasks 3, 5, 8; page-by-page: landing (4), work index/detail (3, 6), personal index (3), project page incl. next-project panel (5), play page (5), journey (7), about incl. portrait slot (7), journal index/entry (8), contact (8), resume screen (8), 404 (8); constraints (content rules, logical CSS, 360px, contrast, keyboard, budget, Lighthouse, no new dependency) → Global Constraints and Task 9. Out of scope items untouched.

**Deviations from the spec, stated:** the page wipe has no separate thin ink leading edge (a clip-path reveal cannot carry a border without an extra snapshot layer; the paper-on-paper diagonal reads as a page turn on its own). The halftone on images stays CSS dots (multiply, or screen on dark images) rather than an SVG `feImage` halftone, for cost and browser consistency.

**Placeholder scan:** none; owner-dependent step is only the optional portrait file.

**Type consistency:** `Spread`/`Panel`/`Bubble`/`Sfx`/`InkRule`/`Frame`/`Strip` props, `nextProject(refs, kind, id)`, `isDark(img)`/`isDarkBuffer(data)`, class names (`.spread--*`, `.panel--w*`, `.has-tone`, `.tone-*`, `.hatch`, `.sfx`, `.chips`, `.dropcap`, `.strips`, `.strip__*`, `.hero-spread__*`, `.gallery`, `.frame--*`, `.chapter--alt`, `.timeline--alt`, `.next-panel`) are used with the same names across tasks.
