# Manga redesign: "Printed Page"

Visual and motion upgrade of the portfolio. Supersedes the "Visual theme" and "UX path" sections of `2026-10-25-portfolio-design.md`; every other rule there (content rules, privacy, identity, accessibility, performance budget, RTL, draft handling) still binds.

## Why

Review of the built site (24 pages, screenshots in `~/Documents/portfolio-preview/`) found it tidy but generic:

- Every surface is a rectangle on a uniform grid. Nothing bleeds, overlaps, tilts or varies in weight. It reads as a template with a bold font, not as a manga page.
- The halftone is nearly invisible (10% opacity, one dot size). There is no screentone hierarchy, no hatching, no gradient tone.
- The landing split is the only composed moment; every other page is heading, paragraph, grid.
- Zero motion beyond hover inversion. No page transitions, no reveals, no "ink".
- Cards without media are empty boxes. Project pages are text columns with three buttons.
- Headings are all the same scale and treatment; no SFX lettering, no vertical labels except the chapter numbers, no drop caps.

Target: a site that looks like a printed, inked manga page the moment it loads, moves with purpose, and stays fast, readable and accessible.

## Decisions (owner, 2026-10-25)

- Direction: **printed manga page** (irregular panels, bleed, inked borders, screentone, SFX type, speed lines, page-turn transitions).
- Motion: **rich but purposeful**. Every transition under 600 ms, every reveal once, everything static under `prefers-reduced-motion`.
- Theme: **paper-white only**. No dark mode.
- Palette unchanged: paper `#fafafa`, ink `#0a0a0a`, tone grey `#5c5c5c`, flat tone `#e6e6e6`. No accent colour. Red is reserved and unused.
- Still no JavaScript framework or animation library. CSS, SVG, Astro's built-in View Transitions, and small inline scripts only. Landing stays under the 200 KB transfer budget; Lighthouse stays at or above 95.

## Design language

### 1. Panel system

A page is a sequence of **spreads**. Each spread is a CSS grid with a named layout; panels span cells irregularly and some bleed to the viewport edge.

- Grid: 12 columns, auto rows, gutter `var(--gutter)`. Layouts are named classes on the spread: `spread--hero`, `spread--3up`, `spread--feature-left`, `spread--feature-right`, `spread--stack`. Index pages rotate through layouts so no two consecutive spreads match.
- Spans: panels declare `panel--w2`, `panel--w3`, `panel--tall`, `panel--bleed-start`, `panel--bleed-end`. Bleed panels extend to the viewport edge using negative `margin-inline` and lose that side's border.
- Slanted gutters: a spread can set `--slant: 6deg`; adjacent panels get mirrored `clip-path` polygons so the gutter runs diagonally (the landing doors already do this; generalise it).
- Borders: default 3 px ink. Feature panels 5 px. Panels in the same spread vary 3/4/5 px deliberately.
- Inked edge: a single SVG filter (`#ink`, `feTurbulence` + `feDisplacementMap`, scale 1.5) applied to panel borders through an absolutely positioned pseudo-element so straight CSS borders look hand-drawn. Applied only at desktop widths and only to feature panels (filters are costly); plain borders elsewhere.
- Slight rotation: at most one panel per spread may carry `panel--tilt` (`rotate(-1.2deg)`), never on text-heavy panels.
- Phone (under 48 rem): spreads collapse to one column; bleed becomes full width; slant and tilt are removed; borders stay.

### 2. Screentone

Three tone densities and two tone types, all CSS, all `pointer-events: none`:

- `.tone-fine` 4 px dots, `.tone-mid` 6 px, `.tone-coarse` 10 px. Opacity 0.18, 0.22, 0.28 (the current 0.10 is invisible; these are tested against 4.5:1 text contrast by placing tones only behind display type or on empty areas).
- `.tone-grad` radial gradient tone: dots that fade from dense to none across the element (`mask-image: linear-gradient(...)` over a dot layer). Used on hero backgrounds and section tails.
- `.hatch` diagonal line tone (`repeating-linear-gradient`, 45 deg, 1 px ink / 5 px gap) for panel corners and the "confidential" notice.
- Rule: body text never sits on tone. Tone sits behind display type, inside empty panel corners, on door backgrounds, and on image frames.

