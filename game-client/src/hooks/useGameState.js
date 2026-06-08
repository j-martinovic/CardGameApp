// useGameState.js — custom hook for managing boardgame.io match lifecycle.
//
// Responsibilities:
//   1. Manage the matchID and playerID used to join a boardgame.io match.
//   2. Persist credentials in sessionStorage so a page refresh doesn't lose the match.
//   3. Expose helpers to enter and leave a match.
//
// The actual G/ctx/moves props flow from the boardgame.io Client HOC directly
// into WarBoard — this hook does not intercept those; it manages routing state.

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'bgio_match_credentials';

function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(data) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage may be unavailable in some private-browsing configs.
  }
}

function clearStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

/**
 * useGameState(initialUserName)
 *
 * Returns:
 *   matchCredentials  — { matchID, playerID, playerName } | null
 *   joinMatch(matchID, playerID, playerName) — enter a match
 *   leaveMatch()      — clear credentials and return to lobby
 */
export function useGameState(initialUserName = 'Player') {
  const [matchCredentials, setMatchCredentials] = useState(() => {
    // Restore from sessionStorage if the user refreshed mid-game.
    const stored = loadFromStorage();
    return stored || null;
  });

  // Also read userName from URL params (passed by the existing SPA when
  // linking a logged-in user to the game client).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlName = params.get('userName');
    if (urlName && !matchCredentials) {
      // Pre-fill the display name but don't auto-join a match.
      // The Lobby component reads this from the hook's exposed userName.
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const joinMatch = useCallback((matchID, playerID, playerName, playerCredentials = '') => {
    const creds = { matchID, playerID, playerName, playerCredentials };
    saveToStorage(creds);
    setMatchCredentials(creds);
  }, []);

  const leaveMatch = useCallback(() => {
    clearStorage();
    setMatchCredentials(null);
  }, []);

  // Derive userName: URL param → stored credentials → prop default.
  const params = new URLSearchParams(window.location.search);
  const userName = params.get('userName') || matchCredentials?.playerName || initialUserName;

  return { matchCredentials, joinMatch, leaveMatch, userName };
}
