// GoFishBoardConfig.js — GenericBoard config for Go Fish.
//
// G shape: {
//   drawPile[],
//   players: { [id]: { hand[], books[{rank, cards[]}], score } },
//   currentAsk, lastAction, actionLog[], roundCount
// }
//
// Interaction model (no buttons except End Turn):
//   1. Player selects a card from their hand (tap) → selectedCardId holds the rank
//   2. Player taps an opponent's hand zone → askForCards({ targetPlayerID, rank }) fires
//   3. If "Go Fish", ocean draw happens automatically inside the move
//   4. "End Turn" HUD button calls passTurn() when the player wants to pass

// ── G transformer ─────────────────────────────────────────────────────────────
// ZoneLayout resolves zone data via G[zone.id]. Go Fish nests data inside
// G.players[id].hand / .books, so we flatten it here.  Card IDs use the format
// "gf-{ownerId}-{rank}-{suit}" so the ask moveOverride can re-derive rank from
// selectedCardId without needing a reverse-lookup into G.
function transformG(G, ctx, playerID) {
  if (!G?.players) return G;
  const flat = { ...G };
  Object.entries(G.players).forEach(([id, p]) => {
    flat[`hand-${id}`] = (p.hand || []).map((c) => ({
      ...c,
      id: `gf-${id}-${c.rank}-${c.suit}`,
    }));
    // books-{id}: flatten each book's 4 cards into a displayable pile
    flat[`books-${id}`] = (p.books || []).flatMap((b, bi) =>
      (b.cards || []).map((c, ci) => ({ ...c, id: `bk-${id}-${bi}-${ci}` }))
    );
  });
  return flat;
}

// ── Interactive zone layout ────────────────────────────────────────────────────
function buildGoFishZones(ctx, playerID) {
  const numPlayers = ctx?.numPlayers ?? 2;
  const localID = String(playerID ?? '0');

  // One face-down Hand per opponent, marked isTargetZone so ZoneLayout wraps it
  // with a click handler that fires handleZoneClick({ zoneType: 'opponent-hand' }).
  const top = [];
  for (let i = 0; i < numPlayers; i++) {
    if (String(i) !== localID) {
      top.push({
        id:          `hand-${i}`,
        type:        'Hand',
        owner:       String(i),
        faceUp:      false,
        label:       `Player ${i}`,
        isTargetZone: true,
      });
    }
  }

  // Books display — one Pile per player (face-up, not a drop target)
  const bookPiles = [];
  for (let i = 0; i < numPlayers; i++) {
    bookPiles.push({
      id:          `books-${i}`,
      type:        'Pile',
      owner:       String(i),
      faceUp:      true,
      isDropTarget: false,
      label:       `P${i} Books`,
    });
  }

  const center = [
    { id: 'drawPile', type: 'DrawPile', label: 'Ocean', disabled: true },
    ...bookPiles,
  ];

  const bottom = [
    { id: `hand-${localID}`, type: 'Hand', owner: localID, faceUp: true, label: 'Your Hand' },
  ];

  const all = [...top, ...center, ...bottom];
  return { top, center, bottom, all };
}

export const GoFishBoardConfig = {
  gameName: 'Go Fish',
  layout: 'hand-focused',
  theme: 'retro-poker',

  // Flatten G.players[id].* into top-level G['hand-id'] / G['books-id'] keys.
  transformG,

  interactiveZones: buildGoFishZones,

  // hand→opponent-hand: tap own card to select rank, tap opponent hand zone to ask.
  // deck→hand is not wired (ocean draw is automatic inside askForCards).
  moveMap: {
    'hand→opponent-hand': 'askForCards',
  },

  moveOverrides: {
    // selectedCardId format: "gf-{ownerId}-{rank}-{suit}" (set by transformG above).
    // targetZoneId format:   "hand-{opponentId}".
    askForCards: (moves, G, localPlayerID, cardId, sourceZoneId, targetZoneId) => {
      const targetPlayerID = targetZoneId?.replace('hand-', '');
      // Split "gf-0-A-♠" → ["gf","0","A","♠"] — rank is always at index 2
      const rank = cardId?.split('-')?.[2];
      if (!rank || !targetPlayerID || targetPlayerID === localPlayerID) return;
      return moves.askForCards?.({ targetPlayerID, rank });
    },
    // "End Turn" HUD button → passTurn move
    endTurn: (moves) => moves.passTurn?.(),
  },

  // Player must explicitly pass their turn.
  endTurnEnabled: true,

  // Legacy zone config kept for sandbox/preview compatibility.
  zones: {
    opponentHand: {
      enabled: true,
      layout: 'fan',
      playersField: 'players',
      handField: 'hand',
      booksField: 'books',
    },
    playerHand: {
      enabled: true,
      layout: 'fan',
      sortable: true,
      playersField: 'players',
      handField: 'hand',
      booksField: 'books',
    },
    centerPlay: {
      enabled: true,
      style: 'request',
      currentAskField: 'currentAsk',
      actionLogField: 'actionLog',
    },
    discardPile: { enabled: false },
    drawPile: {
      enabled: true,
      drawable: false,
      pileField: 'drawPile',
      label: 'Ocean',
    },
    score: {
      enabled: true,
      label: 'Books',
      dataSource: 'players',
      playersField: 'players',
      booksField: 'books',
    },
    chat:   { enabled: true },
    action: { enabled: true },
  },

  // No action buttons — ask is handled by hand→opponent-hand click sequence.
  actions: [],

  timer: { enabled: false },
};
