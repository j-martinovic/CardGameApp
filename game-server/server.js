// boardgame.io game server — port 8000.
// This file is the only entry point for the game server layer.
// Flask at port 5000 is NOT touched. The existing SPA at port 5173 is NOT touched.

import { Server } from 'boardgame.io/server';
import cors from 'koa-cors';
import { games } from './games.js';

const PORT = parseInt(process.env.BGIO_PORT || '8000', 10);

// Origins that the browser allows to call this server.
// Includes the new game client (3000) and the existing SPA (5173).
const ALLOWED_ORIGINS = (process.env.BGIO_ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

// Build the boardgame.io server with all registered games.
const server = Server({ games });

// Apply CORS middleware so the React clients can reach this server.
// koa-cors wraps Koa's app, which boardgame.io exposes as server.app.
server.app.use(
  cors({
    origin: (ctx) => {
      const requestOrigin = ctx.request.header.origin;
      if (ALLOWED_ORIGINS.includes(requestOrigin)) {
        return requestOrigin;
      }
      return ALLOWED_ORIGINS[0]; // fallback — still restricts unknown origins
    },
    credentials: true,
  })
);

server.run(PORT, () => {
  console.log(`boardgame.io server running on http://localhost:${PORT}`);
  console.log(`Games registered: ${games.map((g) => g.name).join(', ')}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
