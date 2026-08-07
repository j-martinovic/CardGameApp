# Auth & User Accounts — `users.js` and the auth routes

How sign-up, login, and logout work end to end. The store:
[backend/card_server/users.js](../../backend/card_server/users.js) (~85 lines). The
routes: the auth section of
[backend/card_server/server.js](../../backend/card_server/server.js). Big-picture
context: [architecture.md](architecture.md).

## The database

`users.js` uses **`node:sqlite`** — SQLite built into Node itself (≥ 22.5), so there are
no native npm modules to compile. Node prints
`ExperimentalWarning: SQLite is an experimental feature` at boot; expected, harmless.

- File: `backend/card_server/data/users.db` — created automatically on first boot,
  **gitignored** (each machine has its own users; sign up fresh on a new machine).
- Schema: `users(id INTEGER PK, user_name TEXT UNIQUE, email TEXT UNIQUE,
  password_hash TEXT, logged_in INTEGER)` — created by the `CREATE TABLE IF NOT EXISTS`
  at module load.

## How passwords are stored (and why it looks like that)

Passwords are never saved as text. `hashPassword` runs
[scrypt](https://nodejs.org/api/crypto.html#cryptoscryptsyncpassword-salt-keylen-options)
(a deliberately slow, memory-hard hash from Node's `crypto`) over the password plus a
random 16-byte **salt**, storing `"salt:hash"`:

- The **salt** makes identical passwords hash differently, so leaked hashes can't be
  attacked with precomputed tables.
- Login re-runs scrypt with the stored salt and compares using **`timingSafeEqual`**,
  which takes constant time regardless of where the difference is — comparison time
  can't leak information.
- `toJson()` returns `{id, userName, email, loggedIn}` — the hash never leaves the
  server. (The old Flask server stored plaintext *and returned it in responses*; the 9
  pre-existing accounts were migrated by hashing their plaintext passwords, so old
  passwords still work.)

## The API, request by request

All three routes live on the same Koa app as the game server, so CORS comes from the one
`origins` config. Bodies are parsed by the local `readJsonBody` helper in `server.js` —
15 lines, no dependency.

### `POST /signup` — called by [Login.jsx](../../frontend/src/Login.jsx)
Body `{userName, password, email}`. Validates presence (400 with a message the form
displays), inserts with `logged_in = 1`, returns **201** `{message, user}`. A UNIQUE
violation (name or email taken) maps to 400 "User name or email already taken".

### `POST /login` — called by [Login.jsx](../../frontend/src/Login.jsx)
Body `{userName, password}`. Missing fields → 400; unknown user or wrong password →
**401** `{message: "Invalid credentials"}` (deliberately the same message for both — no
username probing); success → 200 `{message, user}` and `logged_in` set. The frontend
keeps the returned `user` object in `App.jsx` state (`userInfo`) — that object *is* the
"session".

### `POST /logout` — called by [App.jsx](../../frontend/src/App.jsx)
Body `{id}`. Clears `logged_in`; 404 if the id doesn't exist. The frontend clears
`userInfo` regardless of the response.

## Honest limitations (known, accepted for now)

These are fine on localhost and are step 7 of the
[roadmap](../project/refactor-plan.md) before anything goes online:

- **No sessions or tokens.** The server doesn't remember who's logged in per-connection;
  `/logout` trusts whatever `id` it receives, and nothing stops a crafted request from
  acting as another user. A signed cookie or token is the fix.
- `logged_in` is a display flag, not enforcement — game/lobby endpoints don't check it.
- HTTP only (no TLS) — again, localhost-appropriate.
- No password reset or email verification (there's no mailer at all).
- `upsertMigratedUser` exists only for the one-off Flask migration; it's inert but
  documented here so nobody wonders.
