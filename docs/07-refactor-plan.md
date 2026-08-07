# Refactor Plan — Keeping the Game, Losing the Archaeology

Goal: a repo where the original author can keep building Mighty without tripping over three
eras of scaffolding. The plan preserves the things they know (file names like
`MightyBoardConfig`, `GenericBoard`, the boardgame.io debug panel, the screen flow) and
changes structure only where structure is the problem.

## Target shape

```
CardGameApp/
├── docs/                      # these docs
├── shared/
│   └── games/
│       └── Mighty.js          # THE game definition — imported by server AND frontend
├── backend/
│   ├── card_server/           # boardgame.io server  (:8000 game, :8080 lobby)
│   │   ├── server.js
│   │   └── package.json       # trimmed: boardgame.io only
│   └── main_server/           # Flask (:5000) — auth (and War, if kept)
│       ├── main.py  config.py  models.py  [war_game.py]
│       └── requirements.txt   # UTF-8, moved next to the code
└── frontend/                  # the ONE React app (:5173)
    └── src/
        ├── engine/            # ← moved wholesale from game-client/src
        │   ├── components/    #   GenericBoard, ZoneLayout, zones/, primitives/, ...
        │   ├── hooks/         #   useBoardEventHandlers, useCardInteraction
        │   └── shared_handlers/  # the 6 hooks GenericBoard uses (shrink later)
        ├── board/             # MightyBoard.jsx + MightyBoardConfig.js
        ├── LobbyComponents/   # LobbyScreen, Lobby, client, loading_page
        ├── assets/
        └── (Home, Login, App, ...)
```

Why this shape and not npm workspaces / a published package: only one app consumes the
engine, and the author is a beginner — a folder move keeps every tool working with zero new
concepts. Workspaces can come later if a second client ever appears.

## Step-by-step (each step ends with the app still working)

