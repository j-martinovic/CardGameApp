export const GoFishBoardConfig = {
  gameName: 'Go Fish',
  layout: 'hand-focused',
  theme: 'retro-poker',

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
    chat: { enabled: true },
    action: { enabled: true },
  },

  actions: [
    {
      label: 'Ask for Card',
      handler: 'playCard',
      phase: 'any',
      argsFrom: (selection) => [selection.target, selection.rank],
      disabledWhen: (selection, G, ctx, playerID) =>
        ctx?.currentPlayer !== playerID || !selection.target || !selection.rank,
      resetSelection: true,
    },
    {
      label: 'Pass Turn',
      handler: 'endTurn',
      phase: 'any',
      argsFrom: () => [],
      disabledWhen: (selection, G, ctx, playerID) => ctx?.currentPlayer !== playerID,
    },
    {
      label: 'Sort Hand',
      handler: 'sortHand',
      phase: 'any',
      argsFrom: (selection, G, playerID) => [playerID, 'rank'],
    },
    {
      label: 'Declare Win',
      handler: 'declareWin',
      phase: 'any',
      argsFrom: (selection, G, playerID) => [playerID],
    },
  ],

  // Map abstract handler names to the actual boardgame.io moves for this game.
  moveOverrides: {
    playCard: (moves, G, targetPlayerID, rank) => moves.askForCards?.(targetPlayerID, rank),
    endTurn: (moves) => moves.passTurn?.(),
    sortHand: (moves) => moves.sort_hand?.(),
    declareWin: (moves) => moves.declare_win?.(),
  },

  timer: { enabled: false },
};
