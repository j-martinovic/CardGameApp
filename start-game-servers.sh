#!/usr/bin/env bash
# start-game-servers.sh
# Starts the boardgame.io server and the game client Vite dev server in parallel.
# Flask (port 5000) and the existing SPA (port 5173) are NOT started here —
# start those in separate terminals as you normally would.
#
# Usage:
#   chmod +x start-game-servers.sh
#   ./start-game-servers.sh
#
# To stop: Ctrl+C (kills both processes via trap below)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/.env"
  set +a
  echo "[start] Loaded .env"
fi

# Verify node_modules are installed
if [ ! -d "$SCRIPT_DIR/game-server/node_modules" ]; then
  echo "[start] Installing game-server dependencies..."
  (cd "$SCRIPT_DIR/game-server" && npm install)
fi

if [ ! -d "$SCRIPT_DIR/game-client/node_modules" ]; then
  echo "[start] Installing game-client dependencies..."
  (cd "$SCRIPT_DIR/game-client" && npm install)
fi

# Trap Ctrl+C to kill both background jobs cleanly
cleanup() {
  echo ""
  echo "[stop] Shutting down game servers..."
  kill "$BGIO_PID" "$CLIENT_PID" 2>/dev/null
  wait "$BGIO_PID" "$CLIENT_PID" 2>/dev/null
  echo "[stop] Done."
}
trap cleanup INT TERM

# Start boardgame.io server (port 8000)
echo "[start] Starting boardgame.io server on port ${BGIO_PORT:-8000}..."
(cd "$SCRIPT_DIR/game-server" && node server.js) &
BGIO_PID=$!

# Small delay to let the bgio server bind before the client tries to proxy to it
sleep 1

# Start game client (port 3000)
echo "[start] Starting game client on port 3000..."
(cd "$SCRIPT_DIR/game-client" && npm run dev) &
CLIENT_PID=$!

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  boardgame.io server  → http://localhost:${BGIO_PORT:-8000}  │"
echo "│  Game client (Vite)   → http://localhost:3000  │"
echo "│                                         │"
echo "│  Press Ctrl+C to stop both servers.     │"
echo "└─────────────────────────────────────────┘"
echo ""

# Wait for both jobs — script stays alive until Ctrl+C
wait "$BGIO_PID" "$CLIENT_PID"
