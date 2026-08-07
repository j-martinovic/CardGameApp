# Dead Code — What Can Be Removed, and In What Order

> ## ✅ EXECUTED 2026-08-06 (branch `refactor-cleanup`)
>
> Everything below was carried out, phase by phase, with these deviations:
> - **War was kept, not deleted**: `game-client/src/games/war/` became
>   [shared/games/War.js](../shared/games/War.js) + `frontend/src/board/war/`, registered
>   on the server and playable from the lobby. The *Era 1 Flask* War
>   (`war_game.py`, `frontend/src/War.jsx`, `War.css`) was deleted — superseded by the
>   boardgame.io version.
> - **The whole Flask server was deleted**, not just `rooms.py`/`playground.py` — auth and
>   the user DB moved into the Node game server (see [05-backend.md](05-backend.md));
>   existing users were migrated with passwords hashed.
> - `AssetPreview.jsx` (+ its two CSS files) and `CardFace.jsx` + the card SVGs were
>   **kept** — the asset gallery is a harmless dev tool and the SVG card faces are meant
>   to be wired into the engine's card renderer later.
> - The Era 2 root docs were archived to [docs/history/](history/) rather than deleted.
> - `requirements.txt` was deleted (no Python left) instead of re-encoded.
>
> This file is kept as the record of *what* was removed and *why*. Everything deleted
> remains recoverable from git history.

Method: every claim below is backed by an import-reachability walk from the two real entry
points (`frontend/index.html → src/main.jsx` and `backend/card_server/server.js`), plus
repo-wide greps for each candidate. Rough scale: **of ~120 source files in the repo, about
60 are unreachable**, and ~15,000 tracked files are `node_modules`/`dist`/`__pycache__`
artifacts.

