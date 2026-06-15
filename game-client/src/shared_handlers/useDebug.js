// useDebug — shared hook for development and QA tools.
//
// IMPORTANT: Only mount this hook in development builds.
// Gate it with: if (import.meta.env.DEV) { ... }
//
// Usage:
//   const { forceSpecificDeal, revealAllHands, simulateDisconnect, ... } = useDebug(moves, G);

/**
 * @param {object} moves  — boardgame.io moves object
 * @param {object} G      — boardgame.io game state
 * @returns {object}      — named handler functions
 */
export function useDebug(moves, G) {
  return {
    /** Override a player's hand with a specific set of cards for testing. */
    forceSpecificDeal: (playerID, hand) => moves.force_specific_deal?.(playerID, hand),

    /** Flip every card in every hand face-up (god-mode view). */
    revealAllHands: () => moves.reveal_all_hands?.(),

    /** Simulate a player disconnection for reconnection-flow testing. */
    simulateDisconnect: (playerID) => moves.simulate_disconnect?.(playerID),

    /** Apply an arbitrary patch to the game state for manual testing. */
    stepGameState: (patch) => moves.step_game_state?.(patch),

    /**
     * Return a serializable snapshot of the full debug log from local G.
     * @returns {{ actionLog: Array, debugLog: Array }}
     */
    dumpGameLog: () => ({
      actionLog: G?.action_log ? [...G.action_log] : [],
      debugLog: G?.debug_log ? [...G.debug_log] : [],
    }),
  };
}
