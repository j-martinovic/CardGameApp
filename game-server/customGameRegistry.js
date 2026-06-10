// customGameRegistry.js — dynamically registers custom games with the running boardgame.io server.
// Since boardgame.io requires games to be known at startup, we use a "template" approach:
// Register a generic 'custom' placeholder at startup, and pass rules via setupData.

import { buildCustomGame } from '../game-client/src/playground/CustomGameEngine.js';

// Generic custom game wrapper — rules are passed via setupData.rules at match creation time.
// All moves delegate to buildCustomGame(G.rules) so the rules embedded in G drive all behavior.
export const CustomGameTemplate = {
  name: 'custom',
  minPlayers: 1,
  maxPlayers: 8,

  setup: (ctx, setupData) => {
    if (!setupData?.rules) {
      throw new Error('CustomGameTemplate requires setupData.rules');
    }
    return buildCustomGame(setupData.rules).setup(ctx);
  },

  moves: {
    drawCard: { move: (G, ctx, fromSource) => buildCustomGame(G.rules).moves.drawCard.move(G, ctx, fromSource) },
    discardCard: { move: (G, ctx, cardIndex, toPile) => buildCustomGame(G.rules).moves.discardCard.move(G, ctx, cardIndex, toPile) },
    playCard: { move: (G, ctx, cardIndex, targetPileId) => buildCustomGame(G.rules).moves.playCard.move(G, ctx, cardIndex, targetPileId) },
    askForCard: { move: (G, ctx, targetPlayerID, rank) => buildCustomGame(G.rules).moves.askForCard.move(G, ctx, targetPlayerID, rank) },
    respondToAsk: { move: (G, ctx, hasCard) => buildCustomGame(G.rules).moves.respondToAsk.move(G, ctx, hasCard) },
    rollDice: { move: (G, ctx) => buildCustomGame(G.rules).moves.rollDice.move(G, ctx) },
    placeBet: { move: (G, ctx, amount) => buildCustomGame(G.rules).moves.placeBet.move(G, ctx, amount) },
    pickUpDiscardPile: { move: (G, ctx) => buildCustomGame(G.rules).moves.pickUpDiscardPile.move(G, ctx) },
    declareSet: { move: (G, ctx, cardIndices) => buildCustomGame(G.rules).moves.declareSet.move(G, ctx, cardIndices) },
    passTurn: { move: (G, ctx) => buildCustomGame(G.rules).moves.passTurn.move(G, ctx) },
    chooseWild: { move: (G, ctx, suit, rank) => buildCustomGame(G.rules).moves.chooseWild.move(G, ctx, suit, rank) },
  },

  endIf: (G, ctx) => buildCustomGame(G.rules).endIf(G, ctx),

  turn: {
    onBegin: (G, ctx) => buildCustomGame(G.rules).turn?.onBegin?.(G, ctx),
    onEnd: (G, ctx) => buildCustomGame(G.rules).turn?.onEnd?.(G, ctx),
  },
};
