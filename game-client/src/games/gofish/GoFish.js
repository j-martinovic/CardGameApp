// GoFish.js — boardgame.io game definition for Go Fish.
// 2–6 players. Standard 52-card deck.
// Players take turns asking others for ranks they hold.
// Collect sets of 4 (books). Most books wins.

import { INVALID_MOVE } from 'boardgame.io/dist/cjs/core.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = Object.fromEntries(RANKS.map((r, i) => [r, i + 2]));

function buildShuffledDeck(ctx) {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, value: RANK_VALUES[rank] });
    }
  }
  if (ctx?.random?.Shuffle) return ctx.random.Shuffle(deck);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function checkAndLayBooks(playerState) {
  const rankGroups = {};
  for (const card of playerState.hand) {
    if (!rankGroups[card.rank]) rankGroups[card.rank] = [];
    rankGroups[card.rank].push(card);
  }
  const newBooks = [];
  const remainingHand = [];
  for (const card of playerState.hand) {
    if (rankGroups[card.rank] && rankGroups[card.rank].length === 4) {
      if (!newBooks.find(b => b.rank === card.rank)) {
        newBooks.push({ rank: card.rank, cards: rankGroups[card.rank] });
      }
    } else {
      remainingHand.push(card);
    }
  }
  if (newBooks.length > 0) {
    playerState.books = [...playerState.books, ...newBooks];
    playerState.hand = remainingHand;
  }
  return newBooks;
}

function totalBooks(G) {
  return Object.values(G.players).reduce((sum, p) => sum + p.books.length, 0);
}

function allHandsEmpty(G) {
  return Object.values(G.players).every(p => p.hand.length === 0);
}

export const GoFishGame = {
  name: 'go_fish',
  minPlayers: 2,
  maxPlayers: 6,

  setup: ({ ctx }) => {
    const deck = buildShuffledDeck(ctx);
    const numPlayers = ctx.numPlayers;
    const cardsEach = numPlayers === 2 ? 7 : 5;

    const players = {};
    let deckPos = 0;
    for (let i = 0; i < numPlayers; i++) {
      players[String(i)] = {
        hand: deck.slice(deckPos, deckPos + cardsEach),
        books: [],
        score: 0,
      };
      deckPos += cardsEach;
    }

    // Check for immediate books from the dealt hand
    for (const p of Object.values(players)) {
      checkAndLayBooks(p);
    }

    return {
      drawPile: deck.slice(deckPos),
      players,
      currentAsk: null,
      lastAction: null,
      actionLog: [],
      roundCount: 0,
    };
  },

  moves: {
    askForCards: {
      move: (G, ctx, { targetPlayerID, rank }) => {
        const askerID = ctx.currentPlayer;
        const asker = G.players[askerID];
        const target = G.players[String(targetPlayerID)];

        if (!target) return INVALID_MOVE;
        if (String(targetPlayerID) === askerID) return INVALID_MOVE;

        // Must hold at least one of the asked rank
        if (!asker.hand.some(c => c.rank === rank)) return INVALID_MOVE;

        const askedCards = target.hand.filter(c => c.rank === rank);

        if (askedCards.length > 0) {
          // Transfer all cards of that rank
          target.hand = target.hand.filter(c => c.rank !== rank);
          asker.hand = [...asker.hand, ...askedCards];

          const newBooks = checkAndLayBooks(asker);
          const bookMsg = newBooks.length > 0 ? ` Laid ${newBooks.map(b => b.rank).join(', ')}!` : '';
          const msg = `P${askerID} asked P${targetPlayerID} for ${rank}s — got ${askedCards.length}!${bookMsg}`;
          G.actionLog = [msg, ...G.actionLog].slice(0, 20);
          G.lastAction = msg;
          G.currentAsk = { askerID, targetPlayerID: String(targetPlayerID), rank, result: 'success' };

          // Refill hand if empty and ocean has cards
          if (target.hand.length === 0 && G.drawPile.length > 0) {
            const refillCount = Math.min(5, G.drawPile.length);
            target.hand = G.drawPile.splice(0, refillCount);
          }

          // Asker goes again (don't end turn automatically — they ask again or pass)
          return;
        }

        // Go Fish — draw 1 card
        G.currentAsk = { askerID, targetPlayerID: String(targetPlayerID), rank, result: 'go_fish' };
        const msg = `P${askerID} asked P${targetPlayerID} for ${rank}s — Go Fish!`;
        G.actionLog = [msg, ...G.actionLog].slice(0, 20);
        G.lastAction = msg;

        if (G.drawPile.length > 0) {
          const drawn = G.drawPile.shift();
          asker.hand.push(drawn);
          const newBooks = checkAndLayBooks(asker);
          if (drawn.rank === rank) {
            const bookMsg = newBooks.length > 0 ? ' — book laid!' : '';
            G.currentAsk.drawnCard = drawn;
            G.currentAsk.drawnMatchesAsk = true;
            G.lastAction += ` Drew ${drawn.rank}${drawn.suit} — matched!${bookMsg}`;
            // Asker keeps the turn (they drew what they asked for)
            return;
          } else {
            G.currentAsk.drawnCard = drawn;
            G.currentAsk.drawnMatchesAsk = false;
            G.lastAction += ` Drew ${drawn.rank}${drawn.suit}.`;
          }
        }

        // Turn ends — no match on draw or ocean empty
        // ctx.events.endTurn();
        return { endTurn: true};
      },
      client: false,
    },

    passTurn: {
      move: ( G, ctx ) => {
        // ctx.events.endTurn();
        return { endTurn: true };
      },
      client: false,
    },
  },

  turn: {
    moveLimit: undefined,
    onBegin: ({ G, ctx }) => {
      const player = G.players[ctx.currentPlayer];
      // If hand empty and ocean not empty, draw 5
      if (player.hand.length === 0 && G.drawPile.length > 0) {
        const refill = Math.min(5, G.drawPile.length);
        player.hand = G.drawPile.splice(0, refill);
      }
      G.currentAsk = null;
      G.roundCount += 1;
    },
    order: {
      first: () => 0,
      next: (G, ctx) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    },
  },

  endIf: ({ G, ctx }) => {
    // All 13 books claimed
    if (totalBooks(G) >= 13) {
      return _determineWinner(G, ctx);
    }
    // Ocean empty and all hands empty
    if (G.drawPile.length === 0 && allHandsEmpty(G)) {
      return _determineWinner(G, ctx);
    }
  },
};

function _determineWinner(G, ctx) {
  let maxBooks = -1;
  let winners = [];
  for (const [id, p] of Object.entries(G.players)) {
    if (p.books.length > maxBooks) {
      maxBooks = p.books.length;
      winners = [id];
    } else if (p.books.length === maxBooks) {
      winners.push(id);
    }
  }
  if (winners.length === 1) return { winner: winners[0] };
  // Tiebreak: fewest cards in hand
  let minHand = Infinity;
  let tieWinner = winners[0];
  for (const id of winners) {
    const handSize = G.players[id].hand.length;
    if (handSize < minHand) {
      minHand = handSize;
      tieWinner = id;
    }
  }
  return { winner: tieWinner };
}
