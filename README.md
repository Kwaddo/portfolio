# Ali Khalaf: portfolio

Source of [kwaddo.github.io](https://kwaddo.github.io): work, games and the stories behind them.

Built with [Astro](https://astro.build). All content is markdown in `src/content/`.

## Run it

Requires Node 22.23.4 or newer (see `.node-version`).

    npm install
    npm run dev        # http://localhost:4321
    npm run verify     # type check, unit tests, build and content rules
    npm run e2e        # Playwright layout and behaviour checks
    npm run new        # scaffold today's journal entry
    npm run resume:pdf # regenerate the resume PDF (run npm run build first)

## Add content

- A project: add a markdown file to `src/content/games/` or `src/content/lab/`.
- A story: add chapters to `src/content/journeys/<project>/` and set `journey: true` on the project.
- Drafts: set `draft: true` in any entry's frontmatter to keep it out of the build.

Pushing to `main` deploys the site to GitHub Pages.
