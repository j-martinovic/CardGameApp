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
import { GoFishGame } from '../game-client/src/games/gofish/GoFish.js';
import { CustomGameTemplate } from './customGameRegistry.js';

// ── createMultiplayerMatch pattern ───────────────────────────────────────────
//
// When the multiplayer lobby (MultiplayerLobby.jsx) starts a game, it calls
// LobbyAPI.createMultiplayerMatch(gameName, numPlayers, setupData).
//
// For standard games (war, go_fish):
//   setupData = {}   numPlayers comes from the room's max_players
//
// For custom games:
//   setupData = { rules: <RuleSchema object> }
//   gameName  = 'custom'
//   numPlayers comes from rules.numPlayers
//
// boardgame.io's createMatch endpoint passes numPlayers and setupData to setup().
// The game's setup(ctx, setupData) receives both. CustomGameTemplate uses
// setupData.rules to delegate to buildCustomGame() (CustomGameEngine.js).
// ─────────────────────────────────────────────────────────────────────────────

export const games = [
  WarGame,
  GoFishGame,
  CustomGameTemplate,
  // Add future games here
];