**Verification ritual after every step**: start the three servers
([01-overview.md](01-overview.md#how-to-run-the-live-system-3-terminals)), log in, create a
Mighty match, confirm the board renders and the debug panel shows state.

### Step 1 — Hygiene + dead code
Run Phases 0–3 of [06-dead-code.md](06-dead-code.md). Commit each phase separately so any
mistake is one revert away.

### Step 2 — Move the engine into the frontend
```bash
mkdir -p frontend/src/engine
git mv game-client/src/components      frontend/src/engine/components
git mv game-client/src/hooks           frontend/src/engine/hooks
git mv game-client/src/shared_handlers frontend/src/engine/shared_handlers
```
The engine's *internal* relative imports (`../shared_handlers/...`, `../hooks/...`,
`./zones/...`) keep the same relative structure, so they all still resolve. Only **one
consumer import** needs updating:

- `frontend/src/board/MightyBoard.jsx`:
  `'../../../game-client/src/components/GenericBoard'` → `'../engine/components/GenericBoard'`

Then delete the now-empty `game-client/` (app shell husk, package.json, node_modules,
dist). Also update `frontend/src/engine/shared_handlers/config.js` — it reads
`import.meta.env.VITE_FLASK_API_URL`; that now correctly comes from `frontend/`'s env.

### Step 3 — Move Mighty.js to `shared/`
```bash
mkdir -p shared/games
git mv backend/card_server/GameObjects/Mighty.js shared/games/Mighty.js
```
Update the two importers:
- `backend/card_server/server.js`: `'../../shared/games/Mighty.js'`
- `frontend/src/LobbyComponents/client.jsx`: `'../../../shared/games/Mighty.js'`

The frontend still imports across the repo boundary, but now the boundary is an *explicit
shared folder* whose whole purpose is being imported from both sides — the standard
boardgame.io monorepo pattern. (Optional polish: a Vite alias `@shared` →
`../shared` so the import reads `'@shared/games/Mighty.js'`.)

### Step 4 — Make a card actually playable (the current wall)
Apply the wiring fix from
[04-generic-board.md](04-generic-board.md#the-move-dispatch-pipeline--and-why-playing-a-card-does-nothing):
correct `moveMap` keys (`'hand→play'`) plus `moveOverrides` that call the real
`moves.PlayCard(cardId)` / `moves.DiscardKitty([...])`. This is a config-only change in
`MightyBoardConfig.js` — a perfect first post-refactor task for the original author, with
the mechanism now documented.

### Step 5 — Fix the Mighty rules bugs, crashers first
Ordered list with line numbers in
[03-mighty-game-logic.md](03-mighty-game-logic.md#known-bugs-verified-against-boardgameio-050-semantics):

1. Rewrite `playing.onEnd` (correct `{G, ctx, events}` signature; call
   `TakeTrick({G, ctx})` and `UpdateScore({G, ctx})`; use `events.setPhase`).
2. Fix the seat-vs-trick-position mapping in `TakeTrick`.
3. Declare the loop/score variables (`i`, `declarerScore`, …).
4. Follow-suit check (`.filter(...).length > 0`), the killed-Joker `||`→`&&`, point
   counting `c.slice(0,1)`, `G.playOrder`→`ctx.playOrder`, `.lenth` typo.
5. Split `G.previousPartner` into `G.firstBidder` and `G.partner`.

Strong suggestion: before fixing, pull `TakeTrick`, `UpdateScore`, `createDeck`, and the
bid-validation logic into **pure functions** (in `shared/games/mighty/rules.js`) and add
`vitest` tests for them — they're plain array math and trivially testable, and the bugs
above are exactly the kind tests catch. boardgame.io's `Local()` client also lets you
script full games headlessly for integration tests.

### Step 6 — Collapse the dispatch layering (engine simplification)
Once Mighty plays end-to-end, simplify the engine the author inherited from Era 2:

- Have `useBoardEventHandlers.dispatchMove` call `moves[moveName]` **directly**, with
  `moveMap` values naming real boardgame.io moves. Delete the abstract handler bag and all
  six `shared_handlers` hooks (`useSocial` included — its chat calls 404 anyway; chat done
  right would ride boardgame.io, not Flask).
- Pass the bgio `events` prop through GenericBoard so End Turn works.
- Remove the sandbox mode and the legacy named-zone render path if nothing uses them after
  the War decision (they existed for Era 2's War/Go Fish/playground).
- Strip the leftover `console.log`s (`GenericBoard.jsx:219,223`,
  `useBoardEventHandlers.js:34,54-56`, `ZoneLayout.jsx:73`, `primitives/Hand.jsx:22`).

This step deletes another ~1,000 lines and makes the engine explainable in one sitting.

### Step 7 — Configuration & security pass
- One `frontend/src/config.js` exporting the three base URLs (Flask, lobby :8080, game
  :8000) from `import.meta.env` with localhost fallbacks; replace the five hardcoded URLs.
- Flask: hash passwords (`werkzeug.security`), stop returning `password` in `to_json`,
  restrict CORS to the dev origin, add a `SECRET_KEY`, turn off `debug` outside dev.
- Fix the small lobby bugs: store `gameName` in `connectionTokens` (LobbyScreen), use the
  match's own `gameName` when joining (Lobby), and turn `debug: true` off in
  `client.jsx`/`Mighty.js` for non-dev builds.
- Regenerate `requirements.txt` (UTF-8) into `backend/main_server/`.

### Step 8 — Docs truth pass
Delete or archive the Era 2 root docs (`ARCHITECTURE.md`, `README_BOARDGAMEIO.md`,
`start-game-servers.sh`, `.env.example`), fix the stale claims in
`frontend/README_ASSETS.md`, and write a small root `README.md`: what the app is, the
3-terminal run recipe, and a pointer into `docs/`.

## What deliberately does NOT change

- boardgame.io as the engine, and Mighty.js as a single shared game definition.
- The author's mental model: Home → Login → Lobby → Board; `MightyBoardConfig` as "the file
  where the board is described"; the debug panel for solo testing.
- Flask as the accounts server (it's small and works; hashing passwords is the only must).
- Move names in Mighty.js (`MakeBid`, `PlayCard`, …) — the docs and any future UI refer to
  them.

## Suggested first milestones after the refactor (for the original author)

1. Wire the **bidding UI**: an ActionZone panel that calls `moves.MakeBid('14S')` /
   `moves.MakeBid('P')` during the bidding phase (`ctx.phase === 'bidding'`).
2. Kitty exchange UI: show `G.deck` to the declarer in the `takingKitty` stage, then
   multi-select 3 cards → `moves.DiscardKitty([...])`.
3. Partner-card picker → `moves.SelectPartner('AH')`.
4. Then the game is playable start-to-finish, and scoring (already fixed in Step 5) lights up.
