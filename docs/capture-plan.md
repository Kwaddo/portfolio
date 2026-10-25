# Capture plan

Screenshots and GIFs go to `src/assets/media/<slug>/`. Capture one project at a time, review each file before committing. Rules:

- No AI-assistant UIs, terminals, logs or file names visible in any shot.
- No real personal data (patients, emails, tokens). Demo data only.
- Do not touch Tanami repos or its running containers.
- Phone shots at 390x844, desktop at 1440x900. GIFs under 8 s, later converted to muted looping video.

Order is by value: top row first.

| # | Project | Path / source | Run | Shots |
|---|---|---|---|---|
| 1 | skoobl | `~/Documents/personal/skoobl` (no longer hosted: run from source) | `backend`: `go run ./cmd/server` (:8080); `frontend`: `npm install && npm run dev`. Redis optional. Needs 2+ tabs for a lobby. | TV lobby with room code + QR; phone drawing canvas; anonymized doodle grid; reveal + scoreboard; Arabic RTL prompt |
| 2 | smobb | `~/Documents/personal/smobb` (site iframes existing kwaddo.github.io/smobb) | TUI `cargo run -p smobb-tui`; web `cd crates/smobb-web && trunk serve` (:8080). Launch from a clean dir (a `smobb-save.json` exists in repo root). | Existing `docs/superpowers/smobb-web-smoke.png`; TUI sidebar + journal; password/hex-decode moment; phone-size web/PWA; GIF of text rolling |
| 3 | smoke-break | clone `Kwaddo/smoke-break` (live: smoke-break.vercel.app) | Use live URL (local run needs Firebase creds). | Mode select; single-player maze + HUD; the three maps (`assets/images/map1-3.png` exist); two-player Seeker vs Hider; leaderboard |
| 4 | dopher-alpha | private; `gh repo clone Kwaddo/dopher-alpha` into scratchpad | `go mod tidy && go run main.go` (sdl2 installed). F fullscreen, Tab minimap, M megamap. | Existing `assets/preview/preview.gif` + `logo.png`; main menu; combat; dialogue; megamap |
| 5 | smart-road | `~/Documents/smart-road` | `cargo run --release` (check `src/main.rs` for controls; no README) | Full intersection with cars in several lanes; busy traffic; stats/end screen; GIF of crossings. Sprites in `assets/` |
| 6 | CuspIO (brief overview, 3 shots max) | `~/Documents/CuspIO` (origin Dilmune/CuspIO) | `cp .env.example .env && ./start.sh fresh`, or `make fresh-demo && composer dev` (:8000). Demo login in Makefile, demo subdomain `demo`. Needs Postgres + Redis. | Dashboard; appointments calendar; one billing/claims view. Synthetic demo data only; no patient views unless confirmed synthetic |
| 7 | gridlock | clone `Kwaddo/gridlock-multiplayer-game` | `cargo run -p server`, then `cargo run -p client` (names inferred, verify) | Lobby/login; first-person gameplay with weapon; weapon roster + crosshair presets |
| 8 | nocturne-network | `~/Documents/nocturne-network` | `docker compose up --build` (:8080 / :5173) | Landing page (Spline 3D); `creepy.png`; routes found in `frontend/src` |
| 9 | 01-displayer | live: 01-displayer.vercel.app | Live URL only (needs school login to run locally) | Existing `public/preview.png`; ratio chart; XP distribution; Minesweeper widget |
| 10 | go-byte | clone `Kwaddo/go-byte` | `go build -o chip8 cmd/main.go` then run with a ROM path | A ROM running + debug terminal. Needs a freely licensed CHIP-8 ROM. |
| 11 | overworld | clone `Kwaddo/overworld` | `npm install && npx expo start` | Song-to-WiFi mapping screen; mappings list. Feature needs a real device / dev build. |
| 12 | codeweavers | clone `Kwaddo/codeweavers-build-hackathon` | `npm i` in `backend` and `frontend`, check scripts | Unknown UI: login, dashboard, transactions once it runs |
| 13 | LPS | private, Linux-only | cannot run on macOS | Use existing `images/preview.png` only |

## CuspIO pre-check

Before capturing, skim `PatientSeeder` and `storage/app/{private,public}` to confirm the demo rows are synthetic. Do not open `.env`. Anything that looks real is excluded.

## Per-project loop

1. Locate / clone into scratchpad (never into this repo).
2. Run, confirm it works.
3. Capture the listed shots.
4. Owner reviews each file; reject anything with private data or tool references.
5. Save to `src/assets/media/<slug>/`, write alt text in the entry's frontmatter, commit.

## Status 2026-10-25 22:25 and the next capture round

Captured and wired (shots per project): skoobl 5, smoke-break 4, dopher-alpha 4, smobb 3, nocturne-network 3, cuspio 3, lps 2, 01-displayer 1. Covers still missing: smart-road, gridlock, go-byte, overworld (Tanami never gets media). More shots wanted for 01-displayer and lps.

Native windows (Smart Road, Gridlock, go-byte, Dopher) were blocked earlier because the terminal lacked macOS Screen Recording permission. A window-only capture test on 2026-10-25 22:23 returned real pixels, so the permission is now granted to the terminal app this session ran in. Helper for the next round:

- `docs/capture/winid.swift` lists on-screen windows (id, owner, size, title); build once with `swiftc -O winid.swift -o winid`.
- `docs/capture/capture-window.sh <owner-substring> <out.png>` captures ONE window by id with `screencapture -x -o -l`, so no desktop, dock or other windows ever enter the frame. Crop/resize with sharp afterwards; keep under 600 KB.

Per project, next round (follow `/private/tmp/claude-501/capture/rules.md` for naming, alt text, review and the single media commit; after the category swap Gridlock lives in `games`, Smart Road in `lab`):
1. smart-road (`~/Documents/smart-road`, `cargo run --release`): intersection with traffic in several lanes, the busiest moment, the stats/end screen. Capture the SDL window by owner name (binary name `smart-road`).
2. gridlock (clone `Kwaddo/gridlock-multiplayer-game`; server then client; fake player names): lobby, first-person play with weapon and crosshair, weapon roster.
3. go-byte (clone `Kwaddo/go-byte`; needs a freely licensed CHIP-8 ROM such as the public-domain test ROMs): a ROM running plus the debug terminal view.
4. overworld (clone `Kwaddo/overworld`, Expo): the mapping screen and the mappings list; use the Expo web target or an iOS simulator window if the feature allows, otherwise BLOCKED.
5. dopher-alpha: the native build panicked ("Invalid window ID") last time; retry after `go mod tidy`; fall back to the existing GIF frames already used.
6. 01-displayer (live URL, public sign-in page only) and lps (private repo; crops without username or hostname): one or two more shots each.
