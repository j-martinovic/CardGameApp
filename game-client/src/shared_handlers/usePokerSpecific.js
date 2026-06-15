// usePokerSpecific — shared hook for Poker-specific mechanics.
//
// Usage:
//   const { allIn, showHand, muckHand, rabbitHunt, ... } = usePokerSpecific(moves, G);

/**
 * @param {object} moves  — boardgame.io moves object
 * @param {object} G      — boardgame.io game state
 * @returns {object}      — named handler functions
 */
export function usePokerSpecific(moves, G) {
  return {
    /** Commit all of a player's remaining chips to the pot. */
    allIn: (playerID) => moves.all_in?.(playerID),

    /** Flip the player's hole cards face-up for showdown. */
    showHand: (playerID) => moves.show_hand?.(playerID),

    /** Discard the player's hand face-down at showdown. */
    muckHand: (playerID) => moves.muck_hand?.(playerID),

    /** Reveal the next card(s) that would have been dealt (rabbit hunting). */
    rabbitHunt: (requestingPlayerID) => moves.rabbit_hunt?.(requestingPlayerID),

    /** Signal the server to recalculate side pots after all-in scenarios. */
    trackSidePot: () => moves.track_side_pot?.(),

    /** Toggle the auto-fold preference for a player when it's not their turn. */
    autoFoldCheckbox: (playerID, enabled) => moves.auto_fold_checkbox?.(playerID, enabled),
  };
}
