// useLobby — shared hook for lobby room management actions.
//
// Calls Flask REST endpoints on the shared_handlers Blueprint.
// Usage:
//   const { createRoom, joinRoom, leaveRoom, readyUp, ... } = useLobby();

import { SHARED_API_BASE } from './config.js';

async function post(path, body) {
  const res = await fetch(`${SHARED_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.message || `HTTP ${res.status}`), { data: json });
  return json;
}

/**
 * @returns {object} — named async handler functions
 */
export function useLobby() {
  return {
    /** Create a new lobby room. */
    createRoom: (hostID, gameName, maxPlayers, houseRules = {}) =>
      post('/lobby/create', {
        host_id: hostID,
        game_name: gameName,
        max_players: maxPlayers,
        house_rules: houseRules,
      }),

    /** Join an existing room. */
    joinRoom: (roomID, playerID) =>
      post(`/lobby/${roomID}/join`, { player_id: playerID }),

    /** Leave a room. */
    leaveRoom: (roomID, playerID) =>
      post(`/lobby/${roomID}/leave`, { player_id: playerID }),

    /** Toggle ready state. */
    readyUp: (roomID, playerID, ready = true) =>
      post(`/lobby/${roomID}/ready`, { player_id: playerID, ready }),

    /** Join as a spectator. */
    spectateGame: (roomID, spectatorID) =>
      post(`/lobby/${roomID}/spectate`, { spectator_id: spectatorID }),

    /** Promote a spectator into the player roster. */
    promoteSpectator: (roomID, spectatorID) =>
      post(`/lobby/${roomID}/promote_spectator`, { spectator_id: spectatorID }),

    /** Update the room's house rules (host only). */
    setHouseRules: (roomID, hostID, rules) =>
      post(`/lobby/${roomID}/house_rules`, { host_id: hostID, rules }),

    /** Cast a vote to kick a player from the room. */
    kickVote: (roomID, voterID, targetID) =>
      post(`/lobby/${roomID}/kick_vote`, { voter_id: voterID, target_id: targetID }),

    /** Request a rematch after the game ends. */
    rematchRequest: (roomID, playerID) =>
      post(`/lobby/${roomID}/rematch`, { player_id: playerID }),

    /** Accept a rematch request (alias for rematchRequest). */
    acceptRematch: (roomID, playerID) =>
      post(`/lobby/${roomID}/rematch`, { player_id: playerID }),

    /** Fill an open seat with a bot. */
    botFillPlayer: (roomID, seatIndex) =>
      post(`/lobby/${roomID}/bot_fill`, { seat_index: seatIndex }),

    /** Transfer host privileges to another player. */
    hostMigration: (roomID, oldHostID, newHostID) =>
      post(`/lobby/${roomID}/host_migration`, {
        old_host_id: oldHostID,
        new_host_id: newHostID,
      }),
  };
}
