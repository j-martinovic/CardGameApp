# Backend Walkthrough — `card_server` (boardgame.io) and `main_server` (Flask)

## `backend/card_server/` — the game server (LIVE)

[server.js](../backend/card_server/server.js) (33 lines) is the whole server:

```js
const server = Server({ games: [Mighty], origins: [...] });
server.run({ port: 8000, lobbyConfig: { apiPort: 8080 } });
```

- Game socket on **:8000**, lobby REST API on **:8080** (this split is standard
  boardgame.io; the frontend's `LobbyClient` uses 8080, the game client uses 8000).
- Registers **only Mighty** ([GameObjects/Mighty.js](../backend/card_server/GameObjects/Mighty.js)
  — fully documented in [03-mighty-game-logic.md](03-mighty-game-logic.md)).
- No persistent storage configured → matches live in memory and vanish on restart.

Dead weight in this directory:
- [games.js](../backend/card_server/games.js) — two stub game definitions (`game1`
  "Mighty", `game2` "Golf") with empty moves. Imported by `server.js`, `client.jsx`, and
  `Lobby.jsx` but **never used** by any of them.
- `server.js:4` imports `WarGame` from `game-client` — never registered.
- [GameObjects/BoardResources_test.jsx](../backend/card_server/GameObjects/BoardResources_test.jsx)
  — byte-identical copy of `card-resources/BoardResources_test.jsx` (a pre-boardgame.io
  card-rendering prototype). Only referenced by a *commented-out* import in `Mighty.js`
  (which points at a `.js` path that wouldn't resolve anyway).
- [package.json](../backend/card_server/package.json) is a copied Vite React scaffold
  (name "mighty", `dev: vite` scripts, react deps) — the server is actually run with plain
  `node server.js` and only needs `boardgame.io`. Its `node_modules/` (~7,000 files) is
  **committed to git**.

## `backend/main_server/` — the Flask server (LIVE for auth; half dead)

Run: `python main.py` → Flask dev server on **:5000**, `debug=True`, SQLite at
`instance/userdata.db`, CORS open to everyone.

| File | Verdict | What it does |
|---|---|---|
| [config.py](../backend/main_server/config.py) | LIVE | Flask app + SQLAlchemy + blanket `CORS(app)` |
| [models.py](../backend/main_server/models.py) | LIVE | One table: `User(id, user_name, password, email, logged_in)` — plaintext password, and `to_json()` **returns the password** in every response |
| [main.py](../backend/main_server/main.py) | LIVE | Registers the three blueprints + auth routes |
| [war_game.py](../backend/main_server/war_game.py) | PARKED | Complete, working server-side War vs bot (in-memory `_active_games`). Its only caller is `frontend/src/War.jsx`, whose screen is currently unreachable (one-line fix in `App.jsx` revives it) |
| [rooms.py](../backend/main_server/rooms.py) | DEAD-IN-PRACTICE | Room/lobby system with 4-char codes bridging Flask users to bgio matches. Only caller: the dead Era 2 `game-client` lobby. The live lobby uses boardgame.io's own :8080 API instead |
| [playground.py](../backend/main_server/playground.py) | DEAD-IN-PRACTICE | Stores custom-game rule JSON (table `custom_games`). Only caller: dead Era 2 playground |
| [shared_handlers/](../backend/main_server/shared_handlers/) | **DEAD** | 13-file package, never imported by anything (see below) |

### Route inventory (who actually calls what)

| Route | Caller |
|---|---|
| `POST /login`, `POST /signup` | [Login.jsx](../frontend/src/Login.jsx) ✅ |
| `POST /logout` | [App.jsx](../frontend/src/App.jsx) ✅ |
| `PATCH /update_user/<id>`, `DELETE /delete_user/<id>` | nobody |
| `POST /war/new`, `/war/play`, `/war/quit` | `War.jsx` (screen unreachable) |
| `GET /war/state` | nobody |
| `/rooms/*` (10 routes) | only dead `game-client` (`RoomsAPI.js`) |
| `/playground/*` (6 routes) | only dead `game-client` (`PlaygroundAPI.js`); 3 of the 6 have no caller even there |
| `/shared/*` (18 routes in `shared_handlers/api_routes.py`) | **blueprint never registered — these routes don't exist at runtime**, yet the live board's chat hooks POST to them → guaranteed 404s |

### The `shared_handlers/` story

A 13-module Python package (~2,000 lines) of card-game handler functions (betting, bridge,
euchre, poker, scoring, social, …), mirrored by a JS twin in
`game-client/src/shared_handlers/`. It was scaffolded but **never wired up**:

- `api_routes.py`'s own header says "add ONE line to main.py to register this" — that line
  was never added. No Python file outside the package imports it.
- Most module docstrings admit the functions are **stubs with correct signatures**.
- The committed `__pycache__` even proves it: there's bytecode for the 11 modules the
  package `__init__` imports, but none for `api_routes.py` — the only file with routes.
- Consequence for the live app: `GenericBoard`'s chat/moderation calls
  (`useSocial` → `POST :5000/shared/chat/message` etc.) 404. Nothing else notices the
  package exists.

Verdict: delete the whole package (and either strip `useSocial` from the board engine or
implement chat for real later — through boardgame.io, not Flask, would be the natural home).

### Security notes (worth fixing during the refactor)

- Passwords stored **in plaintext** and **returned by the API** (`models.py to_json`).
- `instance/userdata.db` with real accounts is **committed to git**.
- `CORS(app)` open to all origins; `debug=True`; no `SECRET_KEY`, no sessions/tokens —
  "auth" is purely trust-the-client (`/logout` acts on any user id it's handed).
- Root `requirements.txt` is UTF-16 (PowerShell artifact); regenerate as UTF-8.

None of this matters for a localhost hobby project *today*, but it should be on the list
before anything goes online.

## Databases & state at a glance

| Store | Where | Contents | Survives restart? |
|---|---|---|---|
| SQLite `userdata.db` | `main_server/instance/` | `user`, `custom_games` tables | yes (and it's in git — remove it) |
| `_active_games` dict | `war_game.py` | War games in progress | no |
| `_rooms` dict | `rooms.py` | Era 2 rooms | no |
| boardgame.io matches | `card_server` (in-memory default) | Mighty matches | no |
