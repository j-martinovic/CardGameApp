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

/**
 * createMultiplayerMatch(gameName, numPlayers, setupData)
 * Creates a match with multiple seats. Does not join — caller must joinMultiplayerMatch.
 */
export async function createMultiplayerMatch(gameName, numPlayers, setupData = {}) {
  const { matchID } = await lobbyClient.createMatch(gameName, {
    numPlayers,
    setupData,
  });
  return { matchID };
}

/**
 * joinMultiplayerMatch(gameName, matchID, playerID, playerName)
 * Joins an existing match at a specific seat (playerID "0", "1", …).
 * Returns { playerCredentials }.
 */
export async function joinMultiplayerMatch(gameName, matchID, playerID, playerName) {
  const { playerCredentials } = await lobbyClient.joinMatch(gameName, matchID, {
    playerID: String(playerID),
    playerName,
  });
  return { playerCredentials };
}

/**
 * leaveMultiplayerMatch(gameName, matchID, playerID, credentials)
 */
export async function leaveMultiplayerMatch(gameName, matchID, playerID, credentials) {
  await lobbyClient.leaveMatch(gameName, matchID, {
    playerID: String(playerID),
    credentials,
  });
}

/**
 * getMatchState(gameName, matchID)
 * Returns current match metadata (players, status) without joining.
 */
export async function getMatchState(gameName, matchID) {
  const match = await lobbyClient.getMatch(gameName, matchID);
  return match;
}

/**
 * createCustomGameMatch(rules, numPlayers, playerName)
 * Creates a 'custom' boardgame.io match, passing rules in setupData.
 * Joins as playerID '0' (host).
 */
export async function createCustomGameMatch(rules, numPlayers, playerName) {
  const { matchID } = await lobbyClient.createMatch('custom', {
    numPlayers,
    setupData: { rules },
  });
  const { playerCredentials } = await lobbyClient.joinMatch('custom', matchID, {
    playerID: '0',
    playerName,
  });
  return { matchID, playerID: '0', playerCredentials };
}