### 3. Typography

Two families stay (Anton display, Inter body). The upgrade is scale and treatment:

- Display scale: `h1` `clamp(3rem, 11vw, 7.5rem)`; section `h2` `clamp(2.25rem, 6vw, 4rem)`; panel titles `clamp(1.5rem, 2.4vw, 2.1rem)`. Tighter leading (0.92) and tracking (0.01em).
- **SFX words**: decorative, `aria-hidden`, outlined display text (`-webkit-text-stroke: 2px var(--ink); color: transparent`), skewed `-6deg`, scaled 2-3x, positioned behind section headings and partially clipped by the panel. One per spread at most. Words come from the section: WORK, PLAY, LAB, LOG, HELLO, NEXT.
- **Vertical labels**: `writing-mode: vertical-rl` chapter and section labels on the spread's start edge (already used for chapters; extend to index sections and journey pages).
- **Drop caps**: first letter of each About chapter and journey chapter, display face, 3-line drop, ink square behind it.
- **Numerals**: dates and "Last worked" set in display face at small size with tracking 0.1em, like panel captions.
- Body copy unchanged: Inter, 1rem/1.6, measure 68ch.

### 4. Ink and effects

- **Speed lines** (`.speed`): a radial burst of thin lines from a focal point (`repeating-conic-gradient` masked to a circle). States: hidden; on hover of a card or door it fades in over 200 ms behind the content; on the landing hero it sits behind the name at 30% and never moves.
- **Motion lines** (`.whoosh`): horizontal hatch that trails a panel while it reveals; removed after the reveal ends.
- **Ink splat dividers**: three SVG splat shapes (`splat-a/b/c`, inline symbols, under 1 KB each) replace the current `hr.wash` between chapters and sections, alternating.
- **Ink underline draw**: section headings get an SVG stroke under them that draws itself in 400 ms when the heading enters the viewport (`stroke-dashoffset` animation, scroll-driven where supported, otherwise on load).
- **Halftone images**: screenshots get a real halftone treatment with an SVG filter (`#halftone`: `feColorMatrix` to luminance, then a dot `feImage` pattern with `feComposite`), plus grayscale. On hover/focus/click the filter lifts over 250 ms to full colour. Falls back to the current grayscale + overlay where SVG filters on images are too slow (phone).
- **Image frames**: images sit in a panel with a 4 px border, a 6 px ink drop-shadow offset `(6px, 6px)` (no blur), and optional tilt; captions sit in a small inked tag overlapping the frame's bottom-left corner.

### 5. Speech bubbles

Component `Bubble` with `shape: round | shout | thought | caption`:

- `round`: current bubble, improved tail (SVG path, not a rotated square), tail position prop `start | center | end`.
- `shout`: jagged outline (SVG polygon, 16 spikes), used for the landing name and for "Play" calls to action.
- `thought`: cloud outline with three trailing circles; used once, on the 404 page.
- `caption`: rectangular box with a thick ink border, used for dates and chapter numbers inside panels.
- All bubbles pop in: `scale(0.92) -> 1` with a 180 ms ease-out and a 1-frame overshoot, once, on first paint (not on scroll).

### 6. Motion system

Tokens: `--t-fast: 160ms`, `--t-base: 280ms`, `--t-slow: 520ms`; easing `--ease-out: cubic-bezier(.2,.8,.2,1)`, `--ease-snap: cubic-bezier(.3,1.4,.4,1)` (the overshoot).

