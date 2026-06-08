# CardGameApp — Architecture Reference

> **Last updated:** 2026-06-08  
> **Author:** boardgame.io integration layer  
> **Rule #1:** This file must be read before touching any code.

---

## Phase 1 — Codebase Audit Findings

### Repository Layout (pre-integration)

```
CardGameApp/
├── backend/
│   ├── main_server/
│   │   ├── config.py         Flask app + CORS + SQLAlchemy init
│   │   ├── models.py         User database model
│   │   ├── main.py           Auth routes (login, signup, logout, update, delete)
│   │   └── war_game.py       War game Flask blueprint (/war/*)
│   └── card_server/
│       └── dummy.py          Empty placeholder
├── frontend/                 Existing React/Vite SPA (teammate's UI)
│   ├── src/
│   │   ├── App.jsx           State machine: home | loggingIn | war
│   │   ├── Home.jsx          Lobby/home screen
│   │   ├── Login.jsx         Auth form (calls Flask)
│   │   ├── War.jsx           War game UI (talks to Flask /war/* routes)
│   │   └── assets/           SVG cards, chips, avatars, animations
│   ├── package.json          React 19, Vite 8 — NO boardgame.io
│   └── vite.config.js        Default config, port 5173
├── requirements.txt          Flask 3.1.3, SQLAlchemy 2.x, flask-cors
└── (no .env, no root README, no root package.json)
```

### Existing Flask Routes (DO NOT MODIFY)

| Method | Path                        | What it does                          |
|--------|-----------------------------|---------------------------------------|
| POST   | /login                      | Authenticate; returns user JSON       |
| POST   | /signup                     | Register; returns user JSON           |
| POST   | /logout                     | Sets `logged_in=False` by user ID     |
| PATCH  | /update_user/:id            | Update user fields                    |
| DELETE | /delete_user/:id            | Delete user                           |
| POST   | /war/new                    | Start new War game (in-memory state)  |
| POST   | /war/play                   | Play one complete round               |
| GET    | /war/state                  | Read current game state               |
| POST   | /war/quit                   | Abandon and free game                 |

### Database Schema (DO NOT MODIFY)

Table: `users` (SQLite via SQLAlchemy)

| Column     | Type        | Constraints           |
|------------|-------------|-----------------------|
| id         | Integer     | PK, auto              |
| user_name  | String(80)  | Unique, Not Null      |
| password   | String(80)  | Not Null (plaintext!) |
| email      | String(120) | Unique, Not Null      |
| logged_in  | Boolean     | Default False         |

### Ports in Use (Pre-Integration)

| Server              | Port |
|---------------------|------|
| Flask API           | 5000 |
| Vite (existing SPA) | 5173 |

### Critical Gaps Found in Flask

1. **No `/api/me` endpoint.** Flask has no endpoint that accepts a session cookie/token
   and returns the currently authenticated user. Every request that needs user info must
   carry the user ID in the request body.

2. **No session management.** Flask does not set any cookies or tokens. The `logged_in`
   column in the database is the only "session" state, but it cannot be verified by the
   browser without an explicit API call.

3. **No SECRET_KEY set.** Flask sessions (the built-in cookie-based kind) are not
   configured.

**Implication for boardgame.io integration:** The game client at port 3000 cannot verify
Flask auth without a dedicated endpoint. See § "Auth Handshake" below.

---

