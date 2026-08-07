# War — Game Logic Walkthrough

The simplest game in the project and the best place to learn the boardgame.io shape
before reading Mighty. One file: [shared/games/War.js](../../shared/games/War.js)
(~175 lines). Solo player vs "the House" — the bot needs no strategy because War has no
decisions.

New to boardgame.io? Read [boardgame-io.md](../boardgame-io.md) first.

## Game state (`G`)

Built in `setup()` ([War.js:99-111](../../shared/games/War.js#L99-L111)) from a shuffled
52-card deck (cards are `{rank, suit, value}` objects — note: unlike Mighty's `"AS"`
strings — and suits are the symbols `♠ ♥ ♦ ♣`):

| Field | Meaning |
|---|---|
| `playerDeck` / `botDeck` | The two 26-card piles; winner's pot goes to the bottom |
| `lastPlayerCard` / `lastBotCard` | The face-up cards shown in the play slots |
| `warSequences` | Array of war events this round (`{playerDown, botDown, playerUp, botUp}`) so the board can animate ties |
| `roundResult` | `'player' \| 'bot' \| 'draw' \| null` |
| `roundCount` | Rounds played (also the 1000-round safety valve) |
| `log` | Human-readable round history (`"R3: K♠ vs 7♦ — player"`) |

## The one move: `playCard`

([War.js:116-158](../../shared/games/War.js#L116-L158)) The player flips their top card;
the bot's response and the **entire round resolve inside this single move**, including
chained wars, via the pure helper `resolveRound(playerDeck, botDeck)`
([War.js:44-90](../../shared/games/War.js#L44-L90)):

1. Both sides reveal their top card into the pot.
2. Tie → **war**: each side commits 3 face-down cards + 1 new face-up card; repeat while
   the face-up cards keep tying. A side with fewer than 4 cards left can't fight the war
   and loses the round on the spot (both too low → draw).
3. Higher face-up card takes the whole pot, shuffled to the *bottom* of their deck.

Design notes worth copying into other games:
- `resolveRound` is a **pure function** over deck copies; the move applies its result to
  `G` afterward. This is the shape Mighty's `TakeTrick`/`UpdateScore` should move toward
  (testable without boardgame.io).
- The move is declared `client: false` ([War.js:157](../../shared/games/War.js#L157))
  because it uses `Math.random()` for the pot shuffle — prediction is disabled so the
  randomness only ever runs on the server. (Idiomatic alternative: seeded
  `random.Shuffle` — see [boardgame-io.md](../boardgame-io.md#randomness). The
  `.sort(() => Math.random() - 0.5)` idiom is also a statistically biased shuffle;
  harmless here, don't reuse it.)

## Flow control

- **No phases.** The file's header comment mentions `'playing'`/`'war'` phases — that's
  stale; ties are handled inside the move. (Safe to delete the comment.)
- `turn: { moveLimit: 1 }` — the turn auto-ends after each move; with one seat it cycles
  straight back to player 0, so the player can just keep clicking.
- `endIf` ([War.js:162-167](../../shared/games/War.js#L162-L167)): a side with an empty
  deck loses (empty player deck → bot wins, and vice versa; both empty → draw);
  1000 rounds → draw. The returned `{ winner }` becomes `ctx.gameover`, which the
  board's GameResult overlay reads.
- `minPlayers: 1, maxPlayers: 1` — the lobby creates War matches with 1 seat
  (`GAME_NUM_PLAYERS.War` in
  [client.jsx](../../frontend/src/LobbyComponents/client.jsx)).

## How the board maps onto it

[frontend/src/board/war/WarBoardConfig.js](../../frontend/src/board/war/WarBoardConfig.js)
renders through the GenericBoard engine ([frontend/board-engine.md](../frontend/board-engine.md)):

- Zones bind straight to `G` fields by id: `botDeck`/`playerDeck` as `Deck` primitives,
  `lastBotCard`/`lastPlayerCard` as `CardSlot`s.
- Clicking your deck routes `'deck→hand'` through the `moveMap` to the `playCard`
  handler, and a `moveOverrides` entry calls the real `moves.playCard()` — **this is the
  working example of the wiring Mighty still needs**.
- `endTurnEnabled: false` hides the End Turn button (`moveLimit: 1` already ends turns).
- [WarAI.js](../../frontend/src/board/war/WarAI.js) despite the name contains no AI —
  just three display constants (bot name, animation delays).