- **Route transitions** (Astro `<ClientRouter />`): a **page wipe**. The old page is covered by an ink panel sweeping diagonally from the start edge (clip-path polygon, 360 ms), then the new page is revealed by the same wipe retreating (360 ms). The nav persists (`transition:persist`). Direction mirrors in RTL. Back navigation sweeps the opposite way. Total under 600 ms; the wipe is paper-coloured with a thin ink leading edge, not solid black, so it reads as a page turn rather than a blackout.
- **Panel reveal**: panels enter with `opacity 0 -> 1`, `translateY(1.25rem) -> 0`, and a 60 ms stagger per panel within a spread, driven by `animation-timeline: view()` where supported and by an `IntersectionObserver` fallback (one 20-line inline script) elsewhere. Runs once per panel.
- **Hero sequence** (landing only, 900 ms total): speed lines fade in (0-200), name bubble pops (150-330), subtitle fades (300-450), doors slide in from their outer edges (350-700), Work-with-me block fades (700-900). Skipped entirely if the visitor has already seen it this session (`sessionStorage`), so back-navigation is instant.
- **Hover/focus states**: card lifts 2 px with the shadow growing to 10 px offset, speed lines fade in behind, the title gains an ink underline; door hover inverts and shows speed lines; buttons shift 2 px into their shadow on press.
- **Ink draw**: heading underlines and the timeline spine draw in on first view.
- **Reduced motion**: a single `@media (prefers-reduced-motion: reduce)` block disables all of the above; the page wipe becomes a 120 ms cross-fade; nothing is hidden behind an animation (all elements end visible).
- Nothing loops forever. No ambient motion. No scroll hijacking. No cursor effects.

### 7. Empty and loading states

- A project card without a cover shows an **initial panel**: a coarse tone background, the project's first letter in display type at 6 rem, outlined, and the status badge. No card is ever a blank rectangle.
- Journal with no entries shows a single caption bubble ("No entries yet. The first strip is coming.") inside an empty panel with tone.
- Game player before Play: the poster (or the initial panel) with a shout bubble "PLAY" as the button.

## Components

New or rewritten (`src/components/`), all `.astro`, no framework:

| Component | Props | Notes |
|---|---|---|
| `Spread` | `layout`, `slant?`, `label?` (vertical label text), `sfx?` (decorative word) | Grid container; renders the vertical label and SFX word. |
| `Panel` | `w` (1-3), `tall?`, `bleed?` (`start`/`end`), `tilt?`, `weight` (3/4/5), `tone?`, `href?` | Base surface; link variant handles hover/focus states and speed lines. |
| `Bubble` | `shape`, `tail?`, `as?` | Replaces `SpeechBubble`. |
| `Sfx` | `word`, `skew?` | Decorative outlined word, `aria-hidden`. |
| `InkRule` | `variant` (`splat-a/b/c`, `draw`) | Replaces `hr.wash` and adds the drawn underline. |
| `Frame` | `src`, `alt`, `caption?`, `tilt?`, `eager?` | Replaces `Shot`; halftone filter, colour on interaction, caption tag. |
| `ProjectCard` | existing props + `index` (for stagger and layout rotation) | Rebuilt on `Panel`; initial panel when no cover. |
| `StatusBadge` | unchanged | Restyled as a caption bubble. |
| `Nav` | unchanged | Becomes a thin inked strip with the brand as a stamp; CTA as a small shout bubble; persists across transitions. |
| `PageWipe` | none | Injects the View Transition names and the wipe keyframes; included once in `Base`. |
| `Reveal` | none | The IntersectionObserver fallback script, included once in `Base`. |

Removed: `SpeechBubble` (folded into `Bubble`), `Shot` (folded into `Frame`). CSS moves from one growing `manga.css` to `styles/{tokens,base,panels,tone,type,motion,components}.css`, each under 300 lines.

## Page by page