## Phase 2 — Three-Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│  LAYER 1 — Flask API  (port 5000)  ← DO NOT TOUCH   │
│  Teammate owns this entirely.                        │
│  • User auth, registration, login, logout            │
│  • SQLite user database                              │
│  • In-memory War game state (/war/* routes)          │
│  • flask-cors enables cross-origin fetch calls       │
└─────────────────────┬───────────────────────────────┘
                      │ JSON over HTTP
┌─────────────────────▼───────────────────────────────┐
│  LAYER 2 — boardgame.io Server  (port 8000)  ← NEW  │
│  You own this. Lives in /game-server/.               │
│  • Authoritative game state for bgio games           │
│  • Lobby API (match creation, join, list)            │
│  • Game registry (add new games here only)           │
│  • Socket.IO real-time events for multiplayer        │
│  • Bot AI infrastructure                             │
│  • Server-side event logging                         │
└─────────────────────┬───────────────────────────────┘
                      │ Socket.IO + REST
┌─────────────────────▼───────────────────────────────┐
│  LAYER 3 — React Game Client  (port 3000)  ← NEW    │
│  You own this. Lives in /game-client/.               │
│  • Game lobby UI                                     │
│  • War game board (boardgame.io React client)        │
│  • Links back to existing SPA for auth               │
│  • Does NOT replace existing frontend at 5173        │
└─────────────────────────────────────────────────────┘

Existing SPA at port 5173 continues to work unchanged.
```

### Port Assignment

| Server                 | Port | Notes                                        |
|------------------------|------|----------------------------------------------|
| Flask (teammate's)     | 5000 | Fixed. Never change.                         |
| boardgame.io server    | 8000 | New. See VITE_BGIO_SERVER_URL in .env.       |
| Game client (new Vite) | 3000 | New. See game-client/vite.config.js.         |
| Existing SPA           | 5173 | Unchanged. Still serves the existing game UI.|

---

## Phase 3 — New Project Structure

Files added to the repository. Zero existing files were modified.

```
CardGameApp/
├── [existing files — untouched]
│
├── game-server/               ← NEW: boardgame.io Node server
│   ├── package.json
│   ├── server.js              Main server entry point
│   └── games.js               Central game registry (add new games here)
│
├── game-client/               ← NEW: boardgame.io React game UI
│   ├── package.json
│   ├── vite.config.js         Port 3000, proxy to boardgame.io server
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            Lobby → Game router
│       ├── App.css
│       ├── games/
│       │   └── war/
│       │       ├── War.js     boardgame.io game definition
│       │       ├── WarAI.js   Bot AI configuration
│       │       ├── WarBoard.jsx
│       │       └── WarBoard.css
│       ├── lobby/
│       │   ├── Lobby.jsx
│       │   ├── Lobby.css
│       │   └── LobbyAPI.js    Wrapper for boardgame.io Lobby REST API
│       ├── components/
│       │   ├── Card.jsx       Reusable card face component
│       │   ├── Card.css
│       │   ├── CardBack.jsx   Face-down card
│       │   ├── PlayerArea.jsx
│       │   ├── PlayerArea.css
│       │   ├── BotArea.jsx
│       │   ├── GameResult.jsx
│       │   └── GameResult.css
│       └── hooks/
│           └── useGameState.js  Wraps boardgame.io client state
│
├── ARCHITECTURE.md            ← This file
├── .env.example               ← Environment variables template
├── README_BOARDGAMEIO.md      ← Developer guide
└── start-game-servers.sh      ← Starts bgio server + game client in parallel
```

---

## Phase 4 — Dependencies

### game-server dependencies

| Package         | Version  | Why                                            |
|-----------------|----------|------------------------------------------------|
| boardgame.io    | ^0.50.2  | Core framework: game engine, lobby, socket.io  |
| koa-cors        | ^0.0.16  | CORS middleware for the Koa server bgio uses   |

boardgame.io's `Server` ships with Koa internally; you do **not** need to install Koa
separately. However, `koa-cors` is needed to configure allowed origins.

### game-client dependencies

| Package              | Version  | Why                                            |
|----------------------|----------|------------------------------------------------|
| boardgame.io         | ^0.50.2  | React Client HOC, multiplayer transport        |
| react                | ^18.3.1  | UI framework (using 18 for compatibility)      |
| react-dom            | ^18.3.1  | DOM renderer                                   |
| react-router-dom     | ^6.26.0  | Routing between lobby and game screens         |

### game-client devDependencies

| Package              | Version  | Why                                |
|----------------------|----------|------------------------------------|
| vite                 | ^5.4.0   | Build tool / dev server            |
| @vitejs/plugin-react | ^4.3.1   | JSX + Fast Refresh                 |

> Note: game-client uses React **18** (not 19) because boardgame.io 0.50.x's React
> peer dependency targets React 16–18. The existing frontend at /frontend/ can remain
> on React 19 — these are separate projects.

---

## Auth Handshake — Current Limitation & Fix Required

### Current Situation

Flask has no persistent session mechanism. After login, the existing SPA (port 5173)
holds the user object in React state (memory only). The new game client (port 3000) is a
separate browser origin and cannot read that memory.

### Interim Solution (implemented)

The game client allows users to enter a **display name** without requiring Flask auth.
They can still play all games. Their display name is stored in `localStorage` within the
game client's origin.

Additionally, when the existing SPA redirects a user to the game client, it can pass the
username as a URL parameter:
```
http://localhost:3000?userName=Alice&userId=1
```
The game client reads these params on mount and pre-fills the display name.

### Proper Fix (needs teammate action)

**Ask teammate to add ONE read-only endpoint to Flask:**

```python
# Suggested addition to backend/main_server/main.py
# DO NOT add this yourself — flag it to the teammate.

@app.route("/api/me", methods=["GET"])
def get_me():
    """
    Returns the currently logged-in user if a valid user_id cookie/param is provided.
    Requires Flask-Login or a session mechanism to be added.
    """
    pass  # teammate implements this
```

Until this endpoint exists, the game client uses the display-name approach described above.

---

## Game Registry Pattern

All games are registered in **one place only**: `game-server/games.js`.

Adding a new game:
1. Create `/game-client/src/games/newgame/NewGame.js` (boardgame.io Game definition)
2. Create `/game-client/src/games/newgame/NewGameBoard.jsx` (React board)
3. Add to `game-server/games.js`:
   ```javascript
   import { NewGame } from '../game-client/src/games/newgame/NewGame.js';
   export const games = [WarGame, NewGame]; // ← add here only
   ```
4. The Lobby UI reads the game list dynamically — no frontend changes needed.

---

## boardgame.io Phase Pattern

Every game should define phases for its major game-flow states.
War uses two phases: `playing` (normal rounds) and `war` (tie-breaker).
Future games should follow the same pattern.

---

## Known Limitations

| Limitation                        | Notes                                              |
|-----------------------------------|----------------------------------------------------|
| Multiplayer not yet active        | Infrastructure is in place; bot fills p2 slot now  |
| No Flask session endpoint         | Needs teammate to add `/api/me`                    |
| Passwords stored in plaintext     | Existing Flask issue — do not fix in this layer    |
| In-memory Flask game state        | Flask war state is lost on server restart          |
| Bot delay is frontend-only        | BOT_DELAY_MS is a UI constant, not a server delay  |
