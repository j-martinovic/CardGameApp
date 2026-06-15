import { BOT_DELAY_MS, RESULT_DELAY_MS, BOT_DISPLAY_NAME } from './WarAI';

export const WarBoardConfig = {
  gameName: 'War',
  layout: 'versus',
  theme: 'retro-poker',

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
    drawPile: { enabled: false },
    score: {
      enabled: true,
      label: 'Cards Won',
      dataSource: 'decks',
      playerDeckField: 'playerDeck',
      opponentDeckField: 'botDeck',
      playerLabel: 'Your Cards',
      opponentLabel: 'House Cards',
    },
    chat: { enabled: true },
    action: { enabled: true },
  },

  actions: [
    {
      label: 'Flip Card',
      handler: 'playCard',
      phase: 'any',
      lockMs: RESULT_DELAY_MS,
      argsFrom: () => [],
      disabledWhen: (selection, G) => !G?.playerDeck?.length,
    },
    {
      label: 'Sort Hand',
      handler: 'sortHand',
      phase: 'any',
      argsFrom: (selection, G, playerID) => [playerID, 'rank'],
    },
  ],

  // Map abstract handler names to the actual boardgame.io moves for this game.
  moveOverrides: {
    playCard: (moves) => moves.playCard?.(),
    sortHand: (moves) => moves.sort_hand?.(),
    claimTrick: (moves) => moves.playCard?.(),
  },

  timer: { enabled: false },
};
