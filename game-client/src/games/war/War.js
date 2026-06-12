// War.js — boardgame.io game definition for the card game War.
// Single-player: player vs bot. The bot has no strategy — War is deterministic.
// The bot's card draw is resolved inside the player's playCard move so the
// entire round (including chained war sequences) completes atomically on the server.
//
// G shape: see setup() below.
// Phases: 'playing' (normal round), 'war' (tie-breaker, same move, different label).

import { INVALID_MOVE } from 'boardgame.io/dist/cjs/core.js';

// ── Deck helpers ──────────────────────────────────────────────────────────────

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
  // Use boardgame.io's seeded random for determinism in replay/spectator mode.
  // ctx.random.Shuffle is available in setup() and moves.
  if (ctx && ctx.random && ctx.random.Shuffle) {
    return ctx.random.Shuffle(deck);
  }
  // Fallback Fisher-Yates for environments without seeded random.
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ── Round resolution (pure function — no G mutation) ─────────────────────────

// Takes mutable copies of the two decks, resolves the full round including
// any chained war sequences. Returns a result object; caller applies to G.
//
// warSequences format: array of { playerDown, botDown, playerUp, botUp }
// Each entry is one war event (a tie that triggered cards drawn face-down).
function resolveRound(playerDeck, botDeck) {
  const pot = [];
  const warSequences = [];

  // Both players reveal their top card.
  const playerCard = playerDeck.shift();
  const botCard = botDeck.shift();
  pot.push(playerCard, botCard);

  let currentPlayer = playerCard;
  let currentBot = botCard;

  // Resolve chained war sequences (a war can produce another tie).
  while (currentPlayer.value === currentBot.value) {
    // Need at least 4 cards to continue a war (3 face-down + 1 face-up).
    if (playerDeck.length < 4 && botDeck.length < 4) {
      // Both too low — draw
      return { playerCard, botCard, warSequences, winner: 'draw', pot };
    }
    if (playerDeck.length < 4) {
      return { playerCard, botCard, warSequences, winner: 'bot', pot };
    }
    if (botDeck.length < 4) {
      return { playerCard, botCard, warSequences, winner: 'player', pot };
    }

    // 3 face-down cards from each side go to pot.
    const playerDown = [playerDeck.shift(), playerDeck.shift(), playerDeck.shift()];
    const botDown = [botDeck.shift(), botDeck.shift(), botDeck.shift()];
    pot.push(...playerDown, ...botDown);

    // 1 face-up card from each side.
    currentPlayer = playerDeck.shift();
    currentBot = botDeck.shift();
    pot.push(currentPlayer, currentBot);

    warSequences.push({
      playerDown,
      botDown,
      playerUp: currentPlayer,
      botUp: currentBot,
    });
  }

  const winner = currentPlayer.value > currentBot.value ? 'player' : 'bot';
  return { playerCard, botCard, warSequences, winner, pot };
}

// ── Game definition ───────────────────────────────────────────────────────────

export const WarGame = {
  name: 'war',
  minPlayers: 1,
  maxPlayers: 1,

  setup: (ctx) => {
    const deck = buildShuffledDeck(ctx);
    return {
      playerDeck: deck.slice(0, 26),   // player's 26 cards
      botDeck: deck.slice(26),          // bot's 26 cards
      lastPlayerCard: null,             // card shown in player's play area
      lastBotCard: null,                // card shown in bot's play area
      warSequences: [],                 // war events for the board to animate
      roundResult: null,                // 'player' | 'bot' | 'draw' | null
      roundCount: 0,
      log: [],                          // human-readable round history
    };
  },

  moves: {
    // The only move in War: player flips their top card.
    // The bot responds immediately and the round resolves fully here.
    playCard: {
      move: (G, ctx) => {
        if (G.playerDeck.length === 0 || G.botDeck.length === 0) {
          return INVALID_MOVE;
        }

        // Work on copies — Immer will reconcile mutations to G.
        const playerDeckCopy = [...G.playerDeck];
        const botDeckCopy = [...G.botDeck];

        const { playerCard, botCard, warSequences, winner, pot } =
          resolveRound(playerDeckCopy, botDeckCopy);

        // Award pot to winner, shuffled to the bottom of their deck.
        const shuffledPot = [...pot].sort(() => Math.random() - 0.5);
        if (winner === 'player') {
          playerDeckCopy.push(...shuffledPot);
        } else if (winner === 'bot') {
          botDeckCopy.push(...shuffledPot);
        } else {
          // Draw: split the pot
          const half = Math.floor(shuffledPot.length / 2);
          playerDeckCopy.push(...shuffledPot.slice(0, half));
          botDeckCopy.push(...shuffledPot.slice(half));
        }

        // Apply all changes to G (Immer tracks these as mutations).
        G.playerDeck = playerDeckCopy;
        G.botDeck = botDeckCopy;
        G.lastPlayerCard = playerCard;
        G.lastBotCard = botCard;
        G.warSequences = warSequences;
        G.roundResult = winner;
        G.roundCount += 1;
        G.log.push(
          `R${G.roundCount}: ${playerCard.rank}${playerCard.suit} vs ${botCard.rank}${botCard.suit}` +
          ` — ${winner}` +
          (warSequences.length > 0 ? ` (WAR x${warSequences.length})` : '')
        );
      },
      // Clients other than playerID '0' cannot trigger this move.
      client: false,
    },
  },

  // Game ends when one deck is empty or after 1000 rounds (safety draw).
  endIf: (G) => {
    if (G.playerDeck.length === 0 && G.botDeck.length === 0) return { winner: 'draw' };
    if (G.playerDeck.length === 0) return { winner: 'bot' };
    if (G.botDeck.length === 0) return { winner: 'player' };
    if (G.roundCount >= 1000) return { winner: 'draw' };
  },

  turn: {
    // One move per turn; endTurn fires automatically after the move.
    moveLimit: 1,
  },
};
