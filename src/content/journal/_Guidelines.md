# Journal guidelines

Open `src/content/journal/` as an Obsidian vault. This file starts with `_`, so Astro skips it: it is never published.

## Making an entry

- Run `npm run new` (or `npm run new <project-slug>` for a devlog entry), or copy the frontmatter below.
- Filename: `YYYY-MM-DD.md`. A second post the same day: `YYYY-MM-DD-2.md`.
- URL becomes `/journal/YYYY-MM-DD`.

```yaml
---
date: 2026-10-31
tags: []
project: smobb   # optional: shows the entry in that project's devlog
draft: true      # optional: hidden from the site until removed
---
```

## Writing

- No title and no `# heading`: the date is the title everywhere.
- The first two lines are the index excerpt and the first sentence is the meta description, so open strong.
- Short, candid, first person. Daily-friendly beats polished.
- Tags: lowercase, short, reused (`gamedev`, `web`, `learning`).

## Content rules

- Never mention AI coding tools or assistants. That includes screenshots showing them.
- Public name is Ali Khalaf. Never "Quad". "Kwaddo" only inside GitHub links.
- Collaborators may be named by their public GitHub names.
- Nothing about clients, money, health, family or employer internals. Tanami: role line only.
- Strip location from photos (the image pipeline does it, but check).
- Raw drafts go in `_inbox/`, not here. Anything in this folder gets published once `draft` is off and it is pushed.

## Full spec

`docs/superpowers/specs/2026-10-25-portfolio-design.md` (sections "Journal titling", "Content rules").
