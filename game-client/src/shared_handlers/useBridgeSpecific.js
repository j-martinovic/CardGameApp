// useBridgeSpecific — shared hook for Contract Bridge mechanics.
//
// Usage:
//   const { openBiddingBox, doubleBid, revealDummyHand, ... } = useBridgeSpecific(moves, G);

/**
 * @param {object} moves  — boardgame.io moves object
 * @param {object} G      — boardgame.io game state
 * @returns {object}      — named handler functions
 */
export function useBridgeSpecific(moves, G) {
  return {
    /** Signal that a player has opened their bidding box to make a call. */
    openBiddingBox: (playerID) => moves.open_bidding_box?.(playerID),

    /** Record a double bid on the last contract. */
    doubleBid: (playerID) => moves.double_bid?.(playerID),

    /** Record a redouble bid (only valid after a double). */
    redoubleBid: (playerID) => moves.redouble_bid?.(playerID),

    /** Flip the dummy hand face-up after the opening lead. */
    revealDummyHand: (dummyPlayerID) => moves.reveal_dummy_hand?.(dummyPlayerID),

    /** Declare the rest of the tricks without playing them out. */
    claimRemainingTricks: (claimantID, claimedTricks) =>
      moves.claim_remaining_tricks?.(claimantID, claimedTricks),

    /** Record a Bridge Alert explaining a partner's non-standard bid. */
    alertExplainBid: (alertingPlayerID, alertedBid, explanation) =>
      moves.alert_explain_bid?.(alertingPlayerID, alertedBid, explanation),

    /** Record an unauthorized information infraction. */
    unauthorizedInformationWarning: (offendingPlayerID, infraction) =>
      moves.unauthorized_information_warning?.(offendingPlayerID, infraction),

    /** Record use of the STOP card before a skip bid. */
    stopCardIndicator: (playerID) => moves.stop_card_indicator?.(playerID),

    /** Accept an opponent's claim of remaining tricks. */
    claimAcceptance: (acceptingPlayerID) => moves.claim_acceptance?.(acceptingPlayerID),

    /** Send a message visible only to a player's partner. */
    partnershipChat: (senderID, message) => moves.partnership_chat?.(senderID, message),
  };
}