- **Landing**: full-bleed hero spread: speed-line burst behind a shout bubble with the name; the two doors keep their diagonal split but gain tone, SFX words (WORK / PLAY) half-clipped behind them, and the slide-in; below, the Work-with-me block becomes a three-panel spread (what / how / contact) with the email in a caption bubble; the journal ticker becomes a "daily strip": three narrow tall panels with the date stamped vertically.
- **Work index**: `spread--feature-left`: Tanami as a wide panel with the hatch tone and the confidential notice set as a caption bubble; CuspIO beside it. Timeline below as an inked spine that draws in, entries as alternating left/right caption panels at desktop, single column on phone.
- **Work detail**: hero panel with the title bleeding off the start edge, role line in a caption bubble, stack as inked chips; CuspIO gallery as a 2-up frame spread; Tanami unchanged in content, styled the same but with no media (rule kept).
- **Personal index**: GAMES and LAB as two spreads with different layouts; the first game panel is wide and tilted; SFX words PLAY and LAB; cards reveal with stagger.
- **Project page**: hero spread with the cover in a tilted frame bleeding off the end edge and the title overlapping it; status/last-worked as caption bubbles; CTA row as shout bubble (Play) plus inked buttons; gallery as a mixed spread (one wide, two narrow); credits as a caption strip; devlog as the daily-strip panels; "Next project" as a bleed panel at the foot (the spec's next-entry link, now implemented).
- **Play page**: the player fills a feature panel; poster behind a shout-bubble PLAY; fullscreen and "open in new tab" as small inked buttons in the panel's bottom tag.
- **Journey**: chapters as alternating spreads (text panel left with image right, then mirrored); drop caps; vertical chapter labels; splat dividers; devlog strip; "Next journey" bleed panel.
- **About**: facts strip as a row of caption bubbles; chapters as in Journey; stack chips in an inked tray; timeline spine as on Work. Space for a portrait panel (tilted frame, halftone) if the owner supplies an image; otherwise an initial panel with "AK".
- **Journal index**: entries as daily strips (tall narrow panels with the vertical date), six per spread; tags as inked chips in a tray panel.
- **Journal entry**: date as a giant stamped heading in a caption panel, body in a reading panel with a drop cap, pager as two caption bubbles.
- **Contact**: one big shout bubble with the email and copy button; the three "work with me" panels; elsewhere links as caption chips.
- **Resume**: screen view gets the panel treatment lightly (print stylesheet unchanged; PDF regenerated only if the markup changes).
- **404**: thought bubble, coarse tone, SFX word "HUH?", the four links as caption chips.

## Constraints that still bind

- All content rules of the base spec (no AI tooling mentions, Tanami role line only, two credentials, identity, email handling, private repos). Decorative SFX words are the only new copy and are limited to the list in §3.
- Logical CSS properties only; RTL mirrors slants, wipes, tails and bleeds. 360 px: no horizontal scroll (the e2e suite stays green).
- Contrast 4.5:1 for all text; tone never behind body text; outlined SFX text is decorative and `aria-hidden`.
- Keyboard: every panel link has a visible focus state (inversion plus outline); the page wipe does not steal focus (focus moves to `main` after a transition).
- Performance: landing under 200 KB transferred; Lighthouse performance and accessibility at or above 95 (measured in CI). SVG filters limited to feature panels and images at desktop widths; `will-change` only during an animation; no layout thrash (transforms and opacity only).
- No new runtime dependency. `<ClientRouter />` comes from Astro.

## Out of scope

Dark mode, custom cursor, sound, scroll-scrubbed storytelling, character illustration (unless the owner supplies art), a third font.

## Owner inputs that would raise the ceiling

- A manga-style portrait or avatar for the About page (optional).
- Preferred SFX vocabulary if the defaults feel off.
- Confirmation after seeing the first built spread (landing) before the rest is rolled out.

## Rollout

One implementation plan, Phase 4, in this order so each step is visible and reviewable: tokens and CSS split → `Panel`/`Spread`/`Bubble`/`Sfx`/`InkRule` → page wipe and reveal → landing → personal index and project page → work pages → about and journey → journal, contact, 404, resume → final review. Every step keeps `npm run verify` and `npm run e2e` green and adds Playwright checks for the wipe (no horizontal overflow mid-transition) and for reduced motion (no animations when the media query is on).
