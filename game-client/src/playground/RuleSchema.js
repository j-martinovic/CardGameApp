// RuleSchema.js — the complete rule schema for custom games.
// Every field has a type, label, description, defaultValue, and options where applicable.
// This schema drives the form UI (RuleBuilder.jsx) and the game engine (CustomGameEngine.js).

export const RULE_SCHEMA = {

  // ── DECK & SETUP ──────────────────────────────────────────────────────────

  deckType: {
    label: 'Deck Type',
    type: 'select',
    options: ['standard_52', 'standard_52_jokers', 'double_deck', 'tarot', 'custom'],
    defaultValue: 'standard_52',
    description: 'The card deck used for the game.',
  },

  customDeckConfig: {
    label: 'Custom Deck',
    type: 'object',
    description: "Used only when deckType is 'custom'.",
    shape: {
      suits: { type: 'string_array', label: 'Suit names', defaultValue: ['♠', '♥', '♦', '♣'] },
      ranks: { type: 'string_array', label: 'Rank names', defaultValue: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'] },
      rankValues: { type: 'rank_value_map', label: 'Rank values (for comparisons)', defaultValue: {} },
      includeJokers: { type: 'boolean', label: 'Include jokers', defaultValue: false },
      jokerCount: { type: 'number', label: 'Number of jokers', defaultValue: 2, min: 0, max: 6 },
    },
    defaultValue: {
      suits: ['♠', '♥', '♦', '♣'],
      ranks: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'],
      rankValues: {},
      includeJokers: false,
      jokerCount: 2,
    },
  },

  numPlayers: {
    label: 'Number of Players',
    type: 'number',
    defaultValue: 2,
    min: 1,
    max: 8,
    description: 'How many players participate.',
  },

  cardsDealtPerPlayer: {
    label: 'Cards Dealt to Each Player at Start',
    type: 'number',
    defaultValue: 7,
    min: 0,
    max: 52,
    description: 'How many cards each player receives at the start of the game.',
  },

  dealDirection: {
    label: 'Deal Direction',
    type: 'select',
    options: ['clockwise', 'counterclockwise', 'simultaneous'],
    defaultValue: 'clockwise',
    description: 'Order in which cards are dealt.',
  },

  dealMode: {
    label: 'Deal Mode',
    type: 'select',
    options: ['one_at_a_time', 'all_at_once', 'by_hand'],
    defaultValue: 'one_at_a_time',
    description: 'Whether cards are dealt one per player per round or all at once.',
  },

  initialTableLayout: {
    label: 'Initial Table Layout',
    type: 'object',
    description: 'Cards placed on the table at the start, like in Solitaire.',
    shape: {
      enabled: { type: 'boolean', label: 'Enable table layout', defaultValue: false },
      piles: {
        type: 'array',
        label: 'Piles',
        description: 'Each pile is a stack of cards placed on the table.',
        itemShape: {
          pileId: { type: 'string', label: 'Pile name' },
          cardCount: { type: 'number', label: 'Cards in pile', min: 0, max: 52 },
          faceUpCount: { type: 'number', label: 'Cards face-up (top N)', min: 0, max: 52 },
          faceDownCount: { type: 'number', label: 'Cards face-down (bottom N)', min: 0, max: 52 },
          acceptsCards: { type: 'boolean', label: 'Players can play cards here' },
          acceptRule: {
            type: 'select', label: 'What can be played here',
            options: ['any', 'same_suit', 'alternating_color', 'ascending_rank', 'descending_rank', 'matching_rank', 'empty_only'],
          },
        },
        defaultValue: [],
      },
      drawPileVisible: { type: 'boolean', label: 'Draw pile is visible (face up top card)', defaultValue: false },
    },
    defaultValue: { enabled: false, piles: [], drawPileVisible: false },
  },

  // ── TURN STRUCTURE ────────────────────────────────────────────────────────

  turnBased: {
    label: 'Turn-Based',
    type: 'boolean',
    defaultValue: true,
    description: 'Players take turns. If false, all players act simultaneously.',
  },

  turnOrder: {
    label: 'Turn Order',
    type: 'select',
    options: ['clockwise', 'counterclockwise', 'random_each_round', 'by_score_ascending', 'by_score_descending'],
    defaultValue: 'clockwise',
    description: 'The order in which players take turns.',
  },

  actionsPerTurn: {
    label: 'Actions Per Turn',
    type: 'object',
    description: 'What a player may do on their turn.',
    shape: {
      mustDraw: { type: 'boolean', label: 'Must draw a card', defaultValue: false },
      mayDraw: { type: 'boolean', label: 'May draw a card (optional)', defaultValue: true },
      drawCount: { type: 'number', label: 'Cards drawn per turn', defaultValue: 1, min: 0, max: 10 },
      drawFrom: {
        type: 'select', label: 'Draw from',
        options: ['draw_pile', 'discard_pile', 'either', 'opponent_hand', 'table_pile'],
        defaultValue: 'draw_pile',
      },
      mustDiscard: { type: 'boolean', label: 'Must discard a card', defaultValue: false },
      mayDiscard: { type: 'boolean', label: 'May discard a card (optional)', defaultValue: true },
      discardCount: { type: 'number', label: 'Cards discarded per turn', defaultValue: 1, min: 0, max: 10 },
      discardTo: {
        type: 'select', label: 'Discard to',
        options: ['discard_pile', 'draw_pile_bottom', 'draw_pile_top', 'out_of_game'],
        defaultValue: 'discard_pile',
      },
      mayPlayToTable: { type: 'boolean', label: 'May play cards to table', defaultValue: false },
      mayPickUpDiscardPile: { type: 'boolean', label: 'May pick up entire discard pile', defaultValue: false },
      mustPlayCard: { type: 'boolean', label: 'Must play a card from hand', defaultValue: false },
      playCardRule: {
        type: 'select', label: 'Card play rule',
        options: ['any', 'must_match_suit', 'must_match_rank', 'must_follow_suit', 'must_beat_current', 'must_be_higher', 'any_from_hand'],
        defaultValue: 'any',
      },
      mayAskForCard: { type: 'boolean', label: 'May ask another player for a card (Go Fish style)', defaultValue: false },
      askForCardRule: {
        type: 'select', label: 'Must hold at least one of the asked rank',
        options: ['must_hold_rank', 'any_ask'],
        defaultValue: 'must_hold_rank',
      },
    },
    defaultValue: {
      mustDraw: false, mayDraw: true, drawCount: 1, drawFrom: 'draw_pile',
      mustDiscard: false, mayDiscard: true, discardCount: 1, discardTo: 'discard_pile',
      mayPlayToTable: false, mayPickUpDiscardPile: false,
      mustPlayCard: false, playCardRule: 'any',
      mayAskForCard: false, askForCardRule: 'must_hold_rank',
    },
  },

  // ── TRICK TAKING ──────────────────────────────────────────────────────────

  trickTaking: {
    label: 'Trick Taking',
    type: 'object',
    description: 'Rules for trick-taking games (Spades, Hearts, etc.)',
    shape: {
      enabled: { type: 'boolean', label: 'This is a trick-taking game', defaultValue: false },
      cardsPerTrick: { type: 'number', label: 'Cards per trick (usually = num players)', defaultValue: 2 },
      leadSuit: {
        type: 'select', label: 'Must follow lead suit if able',
        options: ['must_follow', 'may_follow', 'no_rule'], defaultValue: 'must_follow',
      },
      trumpSuit: {
        type: 'select', label: 'Trump suit',
        options: ['none', 'fixed', 'bid', 'flipped_card', 'no_trump'], defaultValue: 'none',
      },
      fixedTrumpSuit: {
        type: 'select', label: 'Fixed trump suit (if trump=fixed)',
        options: ['♠', '♥', '♦', '♣'], defaultValue: '♠',
      },
      trickWinner: {
        type: 'select', label: 'Who wins the trick',
        options: ['highest_of_lead_suit', 'highest_trump_else_lead', 'lowest_card', 'highest_card_any_suit'],
        defaultValue: 'highest_of_lead_suit',
      },
      trickWinnerLeads: { type: 'boolean', label: 'Trick winner leads next trick', defaultValue: true },
      scoringPerTrick: { type: 'number', label: 'Points per trick won', defaultValue: 1 },
    },
    defaultValue: {
      enabled: false, cardsPerTrick: 2, leadSuit: 'must_follow',
      trumpSuit: 'none', fixedTrumpSuit: '♠',
      trickWinner: 'highest_of_lead_suit', trickWinnerLeads: true, scoringPerTrick: 1,
    },
  },

  // ── WIN CONDITIONS ────────────────────────────────────────────────────────

  winCondition: {
    label: 'Win Condition',
    type: 'select',
    options: [
      'empty_hand', 'most_cards', 'fewest_cards', 'target_score', 'lowest_score',
      'highest_score', 'most_tricks', 'fewest_tricks', 'collect_sets',
      'last_player_standing', 'exact_count', 'custom_condition',
    ],
    defaultValue: 'empty_hand',
    description: 'How the winner is determined.',
  },

  targetScore: {
    label: 'Target Score',
    type: 'number',
    defaultValue: 100,
    min: 1,
    description: "Used when winCondition is 'target_score'.",
  },

  targetSets: {
    label: 'Sets Needed to Win',
    type: 'number',
    defaultValue: 4,
    min: 1,
    description: 'Number of complete sets (books) needed.',
  },

  setSize: {
    label: 'Cards Per Set (Book)',
    type: 'number',
    defaultValue: 4,
    min: 2,
    max: 13,
    description: 'How many cards constitute a complete set.',
  },

  maxRounds: {
    label: 'Max Rounds',
    type: 'number',
    defaultValue: 0,
    min: 0,
    description: 'Game ends after this many rounds. 0 = no limit.',
  },

  customWinDescription: {
    label: 'Custom Win Condition (describe)',
    type: 'textarea',
    defaultValue: '',
    description: 'Plain text description for custom win conditions.',
  },

  // ── SCORING ───────────────────────────────────────────────────────────────

  scoring: {
    label: 'Scoring Rules',
    type: 'object',
    shape: {
      enabled: { type: 'boolean', label: 'Game uses a score', defaultValue: false },
      cardValues: {
        type: 'select', label: 'Card point values',
        options: ['none', 'rank_value', 'face_cards_10', 'aces_11_faces_10', 'custom_map'],
        defaultValue: 'none',
      },
      customCardValues: { type: 'rank_value_map', label: 'Custom point values per rank', defaultValue: {} },
      penaltyPerCardInHand: { type: 'number', label: 'Points penalized per card left in hand at game end', defaultValue: 0 },
      bonusForEmptyHand: { type: 'number', label: 'Bonus points for emptying hand first', defaultValue: 0 },
    },
    defaultValue: {
      enabled: false, cardValues: 'none', customCardValues: {},
      penaltyPerCardInHand: 0, bonusForEmptyHand: 0,
    },
  },

  // ── SPECIAL CARDS / WILD CARDS ────────────────────────────────────────────

  specialCards: {
    label: 'Special Cards',
    type: 'array',
    description: 'Cards that trigger special effects when played.',
    itemShape: {
      rank: { type: 'string', label: "Card rank (e.g. '2', 'A', 'J', 'Joker')" },
      suit: { type: 'string', label: "Suit (or 'any' for all suits of this rank)" },
      effect: {
        type: 'select', label: 'Effect when played',
        options: [
          'skip_next_player', 'reverse_turn_order', 'draw_2_next_player', 'draw_4_next_player',
          'wild_choose_suit', 'wild_choose_rank', 'player_beside_draws', 'player_beside_discards',
          'steal_card_from_player', 'play_again', 'swap_hands', 'peek_at_hand', 'block_draw',
          'force_discard_hand', 'double_points', 'give_cards_to_player', 'draw_to_5', 'none',
        ],
        defaultValue: 'none',
      },
      effectValue: { type: 'number', label: 'Effect value (e.g. draw N cards)', defaultValue: 2 },
      description: { type: 'string', label: 'Description for display' },
    },
    defaultValue: [],
  },

  // ── ACCESSORIES ───────────────────────────────────────────────────────────

  accessories: {
    label: 'Game Accessories',
    type: 'object',
    description: 'Additional game components beyond cards.',
    shape: {
      dice: {
        type: 'object', label: 'Dice',
        shape: {
          enabled: { type: 'boolean', label: 'Use dice', defaultValue: false },
          count: { type: 'number', label: 'Number of dice', defaultValue: 1, min: 1, max: 6 },
          sides: { type: 'number', label: 'Sides per die', defaultValue: 6, min: 2, max: 20 },
          rollWhen: {
            type: 'select', label: 'When dice are rolled',
            options: ['start_of_turn', 'end_of_turn', 'before_draw', 'after_play', 'on_demand'],
            defaultValue: 'start_of_turn',
          },
          effect: {
            type: 'select', label: 'What the dice roll determines',
            options: ['cards_drawn', 'cards_discarded', 'points_scored', 'turn_order', 'none'],
            defaultValue: 'none',
          },
        },
      },
      chips: {
        type: 'object', label: 'Poker Chips / Tokens',
        shape: {
          enabled: { type: 'boolean', label: 'Use chips/tokens', defaultValue: false },
          startingChips: { type: 'number', label: 'Starting chips per player', defaultValue: 100, min: 0 },
          chipDenominations: { type: 'number_array', label: 'Chip values', defaultValue: [1, 5, 10, 25] },
          anteAmount: { type: 'number', label: 'Ante per round', defaultValue: 0 },
          bettingRounds: { type: 'number', label: 'Betting rounds per hand', defaultValue: 0 },
        },
      },
      jokers: {
        type: 'object', label: 'Joker Rules',
        shape: {
          enabled: { type: 'boolean', label: 'Jokers are in play', defaultValue: false },
          jokerEffect: {
            type: 'select', label: 'Joker acts as',
            options: ['wild_any', 'wild_rank', 'wild_suit', 'skip_turn', 'special_action', 'highest_card', 'lowest_card'],
            defaultValue: 'wild_any',
          },
        },
      },
      communityCards: {
        type: 'object', label: 'Community Cards (shared by all players)',
        shape: {
          enabled: { type: 'boolean', label: 'Use community cards', defaultValue: false },
          count: { type: 'number', label: 'Number of community cards', defaultValue: 3 },
          revealedAtStart: { type: 'number', label: 'Cards revealed at game start', defaultValue: 0 },
        },
      },
    },
    defaultValue: {
      dice: { enabled: false, count: 1, sides: 6, rollWhen: 'start_of_turn', effect: 'none' },
      chips: { enabled: false, startingChips: 100, chipDenominations: [1, 5, 10, 25], anteAmount: 0, bettingRounds: 0 },
      jokers: { enabled: false, jokerEffect: 'wild_any' },
      communityCards: { enabled: false, count: 3, revealedAtStart: 0 },
    },
  },

  // ── TABLE LAYOUT ──────────────────────────────────────────────────────────

  tableLayout: {
    label: 'Table Layout',
    type: 'object',
    description: 'Where game elements are positioned on the table.',
    shape: {
      drawPilePosition: {
        type: 'select', label: 'Draw pile position',
        options: ['center', 'left', 'right', 'top', 'bottom', 'none'], defaultValue: 'center',
      },
      discardPilePosition: {
        type: 'select', label: 'Discard pile position',
        options: ['center', 'left_of_draw', 'right_of_draw', 'top', 'bottom', 'none'], defaultValue: 'right_of_draw',
      },
      playerHandPosition: {
        type: 'select', label: 'Player hand position',
        options: ['bottom', 'top', 'left', 'right'], defaultValue: 'bottom',
      },
      handVisible: {
        type: 'select', label: 'Hand visibility',
        options: ['face_up_to_owner', 'face_down_to_others', 'face_up_to_all', 'face_down_to_all'],
        defaultValue: 'face_up_to_owner',
      },
      showCardCount: { type: 'boolean', label: 'Show opponent card count', defaultValue: true },
      tableStyle: {
        type: 'select', label: 'Table style',
        options: ['poker', 'bridge', 'solitaire', 'war', 'minimal'], defaultValue: 'poker',
      },
    },
    defaultValue: {
      drawPilePosition: 'center', discardPilePosition: 'right_of_draw',
      playerHandPosition: 'bottom', handVisible: 'face_up_to_owner',
      showCardCount: true, tableStyle: 'poker',
    },
  },

  // ── HOUSE RULES / EXTRA ───────────────────────────────────────────────────

  houseRules: {
    label: 'House Rules',
    type: 'array',
    description: 'Free-form additional rules in plain text.',
    itemShape: {
      rule: { type: 'string', label: 'Rule description' },
    },
    defaultValue: [],
  },

  gameName: {
    label: 'Game Name',
    type: 'string',
    defaultValue: 'My Custom Game',
    description: 'Display name for this game.',
  },

  gameDescription: {
    label: 'Game Description',
    type: 'textarea',
    defaultValue: '',
    description: 'Brief description shown in the lobby.',
  },
};

export const DEFAULT_RULES = Object.fromEntries(
  Object.entries(RULE_SCHEMA).map(([key, def]) => [key, def.defaultValue ?? null])
);
