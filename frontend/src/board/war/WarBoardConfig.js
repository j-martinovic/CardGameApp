// WarBoardConfig.js — GenericBoard config for War.
// War is single-player-vs-bot with one move: playCard (click your deck).
// moveLimit: 1 in War.js means turns auto-advance; no End Turn button is shown.
//
// G shape: { playerDeck[], botDeck[], lastPlayerCard, lastBotCard,
//            warSequences[], roundResult, roundCount, log[] }

import { BOT_DELAY_MS, RESULT_DELAY_MS, BOT_DISPLAY_NAME } from './WarAI';

// ── Interactive zone layout (drag/click board — replaces button-driven "Flip Card") ──
// Zone IDs map directly to G field names so ZoneLayout resolves data via G[zone.id].
function buildWarZones() {
  const top = [
    { id: 'botDeck',       type: 'Deck',     label: 'Bot Deck',  disabled: true },
    { id: 'lastBotCard',   type: 'CardSlot', label: 'Bot Card',  faceUp: true, disabled: true },
  ];
  const center = [];
  const bottom = [
    { id: 'lastPlayerCard', type: 'CardSlot', label: 'Your Card', faceUp: true, disabled: true },
    { id: 'playerDeck',     type: 'Deck',     label: 'Your Deck' },
  ];
  return { top, center, bottom, all: [...top, ...center, ...bottom] };
}

export const WarBoardConfig = {
  gameName: 'War',
  layout: 'versus',
  theme: 'retro-poker',

  // Clicking the player's deck calls playCard (not the default drawCard).
  // moveMap is merged with DEFAULT_MOVE_MAP by useBoardEventHandlers.
  moveMap: {
    'deck→hand': 'playCard',
  },

  moveOverrides: {
    playCard:   (moves) => moves.playCard?.(),
    sortHand:   (moves) => moves.sort_hand?.(),
    claimTrick: (moves) => moves.playCard?.(),
  },

  // War auto-advances turns after playCard (moveLimit: 1) — hide End Turn button.
  endTurnEnabled: false,

  // The interactive layout: bot area on top, player area on bottom.
  interactiveZones: buildWarZones,

  // Legacy zone config retained so the sandbox zone-toggle dev tool still has
  // something to render (renderInteractive=false path in raw sandboxMode).
  zones: {
    opponentHand: {
      enabled: true,
      layout: 'stacked',
      opponentName: BOT_DISPLAY_NAME,
      deckField: 'botDeck',
      playedCardField: 'lastBotCard',
      roundResultField: 'roundResult',
      roundCountField: 'roundCount',
      flipPreDelayMs: BOT_DELAY_MS,
      flipDelayMs: 80,
    },
    playerHand: {
      enabled: true,
      layout: 'stacked',
      sortable: false,
      deckField: 'playerDeck',
      playedCardField: 'lastPlayerCard',
      roundResultField: 'roundResult',
      roundCountField: 'roundCount',
      flipDelayMs: 80,
      flipPreDelayMs: 0,
      deckClickAction: {
        handler: 'playCard',
        lockMs: RESULT_DELAY_MS,
        argsFrom: () => [],
        disabledWhen: (selection, G) => !G?.playerDeck?.length,
      },
    },
    centerPlay: {
      enabled: true,
      style: 'versus',
      roundResultField: 'roundResult',
      roundCountField: 'roundCount',
      warField: 'warSequences',
    },
    discardPile: { enabled: false },
    drawPile:    { enabled: false },
    score: {
      enabled: true,
      label: 'Cards Won',
      dataSource: 'decks',
      playerDeckField: 'playerDeck',
      opponentDeckField: 'botDeck',
      playerLabel: 'Your Cards',
      opponentLabel: 'House Cards',
    },
    chat:   { enabled: true },
    action: { enabled: true },
  },

  // No action buttons — the only interaction is clicking the player's deck.
  actions: [],

  timer: { enabled: false },
};
