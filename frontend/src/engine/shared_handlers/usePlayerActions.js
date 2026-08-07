// usePlayerActions — shared hook for trick-taking, declaration, and split-hand actions.
//
// Usage:
//   const { claimTrick, challengePlay, declareWin, ... } = usePlayerActions(moves, G);

/**
 * @param {object} moves  — boardgame.io moves object
 * @param {object} G      — boardgame.io game state
 * @returns {object}      — named handler functions
 */
export function usePlayerActions(moves, G) {
  return {
    /** Record that a player has won a trick. */
    claimTrick: (playerID, trickCards) => moves.claim_trick?.(playerID, trickCards),

    /** Challenge another player's most recent action. */
    challengePlay: (challengerID, challengedID, reason) =>
      moves.challenge_play?.(challengerID, challengedID, reason),

    /** Declare a meld (set of cards) in games like Rummy or Canasta. */
    meldDeclare: (playerID, meldCards, meldType) =>
      moves.meld_declare?.(playerID, meldCards, meldType),

    /** Swap cards between a player and a partner. */
    swapCards: (playerID, giveIndices, receiveIndices, partnerID) =>
      moves.swap_cards?.(playerID, giveIndices, receiveIndices, partnerID),

    /** Declare a self-win (Gin Rummy etc); server must verify. */
    declareWin: (playerID) => moves.declare_win?.(playerID),

    /** Split a Blackjack hand into two separate hands. */
    splitHandBlackjack: (playerID) => moves.split_hand_blackjack?.(playerID),

    /** Place a Blackjack insurance bet against a dealer Ace. */
    insuranceBet: (playerID, amount) => moves.insurance_bet?.(playerID, amount),

    /** Add chips to a player's stack (rebuy). */
    rebuyChips: (playerID, amount) => moves.rebuy_chips?.(playerID, amount),

    /** Toggle whether a player will sit out the next hand. */
    sitOutNextHand: (playerID, sittingOut = true) =>
      moves.sit_out_next_hand?.(playerID, sittingOut),
  };
}
