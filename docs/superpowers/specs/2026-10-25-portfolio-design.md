# Portfolio: Ali Khalaf

Personal portfolio, journal and game host. Replaces the GitHub Pages usage at `kwaddo.github.io/smobb` with a single root site.

## Goals

- One site with two clearly separated tracks: **Work** (professional) and **Personal** (games, lab).
- A daily-friendly **journal**.
- Playable **games** hosted on the site where technically possible.
- A chaptered **About** story the owner writes over time.
- Black-and-white manga look, pleasant to browse.

## Phases

Each phase ships on its own and gets its own implementation plan.

1. **Phase 1, core site:** theme, landing, Work (Tanami stub, CuspIO overview), Personal (games + lab index and detail pages), About with the chapter drafts, Contact, nav with "Get in touch", mobile/RTL-safe CSS, deploy to Pages. Media comes from the capture plan, top 5 projects first.
2. **Phase 2, living content:** journal (posts, tags, RSS, `npm run new`), timeline, `/resume` + PDF, `/uses`, themed 404, "now" blurb.
3. **Phase 3, polish:** static per-section Open Graph cards, remaining Lab entries and media, Lighthouse/link checks in CI, JSON-LD.

SEO basics (titles, descriptions, canonicals) and the performance/RTL rules apply from Phase 1.

## Stories: overview and journey

Every project has two layers, so the site works for a 30-second skim and for a reader who wants the whole story.

- **Overview:** the brief layer. A few paragraphs on what it is, the stack, status and links. This is the project page and the card on index pages.
- **Journey:** the long layer. A chaptered, dated, first-person story of how the project came to be: where the idea came from, what was built when, what broke, what changed, what it meant. Lives at `/personal/games/[slug]/journey` (same for lab entries), reads like the manga volume on About, and ends with a link to the next project's journey.
- **Devlog series:** journal posts tagged `project: <slug>` appear in that project's journey as dated side-entries and on its project page as "From the devlog".
- **Involvements get journeys too** (employers, Reboot, university), not only projects. The owner supplies the raw story; the published version is edited for professionalism and discretion. Employer journeys carry no client, product, internal-tool, metric or colleague detail beyond what the timeline already states; they tell the growth story (what was learned, what changed). Tanami's public page stays a role line; its journey, if any, is the same kind of discreet growth story. CuspIO's overview stays brief.
- Not every project needs a journey. Depth is the owner's choice per project: some stay overview-only forever.

### Story intake workflow

1. Owner writes raw text, as long and candid as wanted, into `~/Documents/notes/Portfolio Stories.md` (sectioned: A site voice, B project journeys, C involvements, D journal seeds, each with priority P1-P3). That vault is outside this repo. `_inbox/` (git-ignored) is the fallback for any extra raw file. Raw drafts are never committed or published.
2. Claude edits it into `src/content/journeys/<slug>/NN-title.md` chapters: structure, tone, tightening, less-revealing wording. Facts and the owner's meaning are kept; nothing is invented. Anything unclear is asked, not guessed.
3. Claude returns a short **change note** per story: what was cut, softened or generalized, and anything that might be sensitive (names, clients, money, health, family, employer internals, anything mentioning AI tooling).
4. Owner approves the edited version. Only then is it committed.

Phasing: Phase 1 ships overview pages plus the journey template with one flagship journey (S.M.O.B.B., the longest-running: July 2023 to 2026). Phase 2 adds the devlog link-up and journeys for skoobl and smoke-break. Further journeys land whenever written.

