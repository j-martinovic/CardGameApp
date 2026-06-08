// Central game registry — add new games here and nowhere else.
// The server reads this list to register all games with boardgame.io.
// The Lobby UI reads game names dynamically from the server's /games endpoint.
//
// To add a new game:
//   1. Create game-client/src/games/mygame/MyGame.js
//   2. Import it here
//   3. Add to the games array below

// Cross-package import: the server imports the game definition from the
// client source directory. This works in local development because both
// directories share the same repo. For production builds, copy game
// definitions to a shared package instead.
import { WarGame } from '../game-client/src/games/war/War.js';

export const games = [
  WarGame,
  // Add future games here: BlackjackGame, PokerGame, etc.
];
