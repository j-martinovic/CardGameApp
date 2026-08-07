# Refactor Plan — Status and Remaining Roadmap

> **Updated 2026-08-06.** Steps 1–3 are done (branch `refactor-cleanup`), plus two changes
> of plan made with Michael's sign-off — see "Decisions made" below. Steps 4–8 are the
> live roadmap, unchanged in substance.

## Current shape (was "target shape" — now real)

```
CardGameApp/
├── docs/                      # these docs (+ docs/history/ = archived Era 2 docs)
├── shared/
│   └── games/
│       ├── Mighty.js          # THE game definitions — imported by server AND frontend
│       ├── War.js
│       └── bgio-constants.js  # local INVALID_MOVE so shared/ has zero dependencies
├── backend/
│   └── card_server/           # the ONE backend (:8000): games + lobby REST + auth
│       ├── server.js          #   bgio Server + /signup /login /logout on one Koa app
│       ├── users.js           #   node:sqlite store, scrypt-hashed passwords
│       └── data/users.db      #   (gitignored)
└── frontend/                  # the ONE React app (:5173)
    └── src/
        ├── engine/            # GenericBoard, ZoneLayout, zones/, primitives/, hooks, handlers
        ├── board/             # MightyBoard + config; board/war/ = WarBoard + config
        ├── LobbyComponents/   # LobbyScreen, Lobby, client, loading_page
        ├── assets/            # card SVGs, chips, avatars (CardFace not yet wired in)
        └── (Home, Login, App, ...)
```

## Decisions made during execution (and the reasoning)

1. **War lives on as a boardgame.io game, and the Flask War is gone.** "Keep War" was
   satisfied with the Era 2 `War.js` (already boardgame.io-shaped, already had a working
   GenericBoard config) promoted to `shared/games/` and registered on the server — so War
   is created/joined from the same lobby as Mighty. The Era 1 Flask implementation
   (`war_game.py` + the 608-line `War.jsx`) duplicated the same game on a dead
   architecture, so it was deleted rather than left half-alive. Trade-off: the old War UI
   had bespoke animations the generic board doesn't replicate; if those are missed, the
   file is in git history to mine for ideas.
2. **One backend: Flask merged into the game server.** Auth (`/signup`, `/login`,
   `/logout`) now runs on the boardgame.io server's own Koa app, one process on port 8000
   (lobby REST included — removing `apiPort` collapsed 8080 too). Accounts moved to
   `node:sqlite` with scrypt-hashed passwords; all 9 existing users migrated and verified
   logging in with their old passwords. Trade-offs accepted: custom routes on bgio's Koa
   are less-trodden ground than Flask/Express (mitigated: it's a documented, public API
   surface — `server.router`); the project no longer has a Python surface (if the original
   author was using Flask to learn Python, that learning track is gone — the code is in
   git history); `node:sqlite` prints an "experimental" warning on Node 23 (harmless).

## ✅ Step 1 — Hygiene + dead code (done)

See [06-dead-code.md](06-dead-code.md) for the full executed record. Repo went from
~15,200 tracked files to 177.

## ✅ Step 2 — Engine moved into the frontend (done)

`game-client/src/{components,hooks,shared_handlers}` → `frontend/src/engine/` wholesale;
internal relative imports unchanged; `game-client/` deleted. Verified by a clean
`vite build` (148 modules).

## ✅ Step 3 — Games extracted to `shared/` (done, extended to War)

`Mighty.js` and `War.js` in `shared/games/`, dependency-free via `bgio-constants.js`.
Also done here because two games made them mandatory: lobby joins now use the match's own
`gameName` (was: the create-dropdown's value), `connectionTokens` stores `gameName` so
`leaveMatch` works, and match creation uses per-game seat counts (`GAME_NUM_PLAYERS`).

## Step 4 — Make a Mighty card playable (NEXT — the current wall)

Config-only change in `MightyBoardConfig.js`; exact snippet in
[04-generic-board.md](04-generic-board.md#the-move-dispatch-pipeline--and-why-playing-a-card-does-nothing).
War's config already does it this way — use it as the model.

## Step 5 — Fix the Mighty rules bugs, crashers first

Ordered, line-referenced list in
[03-mighty-game-logic.md](03-mighty-game-logic.md#known-bugs-verified-against-boardgameio-050-semantics):
`playing.onEnd` rewrite first, then the seat-mapping, undeclared variables, follow-suit,
killed-Joker, and scoring bugs; then split the overloaded `previousPartner`. Strongly
consider extracting `TakeTrick`/`UpdateScore`/bid validation into pure functions
(`shared/games/mighty/rules.js`) with `vitest` tests before fixing — every bug on that
list is the kind a 5-line test catches.

## Step 6 — Collapse the engine's dispatch layering

Have `useBoardEventHandlers` call `moves[name]` directly from per-game `moveMap`s; delete
the abstract handler bag and all six `shared_handlers` hooks (including `useSocial`, whose
chat calls now point at a server that no longer exists); pass the bgio `events` prop
through so End Turn works; drop sandbox mode and the legacy named-zone render path;
strip the leftover `console.log`s. ~1,000 lines lighter.

## Step 7 — Configuration & security pass

- One `frontend/src/config.js` for the two base URLs (replaces 4 hardcoded strings).
- Real session handling for auth (signed token or cookie) — hashing is done, sessions
  aren't; `/logout` still trusts the id it's handed.
- Seat assignment in the lobby: joiners currently always request seat 0 — pick the first
  free seat from the match metadata instead.
- `debug: true` off outside dev (both clients and both game objects); restrict `origins`
  for production; consider bgio persistent storage so matches survive restarts.
- `Lobby.jsx` poll interval 50000 → 5000 ms (or refresh on demand).

## Step 8 — Docs truth pass

Rewrite `frontend/README.md` (Vite boilerplate) and `README_ASSETS.md` (stale Era 1
claims); add a small root `README.md`: what the app is, the 2-terminal run recipe, and a
pointer into `docs/`.

## What deliberately does NOT change

- boardgame.io as the engine; one shared definition per game in `shared/games/`.
- The author's mental model: Home → Login → Lobby → Board; `MightyBoardConfig` as "the
  file where the board is described"; the debug panel for solo testing; move names in
  `Mighty.js`.

## First milestones for the original author (after step 4)

1. Bidding UI: an ActionZone panel calling `moves.MakeBid('14S')` / `moves.MakeBid('P')`
   while `ctx.phase === 'bidding'`.
2. Kitty exchange: show `G.deck` to the declarer in `takingKitty`, multi-select 3 cards →
   `moves.DiscardKitty([...])`.
3. Partner-card picker → `moves.SelectPartner('AH')`.
4. Wire `CardFace.jsx`'s SVG card faces into the engine's `Card` renderer so both boards
   get real card art.
