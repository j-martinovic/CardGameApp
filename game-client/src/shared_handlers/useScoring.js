// useScoring — shared hook for score updates, achievements, and hand history.
//
// Usage:
//   const { updateScore, unlockAchievement, exportHandHistory, ... } = useScoring(moves, G);

/**
 * @param {object} moves  — boardgame.io moves object
 * @param {object} G      — boardgame.io game state
 * @returns {object}      — named handler functions
 */
export function useScoring(moves, G) {
  return {
    /** Add (or subtract) points from a player's score. */
    updateScore: (playerID, delta, reason = '') =>
      moves.update_score?.(playerID, delta, reason),

    /** Mark an achievement as unlocked for a player. */
    unlockAchievement: (playerID, achievementID) =>
      moves.unlock_achievement?.(playerID, achievementID),

    /**
     * Return a serializable copy of the action log from local game state.
     * This reads G directly — no server round-trip needed.
     * @returns {Array} copy of G.action_log
     */
    exportHandHistory: () => (G?.action_log ? [...G.action_log] : []),

    /**
     * Return the game event at a specific replay step index.
     * @param {number} stepIndex
     * @param {Array}  handHistory
     * @returns {{ step: object|null, stepIndex: number, totalSteps: number }}
     */
    kibitzReplayStep: (stepIndex, handHistory = []) => {
      const total = handHistory.length;
      const step = stepIndex >= 0 && stepIndex < total ? handHistory[stepIndex] : null;
      return { step, stepIndex, totalSteps: total };
    },
  };
}
