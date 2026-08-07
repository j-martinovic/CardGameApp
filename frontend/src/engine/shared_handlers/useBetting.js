// useBetting — shared hook for all betting and wagering actions.
//
// Usage:
//   const { placeBid, raiseBet, callBet, fold, ... } = useBetting(moves, G);

/**
 * @param {object} moves  — boardgame.io moves object
 * @param {object} G      — boardgame.io game state
 * @returns {object}      — named handler functions
 */
export function useBetting(moves, G) {
  return {
    /** Place a bid for the current round. */
    placeBid: (playerID, amount) => moves.place_bid?.(playerID, amount),

    /** Raise the current bet to a new total amount. */
    raiseBet: (playerID, raiseTo) => moves.raise_bet?.(playerID, raiseTo),

    /** Match the current bet. */
    callBet: (playerID) => moves.call_bet?.(playerID),

    /** Fold the current hand. */
    fold: (playerID) => moves.fold?.(playerID),

    /** Pass without betting (check) when no bet is owed. */
    check: (playerID) => moves.check?.(playerID),

    /** Pass the bid in a bidding game (Euchre, Spades). */
    passBid: (playerID) => moves.pass_bid?.(playerID),

    /** Set the trump suit for the current hand. */
    setTrumpSuit: (suit) => moves.set_trump_suit?.(suit),

    /** Auto-pass for a player whose bid timer has expired. */
    bidTimeoutAutopass: (playerID) => moves.bid_timeout_autopass?.(playerID),

    /**
     * Check whether a raise amount meets the table minimum.
     * @returns {boolean} true if the raise is legal
     */
    enforceMinimumRaise: (raiseAmount, minimum) => raiseAmount >= minimum,

    /** Post an ante, small blind, or big blind. */
    postAnteBlind: (playerID, blindType, amount) =>
      moves.post_ante_blind?.(playerID, blindType, amount),

    /** Activate a player's time bank to extend their decision window. */
    activateTimeBank: (playerID) => moves.activate_time_bank?.(playerID),

    /** Distribute the pot evenly among multiple winners. */
    resolveSplitPot: (winners) => moves.resolve_split_pot?.(winners),

    /** Post an optional live straddle. */
    straddle: (playerID, amount) => moves.straddle?.(playerID, amount),

    /** Record player consent to run out board cards twice. */
    runItTwice: (consentingPlayers) => moves.run_it_twice?.(consentingPlayers),
  };
}
