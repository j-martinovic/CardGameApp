// useCardInteractions — shared hook for all card manipulation actions.
//
// Usage:
//   const { selectCard, playCard, drawCard, ... } = useCardInteractions(moves, G);

/**
 * @param {object} moves  — boardgame.io moves object injected by the Client HOC
 * @param {object} G      — boardgame.io game state (G) injected by the Client HOC
 * @returns {object}      — named handler functions
 */
export function useCardInteractions(moves, G) {
  return {
    /** Mark a card in the local player's hand as selected. */
    selectCard: (playerID, cardIndex) => moves.select_card?.(playerID, cardIndex),

    /** Remove a card from the local player's selection. */
    deselectCard: (playerID, cardIndex) => moves.deselect_card?.(playerID, cardIndex),

    /** Play a card from hand to the play area (core game-state mutation). */
    playCard: (playerID, cardIndex) => moves.play_card?.(playerID, cardIndex),

    /** Discard a card from hand to the discard pile. */
    discardCard: (playerID, cardIndex) => moves.discard_card?.(playerID, cardIndex),

    /** Draw one or more cards from the top of the deck. */
    drawCard: (playerID, count = 1) => moves.draw_card?.(playerID, count),

    /** Sort the local player's hand by a given card attribute. */
    sortHand: (playerID, sortKey = 'rank') => moves.sort_hand?.(playerID, sortKey),

    /** Flip a card face-up so all players can see it. */
    revealCard: (playerID, cardIndex) => moves.reveal_card?.(playerID, cardIndex),

    /** Shuffle the discard pile back into the deck and reset it. */
    shuffleReset: () => moves.shuffle_reset?.(),

    /** Return a dragged card from the play area back to hand. */
    snapCardBack: (playerID, cardIndex) => moves.snap_card_back?.(playerID, cardIndex),

    /** Record a secret peek at another player's card. */
    peekCard: (peekerID, ownerID, cardIndex) => moves.peek_card?.(peekerID, ownerID, cardIndex),

    /** Cut the deck at the given position. */
    cutDeck: (cutPosition) => moves.cut_deck?.(cutPosition),

    /** Remove the top card of the deck face-down to the burn pile. */
    burnCard: () => moves.burn_card?.(),

    /** Toggle the held/not-held visual marker on a card. */
    markCardHeld: (playerID, cardIndex, held = true) => moves.mark_card_held?.(playerID, cardIndex, held),
  };
}
