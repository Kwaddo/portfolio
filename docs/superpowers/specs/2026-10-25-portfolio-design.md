# Portfolio: Ali Khalaf

Personal portfolio, journal and game host. Replaces the GitHub Pages usage at `kwaddo.github.io/smobb` with a single root site.

## Goals

- One site with two clearly separated tracks: **Work** (professional) and **Personal** (games, lab).
- A daily-friendly **journal**.
- Playable **games** hosted on the site where technically possible.
- A chaptered **About** story the owner writes over time.
- Black-and-white manga look, pleasant to browse.

## Stack and hosting

- Astro, static output, content collections (markdown) for all entries.
- GitHub repo `Kwaddo/Kwaddo.github.io` (name free as of 2026-10-25; repo not yet created on GitHub). Local folder: `~/Documents/portfolio`.
- GitHub Actions builds Astro and deploys to Pages.
- Large game builds go to GitHub Releases or Git LFS, not plain git.

## Sitemap

```
/                              Landing: split entry [WORK | PERSONAL], latest 3 journal entries
/work                          Work index
/work/[slug]                   Case study
/personal                      Personal index: Games + Lab
/personal/games/[slug]         Game page
/personal/games/[slug]/play    Embedded playable build (iframe, fullscreen button)
/personal/lab/[slug]           Small project page
/journal  /journal/[slug]      Daily posts, tag filter, RSS at /rss.xml
/about                         Chaptered story
/contact                       Email, GitHub, links
```

Nav: Work, Personal, Journal, About, Contact.

## Content model

`src/content/{work,games,lab,journal,about}/*.md`. Adding an entry = adding a file.

- `work`: `title, role, period, stack[], summary, confidential: bool`, optional screenshots.
- `games`: `title, summary, playable: embed | external | none, playUrl?, repoUrl?, collaborators[]`.
- `lab`: `title, summary, stack[], repoUrl?, collaborators[]`.
- `journal`: `title, date, tags[]`, optional `project`. Filename `YYYY-MM-DD-slug.md`. `npm run new "title"` scaffolds today's file.
- `about`: `order, title`. One file per chapter.

## Content plan

### Work

| Entry | Treatment |
|---|---|
| Tanami Capital | Named. One short stub: role line, dates, generic stack tags (full-stack, mobile, web). **No** screenshots, product or feature names, metrics, client or domain detail, or repo links. Page states the work is confidential. Title and dates are placeholders until supplied. |
| CuspIO | Full case study with screenshots (project is dissolved). Owner confirms each image before publish. |

Out for now: Pick, Akalaat (973 Engineering).

### Personal: Games

| Game | Playable | Notes |
|---|---|---|
| skoobl | external (`dilmune.app`) | Needs a Redis/websocket backend, cannot run on Pages. Public repo. |
| S.M.O.B.B. | embed (existing web build) | Repo is public as of 2026-10-25. Link release downloads. |
| smoke-break | external (`smoke-break.vercel.app`) | Credit SilentYsf as co-author. |
| dopher-alpha | none | Go raycaster. Repo private: description and preview GIF only, no repo link. |
| smart-road | none | Rust traffic sim, local only. Uses its car/intersection images. |

### Personal: Lab

go-byte, overworld, 01-displayer, codeweavers-build-hackathon, LPS (private: screenshot only, no repo link).

Team projects, collaborators credited: gridlock (Rust FPS), nocturne-network (needs a short write-up, no README exists).

Excluded: Undervault, sb-game, dopher-engine, go-chess, ant-order, bsf-engine, snowline-forum, atm-management-system, kwaddot, reboot-hackathon-website-2025, etern, realmweavers-engine.

Rule: private repos get description, media and live/download links only.

### About

Chaptered "Volume 1". Chapter stubs ship empty with a clear placeholder state; the owner writes the text. A facts strip (name, Bahrain, what I do, links) sits on top, skills and timeline below.

## UX path

1. Landing: diagonal split panel, Work left, Personal right, name and tagline in a speech bubble. Journal ticker below.
2. Index pages: manga page grid of irregular panels. Hover inverts the panel and slides in the caption.
3. Detail pages read as chapters (Problem, Role, Build, Result). Footer link goes to the next entry.
4. Sticky nav on every page.

## Visual theme

- Palette: paper `#fafafa`, ink `#0a0a0a`, one mid-gray for screentone. No accent colors.
- Thick panel borders, uneven gutters, some panels bleed off-edge.
- CSS halftone dots, speed lines on hover, ink-wash dividers.
- Bold display face for headings, clean body face, vertical chapter labels.
- Screenshots grayscale with halftone overlay, full color on click or zoom.
- Scroll panel-reveal; `prefers-reduced-motion` disables motion.
- Accessibility: black/white contrast, keyboard navigation, alt text on all media.

## Games hosting

Static builds under `public/play/<slug>/`, embedded in an iframe. Godot web exports must use the single-threaded option (Pages cannot send COOP/COEP headers). Page adapts to `playable`.

## Repo layout

```
src/pages  src/content  src/components  src/styles
public/ (media, fonts, play/)
docs/superpowers/specs/
```

## Out of scope (now)

Comments, analytics, CMS, search, i18n, newsletter. Revisit if needed.

## Open items

- Tanami title and dates (placeholders until supplied).
- Education (placeholder).
- Screenshots and GIFs for skoobl, smoke-break, smart-road, dopher-alpha, CuspIO to be provided or captured.
- Create the GitHub repo and configure Pages when ready to deploy.