Raw material: each project's git history gives dates, milestones and the shape of the story. I can extract a dated skeleton per project for the owner to write the voice over. Journey text is the owner's story, edited by them, and follows the content rules (no AI tooling mentioned).

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
/personal/games/[slug]/journey Long-form chaptered story of the project (lab entries likewise)
/personal/lab/[slug]           Small project page
/journal  /journal/[slug]      Daily posts, tag filter, RSS at /rss.xml
/about                         Chaptered story + "now" blurb
/resume                        Print-styled resume page + PDF download
/uses                          Tools and setup
/contact                       Email, GitHub, links
/404                           Themed not-found page
```

Nav: Work, Personal, Journal, About, Contact, plus a persistent "Get in touch" button.

## Content model

`src/content/{work,games,lab,journal,about}/*.md`. Adding an entry = adding a file.

- `work`: `title, role, period, stack[], summary, confidential: bool`, optional screenshots.
- `games`: `title, summary, playable: embed | external | none, playUrl?, repoUrl?, collaborators[]`.
- `lab`: `title, summary, stack[], repoUrl?, collaborators[]`.
- `journal`: `title, date, tags[]`, optional `project`. Filename `YYYY-MM-DD-slug.md`. `npm run new "title"` scaffolds today's file.
- `about`: `order, title`. One file per chapter.
- `journeys`: `src/content/journeys/<project-slug>/NN-title.md`. Frontmatter: `project, order, title, date`. One file per chapter of a project's long story.
- Every `games`/`lab` entry gains `status: live | released | prototype | showcase | archived`, `lastWorked` (date) and an optional `journey: true` flag that shows the "Read the journey" link.

## Content plan

### Work

| Entry | Treatment |
|---|---|
| Tanami | Named. One short stub: "Software Engineer, Jun 2026 - present", generic stack tags (full-stack, mobile, web). **No** screenshots, product or feature names, metrics, client or domain detail, or repo links. Page states the work is confidential. |
| CuspIO | Brief system overview, not a deep case study. The owner had a light oversight role (barely involved via Dilmune) on a healthcare management platform that is being dissolved. Covers what the system was, the stack and the owner's oversight role. At most a few screenshots from synthetic demo data, each owner-approved; no patient data of any kind. |

Out for now: Pick, Akalaat (973 Engineering).

### Personal: Games

| Game | Playable | Notes |
|---|---|---|
| skoobl | none (showcase) | No longer hosted. Showcase page: media, description, public repo link. Revisit if it is hosted again. |
| S.M.O.B.B. | embed (iframe of existing `kwaddo.github.io/smobb`) | Repo is public as of 2026-10-25. No copy of the build in this repo. Link release downloads. |
| smoke-break | embed (iframe of existing `smoke-break.vercel.app`, if it permits framing; otherwise external link) | Credit SilentYsf as co-author. Verify the URL is live and frameable before building. |
| dopher-alpha | none | Go raycaster. Repo private: description and preview GIF only, no repo link. |
| smart-road | none | Rust traffic sim, local only. Uses its car/intersection images. |

### Personal: Lab

go-byte, overworld, 01-displayer, codeweavers-build-hackathon, LPS (private: screenshot only, no repo link).

Team projects, collaborators credited: gridlock (Rust FPS), nocturne-network (CV role: bridge between frontend and backend, coordinating integration and code quality; needs a short write-up, no README exists).

Excluded: Undervault, sb-game, dopher-engine, go-chess, ant-order, bsf-engine, snowline-forum, atm-management-system, kwaddot, reboot-hackathon-website-2025, etern, realmweavers-engine.

Rule: private repos get description, media and live/download links only.

### About

Chaptered "Volume 1". Chapter text is seeded from `docs/about-draft.md` (verified facts only); the owner edits it over time. A facts strip (name, Bahrain, what I do, links) sits on top, skills and timeline below.

## UX path

1. Landing: diagonal split panel, Work left, Personal right, "Ali Khalaf, Software Engineer" in a speech bubble (no tagline). Journal ticker below (Phase 2).
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

## Timeline and resume

- A timeline strip (Work index and About) lists roles, projects, education and hackathons by date. It shows continuity without product detail, and Tanami appears as one line.
- Source: LinkedIn, the pre-Tanami CV and repo history. Data lives in `src/content/timeline/*.md` (`date, kind, title, org?`), one file per milestone.
- `/resume` renders the same data, print-styled, with a PDF download. The PDF is generated once and committed to `public/`.
- Seed data (LinkedIn text pasted by the owner plus the CV, 2026-10-25), newest first by start date:

| Period | Kind | Entry |
|---|---|---|
| Jun 2026 - present | work | Software Engineer, Tanami (full-time). Role line only. |
| Nov 2025 - Dec 2025 | work | Full Stack Engineer, Babel Pastries. Built a TV slideshow application with admin panel and engine, deployed; trained a new developer on Laravel + React (Vite). |
| Oct 2025 - Nov 2025 | work | Junior Software Engineer, Tech Bay IT Solutions. Trained on Dynamics 365 and internal systems; client work, many government-related. |
| Jun 2025 - Jul 2025 | work | Software Engineer Intern, DOO Mena. Built a backend system for one section; early frontend work. |
| Feb 2025 - Jan 2026 | work | Full-stack Developer, Croozz Technologies (part-time, Bahrain, hybrid). Small, fast-moving team shipping frequent updates. |
| Aug 2024 - Aug 2026 | education | Reboot Coding Institute, graduated with DevOps. |
| Sep 2021 - Aug 2026 | education | University of Bahrain, Bachelor's in Software Engineering, graduated. |

| (year TBD) | event | StartUp Bahrain, three editions. Years and roles supplied by the owner. |
| (year TBD) | event | Build Hackathon at Reboot Coding Institute. Year, team, role and result supplied by the owner; may be the `codeweavers-build-hackathon` repo (to confirm). |

  Display order is by end date, newest first, with the current role pinned on top. `event` entries (hackathons, programs) are placed by year once the owner supplies it, and are not shown on the timeline until dated.

  Notes: employers get the CV-level description only, with no client or product detail beyond what is listed (Tanami: role line only). Repo milestones (S.M.O.B.B. 2023, skoobl, hackathons) are added as `project` entries between these. Sources: LinkedIn (titles for Tanami, dates for Croozz) and the pre-Tanami CV (Babel Pastries and the descriptions). Where they differ, LinkedIn wins (confirmed by the owner): Croozz is Feb 2025 - Jan 2026 there but Jan - Dec 2025 on the CV; Tech Bay title is "Software Developer" on LinkedIn but "Junior Software Engineer" on the CV (CV title used). Entries are not linked to specific projects unless the owner says so (CuspIO's employer is unconfirmed).
- **Credentials rule:** only two are shown: Reboot Coding Institute (graduated, DevOps) and University of Bahrain (graduated, Bachelor's in Software Engineering). No other certifications. High school is omitted.
- **Contact:** the Gmail address from the CV is the public contact email (owner's choice), shown on `/contact`, the resume and the nav CTA (`mailto:`). To limit scraping, the address is assembled client-side from split parts, with a plain-text fallback inside `<noscript>`. The phone number is not published anywhere. GitHub and LinkedIn links are also listed.
- **Stack list** (About and resume): Go, JavaScript, TypeScript, NestJS, React, Next.js, Vue, React Native, PHP Laravel, C#/ASP.NET, Rust. Languages: English, Arabic.
- Journey facts seed the About facts strip and chapters; the owner edits the final text.

## Calls to action

- Persistent "Get in touch" nav button, linking to `/contact` (mailto fallback).
- Availability line on the landing (e.g. open to work / freelance), edited in one frontmatter field.

## Work with me

A short block on the landing page (below the split entry) and again on `/contact`, with 3-4 lines:

- **What I take on:** full-stack web, mobile apps (React Native, Flutter-adjacent), backend services (Go, Laravel, Node), and game prototypes.
- **How to start:** email with a short brief (what you're building, timeline, budget range); reply within the stated response time.
- **Availability:** driven by the single availability field in frontmatter (see Calls to action).

Copy is drafted in Phase 1 and edited by the owner. No rates are published.

## SEO and sharing

- Per-page `<title>` and meta description from frontmatter, canonical URLs, `sitemap.xml`, `robots.txt`, RSS.
- Open Graph and Twitter cards (Phase 3): a handful of static manga-style 1200x630 images, one per section (landing, work, personal, journal, about), referenced from frontmatter. No build-time image generation dependency.
- JSON-LD `Person` on `/about`.

## Mobile and performance budget

- Design at 360px first; no horizontal scroll at any width.
- Game iframes are click-to-load (poster + Play button); nothing from `public/play/` loads until clicked.
- Images: Astro image pipeline (AVIF/WebP, `srcset`, explicit width/height), `loading="lazy"` below the fold. GIFs converted to muted looping video.
- Fonts: at most two families, self-hosted, `font-display: swap`, subset.
- Halftone, speed lines and panel-reveal are CSS only. Heavy effects disabled under `prefers-reduced-motion` and on small screens where costly.
- Budget: landing under 200 KB transferred excluding images, Lighthouse performance and accessibility at or above 95 on mobile.

## RTL readiness

- Logical CSS properties everywhere (`margin-inline`, `padding-block`, `inset-inline`, `text-align: start`), never left/right.
- Manga panel grids and the reading order flip under `dir="rtl"` (which suits right-to-left manga reading); directional icons and the split landing mirror.
- Text lives in content files, so a later `/ar/` locale is additive. No translation in this scope. Fonts chosen must have an Arabic fallback.

## Small extras

- Themed 404 page.
- "Now" blurb on About (what I'm building and learning, dated).
- `/uses` page: editor, languages, hardware and general dev stack.

## Content rules

- No mention of AI coding tools or assistant involvement anywhere on the site: copy, `/uses`, journal templates, repo READMEs shown, or screenshots. Screenshots must not show assistant UIs, terminals or logs containing such references.
- Tanami: role line only, as above.
- **Identity:** the public name is **Ali Khalaf** everywhere on the site (nav, titles, meta, JSON-LD, resume). "Kwaddo" appears only as the GitHub handle inside links. "Quad" is never shown. GitHub profile name and git author name are to be aligned to the real name (owner action, see open items).
- Collaborators may be named (owner confirmed they are fine with it): SilentYsf, aburxwais, Moa-01/Moataz Ibrahim and others on shared projects. Use the names they use publicly on GitHub.
- Every screenshot is reviewed by the owner before publish. EXIF/location metadata is stripped from all images (the Astro image pipeline re-encodes them).
- Embedded games use `<iframe sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen">` with `allow="fullscreen"`, loaded only after a click. No other third-party embeds.
- Build checks (Phase 3, CI): Lighthouse (mobile) against the performance and accessibility targets, plus a link check.

## Capture pass

Screenshots and GIFs are captured per project from local copies, one at a time, into `public/media/<slug>/`, each reviewed before commit. Details and run commands live in `docs/capture-plan.md`.

## Out of scope (now)

Comments, analytics, CMS, search, translations (RTL layout is prepared; content is not translated), newsletter. Revisit if needed.

## Open items

- No headline/tagline for now (owner's call). Landing shows "Ali Khalaf, Software Engineer".
- About story text is drafted from verified facts in `docs/about-draft.md`; owner edits it.
- Align GitHub profile name ("Quad" today) and global git `user.name` ("Quad") to "Ali Khalaf"; update the GitHub bio and the `Kwaddo` profile README to point to the site.
- Unverified: live game URLs have not been opened, and smart-road controls and gridlock package names are guesses (checked during the capture pass).
- Screenshots and GIFs for skoobl, smoke-break, smart-road, dopher-alpha, CuspIO to be provided or captured.
- Create the GitHub repo and configure Pages when ready to deploy.