Work in the phases below — each phase leaves the app runnable. Verify between phases:
start the three servers ([01-overview.md](01-overview.md#how-to-run-the-live-system-3-terminals)),
log in, create a Mighty match, see the board render.

---

## Phase 0 — Repo hygiene (do this first; it's the biggest win)

There is no root `.gitignore`, so three trees committed their `node_modules` (and
`game-client` its `dist`, and `main_server` its `__pycache__` and **the user database**).

Create `/.gitignore`:

```gitignore
node_modules/
dist/
__pycache__/
*.pyc
.venv/
.env
*.sw?
backend/main_server/instance/
```

Then untrack (this removes from git but **keeps files on disk** — important, the servers
still need their installed deps):

```bash
git rm -r --cached game-client/node_modules game-client/dist \
  game-server/node_modules backend/card_server/node_modules \
  backend/main_server/__pycache__ backend/main_server/shared_handlers/__pycache__ \
  backend/main_server/instance/userdata.db
git commit -m "Stop tracking dependencies, build output, caches, and the user DB"
```

Also:
- Delete the stale vim swap file `frontend/src/LobbyComponents/.LobbyScreen.jsx.swp`.
- Re-save root `requirements.txt` as UTF-8 (it's currently UTF-16 from PowerShell).
- The committed `userdata.db` contains real accounts with plaintext passwords — consider
  `git filter-repo` later if that ever matters; at minimum stop tracking it now.

---

## Phase 1 — Safe deletions (zero code references; delete outright)

### Whole directories

| Path | Why it's dead |
|---|---|
| `game-server/` | Era 2 boardgame.io server, superseded by `backend/card_server`. Nothing imports it; its only reference is `start-game-servers.sh` (also deletable, see below) |
| `card-resources/` | Pre-boardgame.io prototype (`BoardResources_test.jsx`, `app_test.jsx` — which imports a CSS file that doesn't even exist). The card SVGs were already copied to `frontend/src/assets/cards/cards_good/` |
| `backend/main_server/shared_handlers/` | 13-file Python package, never imported, never registered as a blueprint (its own header admits the registration line was never added). See [05-backend.md](05-backend.md#the-shared_handlers-story) |

### `game-client/` — the dead majority (keep the engine! see "Do NOT delete" below)

| Path | Why it's dead |
|---|---|
| `src/App.jsx`, `src/App.css`, `src/main.jsx`, `index.html` | Era 2 app shell — nothing runs it |
| `src/lobby/` (Lobby, MultiplayerLobby, LobbyAPI, RoomsAPI + css) | Era 2 lobby; the live lobby is `frontend/src/LobbyComponents/` |
| `src/playground/` (7 files incl. CustomGameEngine, RuleBuilder, RuleSchema) | The custom-game-builder feature; only reachable from the dead app shell / dead game-server |
| `src/games/gofish/` (3 files) | Only registered by dead `game-server` |
| `src/hooks/useGameState.js` | Only imported by the dead app shell |
| `src/components/PlayerArea.jsx` + `.css`, `BotArea.jsx`, `GameResult.jsx` + `.css` | Only imported by the dead playground `CustomBoard` |
| `src/shared_handlers/index.js`, `useLobby.js`, `useDebug.js`, `useBridgeSpecific.js`, `useEuchreSpecific.js`, `usePokerSpecific.js` | The barrel and 5 hooks are imported by nothing (GenericBoard imports its 6 hooks by direct path) |

### `frontend/` dead files

| Path | Why it's dead |
|---|---|
| `src/Mighty.jsx` | Abandoned first attempt: a verbatim copy of `War.jsx` with identifiers renamed — still calls `/war/*` and imports `War.css`. Imported by nothing |
| `src/Mighty.css` | Byte-identical duplicate of `War.css`; imported by nothing |
| `src/LobbyComponents/main.jsx` | Duplicate entry file; not referenced by `index.html`, and its `./App.jsx` import can't resolve |
| `src/LobbyComponents/index.css` | Only imported by the dead duplicate `main.jsx` |
| `src/board/MightyBoard.css` | Imported by nothing — **decision**: delete, or add `import './MightyBoard.css'` to `MightyBoard.jsx` if the styles were meant to apply |
| `src/components/AssetPreview.jsx` + `.css`, `src/assets/animations/cardAnimations.css` | Dev-only asset gallery, swap-in-by-hand (per `README_ASSETS.md`). Harmless — keep if the author likes it, else delete all three |

### `backend/card_server/` dead files

| Path | Why |
|---|---|
| `GameObjects/BoardResources_test.jsx` | Byte-identical copy of the `card-resources` prototype; only reference is a commented-out import in `Mighty.js` |

### Stale Era 2 root files

`ARCHITECTURE.md`, `README_BOARDGAMEIO.md`, `start-game-servers.sh`, `.env.example` all
document the dead Era 2 stack (wrong servers, wrong ports, "Zero existing files were
modified" claims). Recommendation: move to `docs/history/` if you want the record, else
delete. Do **not** leave them at the root where they'll mislead the next reader — they
explicitly instruct "this file must be read before touching any code."

---

## Phase 2 — Remove dead import *lines*, then delete what they were holding alive

These files are only "reachable" through import statements whose values are never used.
Remove the lines first (the app must still build), then delete the targets.

**Edit these lines:**

| File | Remove |
|---|---|
| [frontend/src/LobbyComponents/client.jsx](../frontend/src/LobbyComponents/client.jsx) | imports of `game1` (games.js), `TestBoard`, `GenericBoard`, `WarBoard`, `WarGame` (keep: `Client`, `SocketIO`, `Mighty`, `MightyBoard`, `LoadingPage`) |
| [frontend/src/LobbyComponents/Lobby.jsx](../frontend/src/LobbyComponents/Lobby.jsx) | imports of `LobbyClient`, `game1`, `TestBoard` |
| [frontend/src/App.jsx](../frontend/src/App.jsx) | import of `CardFace` |
| [backend/card_server/server.js](../backend/card_server/server.js) | imports of `game1, game2` (games.js), `fs`, `WarGame` |

**Then delete:**

| Path | Was only alive because of |
|---|---|
| `backend/card_server/games.js` | the unused `game1`/`game2` imports above (it's two empty stub games) |
| `game-client/src/games/war/` (War.js, WarAI.js, WarBoard.jsx + config + css) | unused imports in `client.jsx` and `server.js`. Note: this is the *Era 2 boardgame.io* War — unrelated to the *Era 1 Flask* War (`frontend/src/War.jsx`), which is a separate decision (Phase 3) |
| `frontend/src/LobbyComponents/TestBoard.jsx` | unused imports in `client.jsx`/`Lobby.jsx`. It's a tiny debug board — delete, or deliberately keep and document it as a debugging tool |

---

## Phase 3 — Flask trims (require decisions)

| Item | Recommendation |
|---|---|
| `rooms.py` + `playground.py` (+ their blueprint registrations in `main.py`, + the `custom_games` table) | **Delete** — their only callers are the dead Era 2 client. If the "build your own game" playground idea is a keeper, archive the Era 2 `playground/` + `playground.py` in a branch before deleting |
| `war_game.py` + `frontend/src/War.jsx` + `War.css` | **Decide**: the Flask War game works and is one line from reachable (`App.jsx`: make a panel set `screen='war'`). Either revive it as the second game, or delete all three together (~1,100 lines). Don't leave it half-dead |
| `PATCH /update_user`, `DELETE /delete_user` routes in `main.py` | No callers; keep only if account management UI is planned |
| Commented-out routes in `main.py` (`get_user`, `get_users`) | Delete |

---

## ⚠️ Kept deliberately (looked dead or misplaced, but shouldn't go)

| Path (post-cleanup) | Why it stays |
|---|---|
| `frontend/src/engine/` (formerly `game-client/src/{components,hooks,shared_handlers}`) | The live board engine both boards render through |
| `shared/games/Mighty.js`, `shared/games/War.js` | The games — imported by both server and frontend |
| `frontend/src/LobbyComponents/loading_page.jsx` + `.css` | The boardgame.io client's loading screen |
| `frontend/src/assets/` + `CardFace.jsx` + `AssetPreview.jsx` | `CardFace` builds card image URLs at runtime (`new URL(...)`), invisible to static import analysis. Currently orphaned but intended for the engine's card renderer; AssetPreview is the dev gallery for these assets |

## Final tally (as executed)

- Phase 0 untracked ~15,000 artifact files; tracked file count went from ~15,200 to 177.
- Phases 1–2 + the War/Flask decisions deleted ~65 source files (~9,000 lines).
- `game-client/`, `game-server/`, `card-resources/`, and `backend/main_server/` no longer
  exist; the repo is down to `frontend/`, `backend/card_server/`, `shared/`, `docs/`.
