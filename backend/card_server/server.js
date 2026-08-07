import { Server, Origins } from 'boardgame.io/dist/cjs/server.js';
import { Mighty } from '../../shared/games/Mighty.js';
import { WarGame } from '../../shared/games/War.js';
import { createUser, login, logout } from './users.js';

const server = Server({
  // Provide the definitions for your game(s).
  games: [Mighty, WarGame],

  origins: [
    // Allow your game site to connect.
    'https://www.mygame.domain',
    // Allow localhost to connect, except when NODE_ENV is 'production'.
    Origins.LOCALHOST_IN_DEVELOPMENT
  ],
});

// ── Auth routes ───────────────────────────────────────────────────────────────
// These run on the same Koa app as the boardgame.io lobby API (same port, same
// CORS rules). Body parsing is a tiny local helper — no extra dependencies.

function readJsonBody(ctx) {
  return new Promise((resolve, reject) => {
    let raw = '';
    ctx.req.on('data', (chunk) => { raw += chunk; });
    ctx.req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('invalid JSON body')); }
    });
    ctx.req.on('error', reject);
  });
}

server.router.post('/signup', async (ctx) => {
  const { userName, password, email } = await readJsonBody(ctx);
  if (!userName) { ctx.status = 400; ctx.body = { message: 'You must include a user name' }; return; }
  if (!email)    { ctx.status = 400; ctx.body = { message: 'You must include an email' }; return; }
  if (!password) { ctx.status = 400; ctx.body = { message: 'You must create a password' }; return; }
  try {
    const user = createUser({ userName, password, email });
    ctx.status = 201;
    ctx.body = { message: 'User created!', user };
  } catch (e) {
    ctx.status = 400;
    ctx.body = { message: /UNIQUE/.test(String(e)) ? 'User name or email already taken' : String(e) };
  }
});

server.router.post('/login', async (ctx) => {
  const { userName, password } = await readJsonBody(ctx);
  if (!userName) { ctx.status = 400; ctx.body = { message: 'You must include a user name' }; return; }
  if (!password) { ctx.status = 400; ctx.body = { message: 'You must include a password' }; return; }
  const user = login({ userName, password });
  if (!user) { ctx.status = 401; ctx.body = { message: 'Invalid credentials' }; return; }
  ctx.body = { message: 'Login successful', user };
});

server.router.post('/logout', async (ctx) => {
  const { id } = await readJsonBody(ctx);
  if (!id) { ctx.status = 400; ctx.body = { message: 'You must include a user ID' }; return; }
  if (!logout(id)) { ctx.status = 404; ctx.body = { message: 'User not found' }; return; }
  ctx.body = { message: 'Logout successful' };
});

// One port for everything: game socket, lobby REST API, and auth.
// (Without lobbyConfig.apiPort, boardgame.io mounts the lobby API here too.)
server.run({ port: 8000 }, () =>
  console.log('Game server (games + lobby + auth) running on port 8000')
);
