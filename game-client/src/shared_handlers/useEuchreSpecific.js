// useEuchreSpecific — shared hook for Euchre-specific bidding mechanics.
//
// Usage:
//   const { orderItUp, goAlone, stickTheDealer, ... } = useEuchreSpecific(moves, G);

/**
 * @param {object} moves  — boardgame.io moves object
 * @param {object} G      — boardgame.io game state
 * @returns {object}      — named handler functions
 */
export function useEuchreSpecific(moves, G) {
  return {
    /** Order the dealer to pick up the turned-up card, naming its suit as trump. */
    orderItUp: (playerID) => moves.order_it_up?.(playerID),

    /** Pass during the first round of bidding (decline to order it up). */
    passPickItUp: (playerID) => moves.pass_pick_it_up?.(playerID),

    /** Declare that the maker will play without their partner's help. */
    goAlone: (playerID) => moves.go_alone?.(playerID),

    /** Force the dealer to name trump when everyone has passed in round 2. */
    stickTheDealer: (dealerID) => moves.stick_the_dealer?.(dealerID),

    /**
     * Alias for stickTheDealer — used in some regional rule sets.
     * @param {string} dealerID — ID of the dealer who must name trump
     */
    screwTheDealer: (dealerID) => moves.screw_the_dealer?.(dealerID),
  };
}
