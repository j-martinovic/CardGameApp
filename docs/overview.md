# Project Overview — What Is Actually Going On

> **Updated 2026-08-06** after the big cleanup (branch `refactor-cleanup`): dead code from
> two earlier iterations was removed, the board engine moved into the frontend, game
> definitions moved to `shared/games/`, and the Flask server was merged into the Node game
> server. The history below is kept because it explains where the remaining code came from.

## The one-paragraph summary

Two processes run the whole app: a React SPA ([frontend/](../frontend/), Vite dev server
:5173) and a single **Node backend** ([backend/card_server/](../backend/card_server/),
:8000) that hosts three things on one port — the boardgame.io game engine (socket.io), the
boardgame.io lobby REST API, and the account routes (`/signup`, `/login`, `/logout`) backed
by SQLite. The playable games — **Mighty** (5-player, in development) and **War** (solo vs
the house, working) — are defined once in [shared/games/](../shared/games/) and imported by
both the server (authoritative) and the frontend (client-side prediction). That shared
import is the standard boardgame.io pattern.

## The live runtime

```mermaid
flowchart LR
    subgraph Browser
        FE["frontend (React SPA)<br/>Vite dev :5173"]
    end
    subgraph One Node process — port 8000
        AUTH["auth routes<br/>/signup /login /logout"]
        LOBBY["boardgame.io lobby REST<br/>/games/..."]
        BGIO["boardgame.io engine<br/>socket.io"]
        DB[("users.db<br/>node:sqlite, scrypt hashes")]
        AUTH --- DB
    end
    FE -- "accounts" --> AUTH
    FE -- "list / create / join matches" --> LOBBY
    FE -- "game state + moves" --> BGIO
    BGIO -- runs --> M["shared/games/Mighty.js<br/>shared/games/War.js"]
    FE -- "imports for prediction" --> M
```

| Port | What |
|---|---|
| 5173 | `frontend` Vite dev server |
| 8000 | `backend/card_server` — games + lobby REST + auth, all on one port |

## How to run (2 terminals)

```bash
cd backend/card_server && npm start     # → :8000  (needs Node ≥ 22.5 for node:sqlite)
cd frontend && npm run dev              # → :5173
```

Then: sign up / log in → **Play** → lobby → *Create Lobby*:
- **War** (1 seat) — fully playable now: click your deck to flip cards against the house.
- **Mighty** (5 seats) — deals and runs the bidding phase server-side; the board renders,
  but card-play wiring and several rule bugs are still open
  (see [03-mighty-game-logic.md](03-mighty-game-logic.md) and
  [04-generic-board.md](04-generic-board.md)). For solo testing use the boardgame.io debug
  panel (`debug: true`) to act for the other seats.

## Directory map

| Path | What it is |
|---|---|
| `frontend/` | The React app. Screens ([02-frontend.md](02-frontend.md)), the board engine (`src/engine/`, [04-generic-board.md](04-generic-board.md)), per-game board configs (`src/board/`) |
| `backend/card_server/` | The one backend: `server.js` (games + lobby + auth) and `users.js` (accounts). [05-backend.md](05-backend.md) |
| `shared/games/` | Game definitions imported by both sides: `Mighty.js`, `War.js`, `bgio-constants.js`. Zero package dependencies by design |
| `docs/` | These docs. `docs/history/` holds the Era 2 architecture docs, kept for reference only |

## How the repo got this shape (the three eras)

1. **Era 1 — Flask-only**: Home/Login screens + a server-side War game in Flask.
2. **Era 2 — the "generic card platform" experiment**: a second React app (`game-client`)
   with a drag-and-drop board engine and custom-game "playground", plus its own
   boardgame.io server (`game-server`). Documented by the (now archived) files in
   [docs/history/](history/).
3. **Era 3 — Mighty**: the pivot to building Mighty properly on boardgame.io, reusing
   Era 2's board engine.

The 2026-08 cleanup kept: Era 3 whole; Era 2's board engine (now `frontend/src/engine/`)
and its War game (now `shared/games/War.js`, playable from the lobby); Era 1's Home/Login
screens and its user accounts (migrated into the new SQLite store, passwords hashed in the
process). Everything else — ~60 unreachable source files, ~15,000 committed
`node_modules`/`dist` artifacts, the Flask server, and the Era 1 War UI — was deleted.
It all remains in git history if ever needed.

## Current state of the game work

Works today: accounts, lobby (both games listed, create/join/leave), **War end-to-end**,
Mighty's deal + bidding logic server-side, Mighty board rendering (sorted hand, seats,
trick area, kitty).

Still open (the friend's next milestones, in order):
1. **Mighty card-play wiring** — clicking a card does nothing yet; a three-layer naming
   mismatch with a documented config-only fix ([04-generic-board.md](04-generic-board.md)).
2. **Trick-completion crash** and the other verified rule bugs
   ([03-mighty-game-logic.md](03-mighty-game-logic.md#known-bugs-verified-against-boardgameio-050-semantics)).
3. UI for bidding, kitty exchange, and partner selection.
4. Engine simplification and config/security passes
   ([07-refactor-plan.md](07-refactor-plan.md), steps 6–8).
