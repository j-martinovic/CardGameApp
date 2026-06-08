# CardGameApp — boardgame.io Integration Guide

> **Read ARCHITECTURE.md first.** This file covers developer operations only.

---

## What was added

Three new directories alongside the existing codebase:

| Directory       | What it is                                        |
|-----------------|---------------------------------------------------|
| `game-server/`  | boardgame.io Node.js server (port 8000)           |
| `game-client/`  | boardgame.io React game UI (port 3000)            |
| `ARCHITECTURE.md` | Full audit + three-layer architecture design   |
| `.env.example`  | Port configuration template                       |
| `start-game-servers.sh` | Convenience startup script                |

**Nothing else was modified.** Flask, the existing frontend (`frontend/`), all routes, models, and migrations are untouched.

---

## Setup

### Prerequisites

- Python 3.x + pip (for Flask — already working)
- Node.js 18+ (for the boardgame.io server and game client)

### Install dependencies

```bash
# boardgame.io server
cd game-server
npm install

# boardgame.io game client
cd ../game-client
npm install
```

### Start everything

**Option 1 — use the script (Linux/macOS/WSL):**
```bash
chmod +x start-game-servers.sh
./start-game-servers.sh
```

**Option 2 — four separate terminals:**
```bash
# Terminal 1 — Flask API (port 5000)
cd backend/main_server
python main.py

# Terminal 2 — Existing SPA (port 5173)
cd frontend
npm run dev

# Terminal 3 — boardgame.io server (port 8000)
cd game-server
npm start

# Terminal 4 — Game client (port 3000)
cd game-client
npm run dev
```

### Open in browser

| URL                    | What you see                    |
|------------------------|---------------------------------|
| http://localhost:5173  | Existing SPA (login + War game) |
| http://localhost:3000  | New game lobby + boardgame.io War |

---

## How it works

### Single-player War (boardgame.io mode)

1. Player opens `http://localhost:3000`, enters their name, clicks **Deal Me In**.
2. Lobby calls boardgame.io server → creates a 1-player match → returns `matchID`.
3. Game client connects via Socket.IO to the match.
4. Player clicks their deck or presses **Space** → triggers `moves.playCard`.
5. Server resolves the full round (including chained wars) and updates `G`.
6. Client receives updated `G` via Socket.IO → animations play.
7. Game ends when one deck is empty or 1000 rounds pass.

### State flow

```
React UI (click) → boardgame.io Client → Socket.IO → boardgame.io Server
                                                       → War.js: playCard()
                                                       → G updated (Immer)
                                                       → Socket.IO broadcast
boardgame.io Client ← updated G ← Socket.IO ← Server
React UI (re-render with new G)
```

---

## Adding a new game

1. Create `game-client/src/games/mygame/MyGame.js` — a boardgame.io `Game` object.
2. Create `game-client/src/games/mygame/MyBoard.jsx` — React board component.
3. Add to `game-server/games.js`:
   ```javascript
   import { MyGame } from '../game-client/src/games/mygame/MyGame.js';
   export const games = [WarGame, MyGame];
   ```
4. Add to the `GAMES` array in `game-client/src/lobby/Lobby.jsx`:
   ```javascript
   { id: 'mygame', label: 'My Game', icon: '🎴', available: true }
   ```
5. Add a Client HOC in `game-client/src/App.jsx` (copy the WarClient pattern).

---

## Environment variables

Copy `.env.example` to `.env` and adjust ports if needed.

| Variable                | Default                  | Used by     |
|-------------------------|--------------------------|-------------|
| `BGIO_PORT`             | `8000`                   | game-server |
| `BGIO_ALLOWED_ORIGINS`  | `http://localhost:3000,http://localhost:5173` | game-server |
| `VITE_BGIO_SERVER_URL`  | `http://localhost:8000`  | game-client |
| `VITE_FLASK_API_URL`    | `http://localhost:5000`  | game-client |

---

## Known issues

| Issue | Notes |
|-------|-------|
| No Flask session auth | Game client uses display names; Flask has no `/api/me`. See ARCHITECTURE.md. |
| Multiplayer not active | Infrastructure is ready; bot fills the second "seat" now. |
| `game-server` imports from `game-client/src` | Works locally; needs a shared package for production. |

---

## File map

```
game-server/
  package.json         — Node dependencies (boardgame.io, koa-cors)
  server.js            — Server entry: registers games, applies CORS, runs on port 8000
  games.js             — Central game registry (add new games here only)

game-client/
  package.json         — React 18, boardgame.io, react-router-dom, vite
  vite.config.js       — port 3000, proxy /api/bgio → port 8000
  index.html           — HTML shell + Google Fonts
  src/
    main.jsx           — React entry point
    App.jsx            — Lobby ↔ Game routing (state machine)
    App.css            — Global casino theme tokens
    games/war/
      War.js           — boardgame.io Game definition (setup, moves, endIf)
      WarAI.js         — Bot config (BOT_DELAY_MS, RESULT_DELAY_MS, BOT_DISPLAY_NAME)
      WarBoard.jsx     — Board component (receives G, ctx, moves from Client HOC)
      WarBoard.css     — Table layout + animation styles
    lobby/
      Lobby.jsx        — Game selection + name form
      Lobby.css        — Lobby styles
      LobbyAPI.js      — Wraps LobbyClient (createAndJoinMatch, listMatches)
    components/
      Card.jsx         — Face-up card (rank + suit)
      Card.css
      CardBack.jsx     — Face-down card (SVG blue-diamond pattern)
      PlayerArea.jsx   — Player's deck + play slot + flip animation
      PlayerArea.css
      BotArea.jsx      — Bot's deck + play slot (mirrors PlayerArea)
      GameResult.jsx   — Game-over overlay
      GameResult.css
    hooks/
      useGameState.js  — matchID/playerID management, sessionStorage persistence
```
