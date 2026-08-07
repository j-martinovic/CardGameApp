# Backend Walkthrough — one Node server (`backend/card_server/`)

> Rewritten 2026-08-06: the separate Flask server (`backend/main_server`) was merged into
> the game server. Auth, lobby, and games now share one process and one port. The old
> Flask code lives on in git history (last present at the `refactor-cleanup~1` commits).

## `server.js` — everything on port 8000

[server.js](../../backend/card_server/server.js) builds the boardgame.io `Server` with
`games: [Mighty, WarGame]` (imported from [shared/games/](../../shared/games/)) and runs it
**without** `lobbyConfig.apiPort` — which makes boardgame.io mount its lobby REST API on
the same Koa app as the game socket. The auth routes are registered on the same app via
`server.router`, so one process serves:

| Concern | Routes / transport | Who calls it |
|---|---|---|
| Game engine | socket.io on :8000 | `client.jsx`'s `SocketIO({server: 'localhost:8000'})` |
| Lobby REST | `GET /games`, `GET /games/:name`, `POST /games/:name/create`, `.../join`, `.../leave`, … | `LobbyScreen.jsx`'s `LobbyClient({server: 'http://localhost:8000'})` |
| Auth | `POST /signup`, `POST /login`, `POST /logout` | `Login.jsx`, `App.jsx` |

CORS for all three comes from the one `origins` config (`Origins.LOCALHOST_IN_DEVELOPMENT`
in dev). Request bodies for the auth routes are parsed by a small local `readJsonBody`
helper — no extra dependencies. `package.json` is now honest: the only dependency is
`boardgame.io`.

## `users.js` — accounts

[users.js](../../backend/card_server/users.js) stores accounts in SQLite via **`node:sqlite`**
(built into Node ≥ 22.5; no native modules — it prints an "experimental" warning on boot,
which is fine). The DB file is `backend/card_server/data/users.db` (gitignored).

Schema: `users(id, user_name UNIQUE, email UNIQUE, password_hash, logged_in)`.

Security posture (all fixed relative to the Flask era):
- Passwords are **scrypt-hashed** with per-user salts (`hashPassword`/`verifyPassword`
  with `timingSafeEqual`) — the old server stored them in plaintext.
- API responses **no longer include the password** (the old `to_json` did).
- The DB file is **not committed to git** (the old `userdata.db` was).

The 9 existing accounts were migrated with their passwords hashed; everyone's old
password still works.

Still deliberately simple (fine for localhost, on the list before going online):
- No sessions or tokens — the client just remembers the user object; `/logout` trusts the
  id it's handed. Real session handling is future work
  ([07-refactor-plan.md](../project/refactor-plan.md) step 7).
- `logged_in` is a plain flag, not enforcement.

## Game/lobby state

boardgame.io keeps match state **in memory** (no `db` configured) — restarting the server
loses running matches and the lobby list. Fine for development; boardgame.io supports
pluggable storage when persistence matters.

## What happened to the Flask server

`backend/main_server/` was deleted in the merge. Where each piece went:

| Flask piece | Fate |
|---|---|
| `/login`, `/signup`, `/logout` | Ported to `server.js` + `users.js` (same request/response shapes — the frontend needed only a port change) |
| `models.py` `User` table | Migrated to `data/users.db` with hashed passwords |
| `war_game.py` (server-side War vs bot) | Superseded — War is now the boardgame.io game in [shared/games/War.js](../../shared/games/War.js), playable from the lobby |
| `rooms.py`, `playground.py` | Deleted — their only callers were the deleted Era 2 client |
| `shared_handlers/` package | Deleted — never imported or registered by anything |
| `PATCH /update_user`, `DELETE /delete_user` | Dropped — no callers. Re-add on the Node side if account management UI ever appears |
| root `requirements.txt`, `.venv` | Deleted — there is no Python in the project anymore |
