// LobbyAPI.js — wrapper around the boardgame.io Lobby REST API.
//
// The boardgame.io server exposes these REST endpoints automatically:
//   GET  /games                        — list registered game names
//   GET  /games/{gameName}             — list matches for a game
//   POST /games/{gameName}/create      — create a new match
//   POST /games/{gameName}/{matchID}/join — join a match
//   POST /games/{gameName}/{matchID}/leave — leave a match
//
// LobbyClient from boardgame.io/client wraps these in a typed API.
// This module re-exports a pre-configured singleton and convenience helpers.

import { LobbyClient } from 'boardgame.io/client';

const BGIO_SERVER = import.meta.env.VITE_BGIO_SERVER_URL || 'http://localhost:8000';

// Singleton client — created once, reused across the app.
export const lobbyClient = new LobbyClient({ server: BGIO_SERVER });

/**
 * createAndJoinMatch(gameName, playerName)
 *
 * Creates a single-player match and immediately joins it as playerID '0'.
 * Returns { matchID, playerID: '0', playerCredentials } on success.
 * Throws on network or server error.
 */
export async function createAndJoinMatch(gameName, playerName) {
  // 1. Create the match.
  const { matchID } = await lobbyClient.createMatch(gameName, {
    numPlayers: 1,
    setupData: {},
  });

  // 2. Join as the only player (playerID '0').
  const { playerCredentials } = await lobbyClient.joinMatch(gameName, matchID, {
    playerID: '0',
    playerName,
  });

  return { matchID, playerID: '0', playerCredentials };
}

/**
 * listMatches(gameName)
 * Returns an array of open matches for the given game name.
 */
export async function listMatches(gameName) {
  try {
    const { matches } = await lobbyClient.listMatches(gameName);
    return matches ?? [];
  } catch {
    return [];
  }
}

/**
 * getGames()
 * Returns the list of game names registered on the server.
 */
export async function getGames() {
  try {
    const { games } = await lobbyClient.listGames();
    return games ?? [];
  } catch {
    return [];
  }
}
