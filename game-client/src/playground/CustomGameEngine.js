// CustomGameEngine.js — generates a boardgame.io Game from a rules config object.
// Called at runtime to create playable boardgame.io games from user-defined rules.

import { INVALID_MOVE } from 'boardgame.io/dist/cjs/core.js';

const STD_SUITS = ['♠', '♥', '♦', '♣'];
const STD_RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const STD_VALUES = Object.fromEntries(STD_RANKS.map((r, i) => [r, i + 2]));

// ── Deck helpers ──────────────────────────────────────────────────────────────

export function buildDeck(rules, ctx) {
  let deck = [];

  const jokerCard = (n) => ({ rank: 'Joker', suit: 'none', value: 0, isJoker: true, jokerN: n });

  switch (rules.deckType) {
    case 'standard_52_jokers': {
      for (const suit of STD_SUITS)
        for (const rank of STD_RANKS)
          deck.push({ rank, suit, value: STD_VALUES[rank] });
      deck.push(jokerCard(1), jokerCard(2));
      break;
    }
    case 'double_deck': {
      for (let copy = 0; copy < 2; copy++)
        for (const suit of STD_SUITS)
          for (const rank of STD_RANKS)
            deck.push({ rank, suit, value: STD_VALUES[rank], copy });
      break;
    }
    case 'custom': {
      const cfg = rules.customDeckConfig || {};
      const suits = cfg.suits || STD_SUITS;
      const ranks = cfg.ranks || STD_RANKS;
      const rankValues = cfg.rankValues || {};
      for (const suit of suits)
        for (const rank of ranks)
          deck.push({ rank, suit, value: rankValues[rank] ?? STD_VALUES[rank] ?? 0 });
      if (cfg.includeJokers) {
        for (let j = 0; j < (cfg.jokerCount ?? 2); j++) deck.push(jokerCard(j + 1));
      }
      break;
    }
    default: {
      // standard_52 + tarot both fall back to standard 52
      for (const suit of STD_SUITS)
        for (const rank of STD_RANKS)
          deck.push({ rank, suit, value: STD_VALUES[rank] });
    }
  }

  if (ctx?.random?.Shuffle) return ctx.random.Shuffle(deck);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ── Special card effects ──────────────────────────────────────────────────────

export function applySpecialCardEffect(G, ctx, card, playingPlayerID) {
  const { specialCards = [] } = G.rules;
  const spec = specialCards.find(
    s => s.rank === card.rank && (s.suit === 'any' || s.suit === card.suit)
  );
  if (!spec || spec.effect === 'none') return { effectApplied: false, effectName: null };

  const numPlayers = ctx.numPlayers;
  const currentIdx = parseInt(playingPlayerID, 10);
  const nextIdx = (currentIdx + 1) % numPlayers;
  const nextPlayer = G.players[String(nextIdx)];

  switch (spec.effect) {
    case 'skip_next_player':
      G.lastSpecialEffect = 'skip';
      ctx.events?.endTurn?.({ next: String((nextIdx + 1) % numPlayers) });
      break;
    case 'reverse_turn_order':
      G.turnDirection = -G.turnDirection;
      G.lastSpecialEffect = 'reverse';
      break;
    case 'draw_2_next_player':
      for (let i = 0; i < 2 && G.drawPile.length > 0; i++)
        nextPlayer.hand.push(G.drawPile.shift());
      G.lastSpecialEffect = 'draw_2';
      break;
    case 'draw_4_next_player':
      for (let i = 0; i < 4 && G.drawPile.length > 0; i++)
        nextPlayer.hand.push(G.drawPile.shift());
      G.lastSpecialEffect = 'draw_4';
      break;
    case 'wild_choose_suit':
      G.lastSpecialEffect = 'wild_suit';
      G.wildChosenSuit = null;
      break;
    case 'wild_choose_rank':
      G.lastSpecialEffect = 'wild_rank';
      G.wildChosenRank = null;
      break;
    case 'play_again':
      G.lastSpecialEffect = 'play_again';
      break;
    case 'swap_hands': {
      const others = Object.keys(G.players).filter(id => id !== playingPlayerID);
      if (others.length > 0) {
        const targetID = others[Math.floor(Math.random() * others.length)];
        const tmp = G.players[playingPlayerID].hand;
        G.players[playingPlayerID].hand = G.players[targetID].hand;
        G.players[targetID].hand = tmp;
        G.lastSpecialEffect = 'swap_hands';
      }
      break;
    }
    case 'draw_to_5': {
      const p = G.players[playingPlayerID];
      while (p.hand.length < 5 && G.drawPile.length > 0) p.hand.push(G.drawPile.shift());
      G.lastSpecialEffect = 'draw_to_5';
      break;
    }
    default:
      G.lastSpecialEffect = spec.effect;
  }

  return { effectApplied: true, effectName: spec.effect };
}

// ── Win condition check ───────────────────────────────────────────────────────

export function checkWinCondition(G, ctx) {
  const { winCondition, targetScore, maxRounds, targetSets } = G.rules;
  const playerIDs = Object.keys(G.players);

  if (maxRounds > 0 && G.roundCount >= maxRounds) {
    return _scoreBasedWinner(G, playerIDs, winCondition);
  }

  switch (winCondition) {
    case 'empty_hand': {
      for (const id of playerIDs) {
        if (G.players[id].hand.length === 0) return { winner: id };
      }
      break;
    }
    case 'most_cards':
    case 'fewest_cards': {
      if (G.drawPile.length === 0 && playerIDs.every(id => G.players[id].hand.length === 0)) {
        return _scoreBasedWinner(G, playerIDs, winCondition);
      }
      break;
    }
    case 'target_score': {
      for (const id of playerIDs) {
        if (G.players[id].score >= (targetScore || 100)) return { winner: id };
      }
      break;
    }
    case 'lowest_score':
    case 'highest_score': {
      if (maxRounds > 0 && G.roundCount >= maxRounds) {
        return _scoreBasedWinner(G, playerIDs, winCondition);
      }
      break;
    }
    case 'most_tricks': {
      const total = playerIDs.reduce((s, id) => s + G.players[id].tricksWon, 0);
      const expected = Math.floor(52 / ctx.numPlayers);
      if (total >= expected * ctx.numPlayers) return _scoreBasedWinner(G, playerIDs, 'most_tricks');
      break;
    }
    case 'fewest_tricks': {
      const total2 = playerIDs.reduce((s, id) => s + G.players[id].tricksWon, 0);
      const expected2 = Math.floor(52 / ctx.numPlayers);
      if (total2 >= expected2 * ctx.numPlayers) return _scoreBasedWinner(G, playerIDs, 'fewest_tricks');
      break;
    }
    case 'collect_sets': {
      for (const id of playerIDs) {
        if (G.players[id].sets.length >= (targetSets || 4)) return { winner: id };
      }
      break;
    }
    default:
      break;
  }

  return { winner: null };
}

function _scoreBasedWinner(G, playerIDs, winCondition) {
  let best = null;
  let bestID = null;
  for (const id of playerIDs) {
    const p = G.players[id];
    let val;
    switch (winCondition) {
      case 'most_cards': val = p.hand.length; break;
      case 'fewest_cards': val = -p.hand.length; break;
      case 'highest_score': val = p.score; break;
      case 'lowest_score': val = -p.score; break;
      case 'most_tricks': val = p.tricksWon; break;
      case 'fewest_tricks': val = -p.tricksWon; break;
      default: val = p.score;
    }
    if (best === null || val > best) { best = val; bestID = id; }
  }
  return { winner: bestID };
}

// ── Initial G builder ─────────────────────────────────────────────────────────

export function buildInitialG(rules, ctx) {
  const numPlayers = ctx.numPlayers || rules.numPlayers || 2;
  const deck = buildDeck(rules, ctx);

  // Deal hands
  const players = {};
  let pos = 0;
  for (let i = 0; i < numPlayers; i++) {
    const dealt = deck.slice(pos, pos + (rules.cardsDealtPerPlayer || 7));
    pos += dealt.length;
    players[String(i)] = {
      hand: dealt,
      score: 0,
      chips: rules.accessories?.chips?.enabled ? (rules.accessories.chips.startingChips || 100) : 0,
      sets: [],
      tricksWon: 0,
    };
  }

  // Build table piles from initialTableLayout
  const tablePiles = [];
  if (rules.initialTableLayout?.enabled) {
    for (const pileDef of (rules.initialTableLayout.piles || [])) {
      const cards = [];
      for (let i = 0; i < (pileDef.cardCount || 0) && pos < deck.length; i++, pos++) {
        cards.push({ ...deck[pos], faceUp: i >= (pileDef.faceDownCount || 0) });
      }
      tablePiles.push({ id: pileDef.pileId, cards, acceptRule: pileDef.acceptRule || 'any' });
    }
  }

  // Community cards
  const communityCards = [];
  if (rules.accessories?.communityCards?.enabled) {
    const count = rules.accessories.communityCards.count || 3;
    const revealed = rules.accessories.communityCards.revealedAtStart || 0;
    for (let i = 0; i < count && pos < deck.length; i++, pos++) {
      communityCards.push({ ...deck[pos], faceUp: i < revealed });
    }
  }

  return {
    drawPile: deck.slice(pos),
    discardPile: [],
    players,
    tablePiles,
    communityCards,
    currentTrickCards: [],
    trickLeader: '0',
    turnDirection: 1,
    roundCount: 0,
    lastAction: null,
    lastSpecialEffect: null,
    diceValues: [],
    pot: 0,
    phase: 'playing',
    wildChosenSuit: null,
    wildChosenRank: null,
    askedPlayerID: null,
    askedRank: null,
    rules,
  };
}

// ── Move implementations ──────────────────────────────────────────────────────

function _canDraw(G, rules) { return rules.actionsPerTurn?.mayDraw || rules.actionsPerTurn?.mustDraw; }
function _canDiscard(G, rules) { return rules.actionsPerTurn?.mayDiscard || rules.actionsPerTurn?.mustDiscard; }

function moveDrawCard(G, ctx, fromSource) {
  const rules = G.rules;
  if (!_canDraw(G, rules)) return INVALID_MOVE;
  const source = fromSource || rules.actionsPerTurn?.drawFrom || 'draw_pile';
  const playerHand = G.players[ctx.currentPlayer].hand;

  if (source === 'draw_pile' || source === 'either') {
    if (G.drawPile.length === 0) return INVALID_MOVE;
    const count = rules.actionsPerTurn?.drawCount || 1;
    for (let i = 0; i < count && G.drawPile.length > 0; i++) {
      playerHand.push(G.drawPile.shift());
    }
  } else if (source === 'discard_pile') {
    if (G.discardPile.length === 0) return INVALID_MOVE;
    playerHand.push(G.discardPile.pop());
  }
  G.lastAction = `P${ctx.currentPlayer} drew a card`;
}

function moveDiscardCard(G, ctx, cardIndex, toPile) {
  const rules = G.rules;
  if (!_canDiscard(G, rules)) return INVALID_MOVE;
  const hand = G.players[ctx.currentPlayer].hand;
  if (cardIndex < 0 || cardIndex >= hand.length) return INVALID_MOVE;

  const [card] = hand.splice(cardIndex, 1);
  const dest = toPile || rules.actionsPerTurn?.discardTo || 'discard_pile';

  if (dest === 'discard_pile') {
    G.discardPile.push(card);
  } else if (dest === 'draw_pile_bottom') {
    G.drawPile.push(card);
  } else if (dest === 'draw_pile_top') {
    G.drawPile.unshift(card);
  }
  // out_of_game: card is simply removed
  G.lastAction = `P${ctx.currentPlayer} discarded ${card.rank}${card.suit}`;
}

function movePlayCard(G, ctx, cardIndex, targetPileId) {
  const rules = G.rules;
  const hand = G.players[ctx.currentPlayer].hand;
  if (cardIndex < 0 || cardIndex >= hand.length) return INVALID_MOVE;

  const card = hand[cardIndex];

  // Validate card play rule
  const playRule = rules.actionsPerTurn?.playCardRule || 'any';
  if (playRule !== 'any' && playRule !== 'any_from_hand' && G.discardPile.length > 0) {
    const topCard = G.discardPile[G.discardPile.length - 1];
    if (playRule === 'must_match_suit' && card.suit !== topCard.suit) return INVALID_MOVE;
    if (playRule === 'must_match_rank' && card.rank !== topCard.rank) return INVALID_MOVE;
    if (playRule === 'must_beat_current' && card.value <= topCard.value) return INVALID_MOVE;
    if (playRule === 'must_be_higher' && card.value <= topCard.value) return INVALID_MOVE;
  }

  hand.splice(cardIndex, 1);

  if (targetPileId) {
    const pile = G.tablePiles.find(p => p.id === targetPileId);
    if (pile) {
      pile.cards.push({ ...card, faceUp: true });
    } else {
      G.discardPile.push(card);
    }
  } else if (rules.trickTaking?.enabled) {
    G.currentTrickCards.push({ playerID: ctx.currentPlayer, card });
    if (G.currentTrickCards.length >= ctx.numPlayers) {
      _resolveTrick(G, ctx);
    }
  } else {
    G.discardPile.push(card);
  }

  applySpecialCardEffect(G, ctx, card, ctx.currentPlayer);
  G.lastAction = `P${ctx.currentPlayer} played ${card.rank}${card.suit}`;
}

function _resolveTrick(G, ctx) {
  const trick = G.rules.trickTaking;
  const leadCard = G.currentTrickCards[0];
  let winnerEntry = leadCard;

  for (const entry of G.currentTrickCards) {
    if (trick.trickWinner === 'highest_of_lead_suit') {
      if (entry.card.suit === leadCard.card.suit && entry.card.value > winnerEntry.card.value) {
        winnerEntry = entry;
      }
    } else if (trick.trickWinner === 'highest_card_any_suit') {
      if (entry.card.value > winnerEntry.card.value) winnerEntry = entry;
    } else if (trick.trickWinner === 'lowest_card') {
      if (entry.card.value < winnerEntry.card.value) winnerEntry = entry;
    } else if (trick.trickWinner === 'highest_trump_else_lead') {
      const isTrump = entry.card.suit === (trick.fixedTrumpSuit || G.wildChosenSuit);
      const winIsTrump = winnerEntry.card.suit === (trick.fixedTrumpSuit || G.wildChosenSuit);
      if (isTrump && !winIsTrump) winnerEntry = entry;
      else if (isTrump && winIsTrump && entry.card.value > winnerEntry.card.value) winnerEntry = entry;
      else if (!winIsTrump && entry.card.suit === leadCard.card.suit && entry.card.value > winnerEntry.card.value) winnerEntry = entry;
    }
  }

  G.players[winnerEntry.playerID].tricksWon += 1;
  G.players[winnerEntry.playerID].score += (trick.scoringPerTrick || 1);
  G.currentTrickCards = [];
  G.trickLeader = winnerEntry.playerID;
  G.lastAction = `P${winnerEntry.playerID} won the trick`;
}

function moveAskForCard(G, ctx, targetPlayerID, rank) {
  const rules = G.rules;
  if (!rules.actionsPerTurn?.mayAskForCard) return INVALID_MOVE;
  const asker = G.players[ctx.currentPlayer];
  const target = G.players[String(targetPlayerID)];
  if (!target) return INVALID_MOVE;

  if (rules.actionsPerTurn.askForCardRule === 'must_hold_rank') {
    if (!asker.hand.some(c => c.rank === rank)) return INVALID_MOVE;
  }

  const cards = target.hand.filter(c => c.rank === rank);
  if (cards.length > 0) {
    target.hand = target.hand.filter(c => c.rank !== rank);
    asker.hand = [...asker.hand, ...cards];
    G.lastAction = `P${ctx.currentPlayer} got ${cards.length} ${rank}(s) from P${targetPlayerID}`;
  } else {
    G.askedPlayerID = String(targetPlayerID);
    G.askedRank = rank;
    G.lastAction = `P${ctx.currentPlayer} asked P${targetPlayerID} for ${rank}s — Go Fish!`;
  }
}

function moveRespondToAsk(G, ctx, hasCard) {
  if (hasCard) {
    const rank = G.askedRank;
    const askerID = ctx.currentPlayer;
    const responderID = G.askedPlayerID;
    if (!responderID) return INVALID_MOVE;
    const cards = G.players[responderID].hand.filter(c => c.rank === rank);
    G.players[responderID].hand = G.players[responderID].hand.filter(c => c.rank !== rank);
    G.players[askerID].hand = [...G.players[askerID].hand, ...cards];
    G.lastAction = `P${askerID} received ${cards.length} ${rank}(s)`;
  }
  G.askedPlayerID = null;
  G.askedRank = null;
}

function moveRollDice(G, ctx) {
  const dice = G.rules.accessories?.dice;
  if (!dice?.enabled) return INVALID_MOVE;
  const count = dice.count || 1;
  const sides = dice.sides || 6;
  G.diceValues = Array.from({ length: count }, () =>
    ctx?.random?.Die ? ctx.random.Die(sides) : Math.floor(Math.random() * sides) + 1
  );
  G.lastAction = `P${ctx.currentPlayer} rolled: ${G.diceValues.join(', ')}`;
}

function movePlaceBet(G, ctx, amount) {
  if (!G.rules.accessories?.chips?.enabled) return INVALID_MOVE;
  const player = G.players[ctx.currentPlayer];
  const bet = Math.min(amount, player.chips);
  player.chips -= bet;
  G.pot += bet;
  G.lastAction = `P${ctx.currentPlayer} bet ${bet}`;
}

function movePickUpDiscardPile(G, ctx) {
  if (!G.rules.actionsPerTurn?.mayPickUpDiscardPile) return INVALID_MOVE;
  G.players[ctx.currentPlayer].hand = [...G.players[ctx.currentPlayer].hand, ...G.discardPile];
  G.discardPile = [];
  G.lastAction = `P${ctx.currentPlayer} picked up the discard pile`;
}

function moveDeclareSet(G, ctx, cardIndices) {
  const setSize = G.rules.setSize || 4;
  if (!Array.isArray(cardIndices) || cardIndices.length !== setSize) return INVALID_MOVE;
  const hand = G.players[ctx.currentPlayer].hand;
  const cards = cardIndices.map(i => hand[i]).filter(Boolean);
  if (cards.length !== setSize) return INVALID_MOVE;
  const rank = cards[0].rank;
  if (!cards.every(c => c.rank === rank)) return INVALID_MOVE;

  // Remove cards from hand (highest indices first to preserve positions)
  const sorted = [...cardIndices].sort((a, b) => b - a);
  for (const i of sorted) hand.splice(i, 1);
  G.players[ctx.currentPlayer].sets.push({ rank, cards });
  G.players[ctx.currentPlayer].score += setSize;
  G.lastAction = `P${ctx.currentPlayer} declared a set of ${rank}s`;
}

function movePassTurn(G, ctx) {
  ctx.events.endTurn();
}

function moveChooseWild(G, ctx, suit, rank) {
  if (suit) G.wildChosenSuit = suit;
  if (rank) G.wildChosenRank = rank;
  G.lastSpecialEffect = null;
  G.lastAction = `P${ctx.currentPlayer} chose ${suit || rank}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildCustomGame(rules) {
  return {
    name: `custom_${rules.gameId || 'game'}`,
    minPlayers: rules.numPlayers || 2,
    maxPlayers: rules.numPlayers || 2,

    setup: (ctx) => buildInitialG(rules, ctx),

    moves: {
      drawCard: { move: moveDrawCard },
      discardCard: { move: moveDiscardCard },
      playCard: { move: movePlayCard },
      askForCard: { move: moveAskForCard },
      respondToAsk: { move: moveRespondToAsk },
      rollDice: { move: moveRollDice },
      placeBet: { move: movePlaceBet },
      pickUpDiscardPile: { move: movePickUpDiscardPile },
      declareSet: { move: moveDeclareSet },
      passTurn: { move: movePassTurn },
      chooseWild: { move: moveChooseWild },
    },

    endIf: (G, ctx) => {
      const result = checkWinCondition(G, ctx);
      if (result.winner !== null) return result;
    },

    turn: {
      onBegin: (G, ctx) => {
        G.lastSpecialEffect = null;
        if (rules.accessories?.dice?.rollWhen === 'start_of_turn' && rules.accessories.dice.enabled) {
          const count = rules.accessories.dice.count || 1;
          const sides = rules.accessories.dice.sides || 6;
          G.diceValues = Array.from({ length: count }, () =>
            ctx?.random?.Die ? ctx.random.Die(sides) : Math.floor(Math.random() * sides) + 1
          );
        }
        if (rules.actionsPerTurn?.mustDraw) {
          const count = rules.actionsPerTurn.drawCount || 1;
          for (let i = 0; i < count && G.drawPile.length > 0; i++) {
            G.players[ctx.currentPlayer].hand.push(G.drawPile.shift());
          }
        }
      },
      onEnd: (G, ctx) => {
        G.roundCount += 1;
      },
      order: {
        first: () => 0,
        next: (G, ctx) => {
          const dir = G.turnDirection || 1;
          return ((ctx.playOrderPos + dir) % ctx.numPlayers + ctx.numPlayers) % ctx.numPlayers;
        },
      },
    },
  };
}
