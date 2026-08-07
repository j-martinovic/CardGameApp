# boardgame.io — How the Framework Works (and where we use it)

Everything multiplayer in this project rides on [boardgame.io](https://boardgame.io/)
([GitHub](https://github.com/boardgameio/boardgame.io), docs at
[boardgame.io/documentation](https://boardgame.io/documentation/#/)). This page explains
the framework's concepts in the order you'll meet them in our code, with a link to the
official docs for each and a pointer to where the concept appears in this repo. If you
read one external page, make it the
[official tutorial](https://boardgame.io/documentation/#/tutorial).

## The big idea

You describe a game as a plain JavaScript object — state, moves, phases. boardgame.io
then runs that **same object in two places**:

- On the **server**, as the authority: it applies moves, keeps the real state, and
  broadcasts updates ([Server API](https://boardgame.io/documentation/#/api/Server)).
- On each **client**, for optimistic prediction: your move appears instantly while the
  server confirms it ([Multiplayer docs](https://boardgame.io/documentation/#/multiplayer)).

That's why [shared/games/](../shared/games/) exists: [Mighty.js](../shared/games/Mighty.js)
and [War.js](../shared/games/War.js) are imported by **both**
[backend/card_server/server.js](../backend/card_server/server.js) and
[frontend/src/LobbyComponents/client.jsx](../frontend/src/LobbyComponents/client.jsx).
One definition, two runtimes — never fork them.

## The Game object

[Official reference: Game](https://boardgame.io/documentation/#/api/Game)

```js
export const Mighty = {
  name: 'Mighty',        // must match what the lobby/server call it
  setup: ({ ctx }) => ({ ...initial G... }),
  moves: { ... },        // or per-phase/per-stage moves
  phases: { ... },
  endIf: ({ G, ctx }) => { ... },   // return a truthy gameover value to end
}
```

### `G` vs `ctx`

- **`G`** is *your* game state — you design it, your moves mutate it. Mutation is safe
  because boardgame.io wraps moves in [Immer](https://immerjs.github.io/immer/)
  ([immutability docs](https://boardgame.io/documentation/#/immutability)).
- **`ctx`** is *framework* state, read-only: `ctx.numPlayers`, `ctx.currentPlayer`,
  `ctx.phase`, `ctx.playOrder`, `ctx.playOrderPos`, `ctx.turn`, `ctx.activePlayers`.
- In ours: Mighty's `G` shape is documented in [shared/mighty.md](shared/mighty.md#game-state-g),
  War's in [shared/war.md](shared/war.md).

### Moves

A move is a function `({ G, ctx, playerID, events, random }, ...args) => { ... }`,
called from the client as `moves.MoveName(...args)`. Returning **`INVALID_MOVE`** rejects
it (state untouched). Official value comes from `boardgame.io/core`; our shared games use
the identical local constant in
[shared/games/bgio-constants.js](../shared/games/bgio-constants.js) so `shared/` has zero
dependencies. A move can be an object (`{ move, undoable, redact, client: false }`) —
`client: false` disables client-side prediction for that move (War uses this because its
move involves randomness).

### Phases and stages

[Phases](https://boardgame.io/documentation/#/phases) are big game chapters, each with its
own `moves`/`turn` config and `onBegin`/`onEnd`/`endIf` hooks.
[Stages](https://boardgame.io/documentation/#/stages) subdivide a *turn* — different
players (or the same player) can be in different stages with different legal moves.
[Turn order](https://boardgame.io/documentation/#/turn-order) is controlled per phase via
`turn.order.first/next`.

In ours: Mighty is the showcase — `bidding` → `preparing` (four stages) → `playing`
(with `choosingJokerSuit`/`killingJoker` stages), all mapped out in
[shared/mighty.md](shared/mighty.md#phase-flow). War has no phases at all — one move,
`turn: { moveLimit: 1 }`.

### Events

[Events docs](https://boardgame.io/documentation/#/events). Moves and hooks receive an
`events` object to drive flow: `events.endTurn({ next })`, `events.endPhase()`,
`events.setPhase(name)`, `events.endStage()`, `events.setStage(name)`,
`events.setActivePlayers(...)`. Mighty leans on these heavily (e.g. `MakeBid` ends the
phase when the auction resolves). Note: on the *client*, `events` arrives as a separate
board prop — one of the engine's current bugs is expecting it on `ctx`
([frontend/board-engine.md](frontend/board-engine.md#other-engine-gotchas)).

### Randomness

[Random docs](https://boardgame.io/documentation/#/random). Use the seeded
`random.Shuffle`, `random.Die`, etc. instead of `Math.random()` — seeded randomness keeps
server, clients, and replays in agreement. Mighty does this right
(`random.Shuffle(G.deck)`, `random.Die(5)`). War's pot-shuffle uses `Math.random()`
inside a `client: false` move — tolerable (it only ever runs on the server) but the
seeded API would be more idiomatic.

### Secret state

[Secret state docs](https://boardgame.io/documentation/#/secret-state). By default **every
client receives the entire `G`** — a `playerView` function (often the provided
`PlayerView.STRIP_SECRETS`) filters what each player sees.

⚠️ In ours: **Mighty defines no `playerView`**, so every player's hand and the kitty are
sent to every browser — anyone who opens devtools can see all cards. Fine while
developing; must be fixed before playing with people you don't trust. (This is why the
board can render opponents' hands face-down: it *has* the data and chooses not to show it.)

## The client side

[Client API](https://boardgame.io/documentation/#/api/Client). The React `Client()` HOC
builds a component that connects, syncs state, and passes props to your board:

```js
const MightyClient = Client({
  game: Mighty,
  board: MightyBoard,          // gets { G, ctx, moves, events, playerID, matchID, isActive, ... }
  numPlayers: 5,
  multiplayer: SocketIO({ server: 'localhost:8000' }),
  loading: LoadingPage,
  debug: true,                 // the debug panel (see below)
})
```

In ours: both clients live in
[frontend/src/LobbyComponents/client.jsx](../frontend/src/LobbyComponents/client.jsx);
the boards are thin wrappers around our GenericBoard engine
([frontend/board-engine.md](frontend/board-engine.md)). The **debug panel**
([debugging docs](https://boardgame.io/documentation/#/debugging)) renders alongside the
board when `debug: true` — you can inspect `G`/`ctx`, dispatch moves by hand, and
impersonate any player, which is how to test 5-player Mighty solo.

## The server side and the Lobby

[Server API](https://boardgame.io/documentation/#/api/Server) ·
[Lobby API](https://boardgame.io/documentation/#/api/Lobby)

`Server({ games, origins })` is a [Koa](https://koajs.com/) app with a socket.io
transport. Because we call `server.run({ port: 8000 })` **without** `lobbyConfig.apiPort`,
the Lobby REST API mounts on the same port. The lobby endpoints the frontend uses (via
`LobbyClient` from `boardgame.io/client`):

| Endpoint | Purpose | Called from |
|---|---|---|
| `GET /games` | list registered game names | `LobbyScreen.handleFindAllGameTypes` |
| `GET /games/:name` | list matches of a game | `LobbyScreen.handleLoadAllGames` |
| `POST /games/:name/create` | create a match (`numPlayers`) | `handleCreateLobby` |
| `POST /games/:name/:id/join` | claim a seat → returns `playerCredentials` | `handleGameStart` |
| `POST /games/:name/:id/leave` | free the seat | `handleLeaveGame` |

`playerCredentials` is the per-seat secret the client must present with every move — we
thread it from the lobby join into the `Client` component
([frontend/lobby-and-clients.md](frontend/lobby-and-clients.md)).

Match state is **in-memory** by default (restart = matches gone); boardgame.io supports
[storage backends](https://boardgame.io/documentation/#/storage) when persistence matters.
We also register plain Koa routes for auth on the same server —
[backend/auth-and-users.md](backend/auth-and-users.md).

## Testing games without a UI

[Testing docs](https://boardgame.io/documentation/#/testing). `Client` with
`multiplayer: Local()` (or no multiplayer at all) runs a game entirely in-process — you
can script `client.moves.MakeBid('14S')` in a unit test and assert on
`client.getState()`. This is the recommended harness for fixing Mighty's rule bugs
([project/refactor-plan.md](project/refactor-plan.md) step 5).

## Concept → our code, at a glance

| boardgame.io concept | Where it lives here |
|---|---|
| Game objects | [shared/games/Mighty.js](../shared/games/Mighty.js), [shared/games/War.js](../shared/games/War.js) |
| Server + Lobby REST + our auth routes | [backend/card_server/server.js](../backend/card_server/server.js) |
| React clients (`Client`, `SocketIO`) | [frontend/src/LobbyComponents/client.jsx](../frontend/src/LobbyComponents/client.jsx) |
| Lobby REST consumer (`LobbyClient`) | [frontend/src/LobbyComponents/LobbyScreen.jsx](../frontend/src/LobbyComponents/LobbyScreen.jsx) |
| Boards (receive `G`/`ctx`/`moves` props) | [frontend/src/board/](../frontend/src/board/) + the engine ([frontend/board-engine.md](frontend/board-engine.md)) |
| `INVALID_MOVE` | [shared/games/bgio-constants.js](../shared/games/bgio-constants.js) |
| Debug panel | `debug: true` in both clients and games |
| Missing on purpose (yet) | `playerView` (secret hands), persistent match storage, `Local()` tests |
