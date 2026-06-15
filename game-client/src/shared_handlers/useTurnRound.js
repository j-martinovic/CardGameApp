// useTurnRound — shared hook for turn and round lifecycle actions.
//
// Usage:
//   const { endTurn, startNextRound, forfeit, ... } = useTurnRound(moves, G);

/**
 * @param {object} moves  — boardgame.io moves object
 * @param {object} G      — boardgame.io game state
 * @returns {object}      — named handler functions
 */
export function useTurnRound(moves, G) {
  return {
    /** Initialize shared round metadata at game start. */
    startGame: (playerIDs) => moves.start_game?.(playerIDs),

    /** Record that the given player's turn has ended. */
    endTurn: (playerID) => moves.end_turn?.(playerID),

    /** Increment round counter and clear per-round transient state. */
    startNextRound: () => moves.start_next_round?.(),

    /** Record a player forfeit, marking them as eliminated. */
    forfeit: (playerID) => moves.forfeit?.(playerID),

    /** Auto-play or auto-pass for a player whose turn timer has expired. */
    turnTimeoutAutoplay: (playerID) => moves.turn_timeout_autoplay?.(playerID),

    /** Request an undo of the last action (boardgame.io undo if enabled). */
    undoLastAction: () => moves.undo?.(),

    /** Record a reconnection event for the given player. */
    restoreReconnectionState: (playerID) =>
      moves.restore_reconnection_state?.(playerID),

    /** Set a resync flag that instructs all clients to re-fetch full state. */
    forceResync: () => moves.force_resync?.(),
  };
}
