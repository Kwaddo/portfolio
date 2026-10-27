# Manga book pass

Builds on `2026-10-25-manga-redesign-design.md` (all its rules, tokens and gates still bind) and the base spec's content rules. Goal: the site reads as a printed manga volume, not a web page wearing manga styling.

## Why

Audit of the built site at 1280 and 390 (2026-10-27):

- Cards are web cards: image on top, text block below. Manga panels let art fill the panel and set text in caption boxes over it.
- Cards and About chapters without media show a big outlined letter or number on tone. These read as filler.
- No book chrome: no volume, chapter or page numbering, no "to be continued".
- Every SFX word has the same treatment (outlined Anton, hard shadow).
- Bugs: `KWADDO` clips to "KWADI" in the landing hero at 1280; `HUH?` (meant for 404) sits on the landing Say Hello panel; the Work timeline `WORK` SFX collides with the first timeline entry.

## Decisions (owner, 2026-10-27)

- Directions: book chrome, art-first panels, SFX variety. Not in this pass: narrator figure across pages, katakana or Arabic SFX, full-cover hero.
- SFX stay English only.
- Landing: cover frame around the current hero (not a full-cover redesign).
- No-media cards: title-card panels.
- New decorative words approved: `PSST`, `COPIED!`, `END`, `TO BE CONTINUED`, `VOL. 01`, `CONTENTS`, `CH. 0N`, `CHAPTER 0N`, `AK 2026`. All `aria-hidden` except where a word is the visible text of an existing labelled element (see each section).
- Still no new dependency, font, or framework. CSS, SVG, and existing inline scripts only.

## 0. Fixes

- **Hero word:** `KWADDO` is fully visible at every width from 48rem to 1440 px (the clip at 1280 is a regression of `0f889b3`). Add an e2e check that the SFX box sits inside its panel's box at 1024, 1280 and 1440.
- **Say Hello panel:** `HUH?` is replaced with `PSST`. `HUH?` stays only on 404.
- **Work timeline:** the `WORK` SFX no longer overlaps any timeline entry at 1280 (e2e: bounding boxes do not intersect).

## 1. Book chrome

### Landing cover frame
- `VOL. 01` badge, caption-bubble style, top-start corner of the hero spread.
- Spine: an ink band on the start edge of the hero spread with vertical text `ALI KHALAF · VOL. 01` (`writing-mode: vertical-rl`), `aria-hidden`. Desktop only (48rem and up); hidden on phone.
- Stamp: a round ink-bordered stamp `AK 2026` at the top-end corner, slight rotation, `aria-hidden`. The year comes from the build date, not typed.
- Doors: a small `CONTENTS` label above the split; each door gets a kicker `CH. 01` (Work) and `CH. 02` (Personal) above its heading, `aria-hidden` (the heading text is unchanged).

### Chapter headers
- Each section index page (`/work/`, `/personal/`, `/journal/`, `/about/`, `/contact/`) shows a `CHAPTER 0N` kicker above its h1. N is the page's position in `nav` (`src/lib/nav.ts`), computed, never typed. `aria-hidden`.

### Page numbers
- Every `.spread` on a page gets a page number in its bottom outer corner via a CSS counter (`counter-reset` on `main`, `counter-increment` on `.spread`, rendered with `::after`). Small display-face numeral in a caption tab. Decorative (pseudo-element, not read out). Mirrors in RTL. Hidden in print.
- No JavaScript.

### Next panels
- The `NEXT` panel on project and journey pages becomes a "TO BE CONTINUED" arrow tag: a pointed ink arrow box (clip-path) with `TO BE CONTINUED` and the arrow pointing to the inline end (mirrors in RTL). The link's accessible name stays "Next game: <title>" (or the current equivalent).
- Where there is no next item, the foot shows a non-link `END` caption panel, `aria-hidden`.

### Footer
- The copyright line reads `© <year> Ali Khalaf · Vol. 01`.

## 2. Art-first panels

### Cards with a cover (`ProjectCard`)
- The image fills the whole panel (existing wide/tall ratio rules decide cover vs contain on tone).
- Status badge and title sit in a solid paper caption box with ink border, overlapping the bottom-start corner of the art.
- Meta and summary sit in a narration box (solid paper, ink border) overlapping the bottom edge. "Read more" stays.
- All text is on solid paper or solid ink, never on art or tone: 4.5:1 contrast holds.
- Phone: same overlay; the panel has a minimum art height so the boxes never cover more than about half the art.

### Cards without a cover
- Title-card panel: the project or role name set huge in the display face, skewed, filling the art area, over speed lines (tone-coarse) or hatch (confidential). Meta and summary use the same narration box as cards with covers, so grids stay even.
- `.panel__initial` and `.panel__letter` are removed.

### About chapter panels
- The empty number boxes beside each About chapter become title-card panels: `CH. N` set huge over speed lines, with the vertical `CHAPTER N` label kept.

### Hover and focus (impact frame)
- On hover or focus-visible: the art scales to 1.04 inside the panel (overflow clipped), the speed burst fades in, the border goes up one weight step.
- Reduced motion: only the border change applies.

## 3. SFX variety

### `Sfx` styles
`Sfx` gets a `look` prop (`outline` default, `rough`, `motion`, `burst`):
- `outline`: the current treatment.
- `rough`: the existing `#ink` SVG filter on the glyphs so the edges look hand-inked. Desktop only (matches the filter rule in the base redesign); falls back to `outline` on phone.
- `motion`: two or three trailing copies via offset `text-shadow` along the skew direction, like a whoosh.
- `burst`: the word sits inside the jagged shout polygon (reuse the `Bubble` shout shape), ink fill, paper text.

Placements rotate looks so no page uses the same look twice in a row. Word list grows by `PSST`, `COPIED!`, `END` (the `Sfx` word union is updated to match).

### Emanata
Three placements only, all `aria-hidden`, inline SVG under 1 KB each:
- **Sparkle** next to `LIVE` and `RELEASED` badges.
- **Copy email:** shock lines plus a `COPIED!` SFX pop (`burst` look) when the copy succeeds; removed after 1.2 s. The existing accessible announcement is unchanged.
- **Sweat drop** beside the 404 figure.

## Gates

- `npm run verify` and `npm run e2e` stay green.
- New e2e checks:
  - Each page's page numbers match its spread count.
  - No `.panel__initial` in any built page.
  - axe colour-contrast passes on `/personal/` and `/work/` with the overlay captions.
  - No horizontal scroll at 360 px on every page.
  - Under `prefers-reduced-motion`, hovering a card applies no transform.
  - The hero `KWADDO` box sits inside its panel at 1024, 1280 and 1440.
- Landing stays under the 200 KB budget; Lighthouse performance and accessibility stay at 95 or above.
- Content-rule grep before every commit (phone digits, plain email, AI-tool names) as before.

## Out of scope

Narrator figure across pages, katakana or Arabic SFX, full-cover hero, new fonts or dependencies, journal content (still empty).
