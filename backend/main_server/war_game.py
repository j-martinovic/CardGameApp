"""
war_game.py — Flask blueprint for the Game of War (bot vs player).

Game state is stored in an in-memory dict keyed by UUID game_id.
The client receives a game_id on /war/new and passes it with every subsequent request.

Routes
------
  POST /war/new    Start a new game; shuffle and deal 26 cards each.
  POST /war/play   Play one complete round (resolves all chained war sequences).
  GET  /war/state  Return current game state without modifying it.
  POST /war/quit   Abandon and clean up a game.

War Rules Implemented
---------------------
  - Standard 52-card deck, no jokers.
  - 26 cards dealt to each side.
  - Higher card wins both cards (2 lowest, Ace highest; suits irrelevant).
  - Tie triggers War: 3 face-down + 1 face-up each; higher face-up card wins all 10.
    If the face-up war cards also tie, War repeats immediately.
  - If a player has fewer than 4 cards when War is called, that player loses instantly.
  - Win condition: opponent holds 0 cards.
  - Safety valve: game declared a draw after 1000 rounds.
"""

import random
import uuid
from flask import Blueprint, request, jsonify

war_bp = Blueprint('war', __name__, url_prefix='/war')

# In-memory game store: { game_id (str): game_state (dict) }
_active_games = {}

# Card rank ordering — index+2 gives the numeric value (2→2 … A→14)
_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
_SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
_RANK_VALUES = {rank: idx + 2 for idx, rank in enumerate(_RANKS)}

_MAX_ROUNDS = 1000  # Safety valve to prevent infinite games


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _build_deck():
    """Return a freshly shuffled 52-card deck as a list of dicts."""
    deck = [
        {'rank': rank, 'suit': suit, 'value': _RANK_VALUES[rank]}
        for suit in _SUITS
        for rank in _RANKS
    ]
    random.shuffle(deck)
    return deck


def _play_round(game):
    """
    Resolve one complete round, including any chained War sequences.
    Mutates game state in place.

    Returns a result dict with:
      player_card   — the first card each side flipped
      bot_card
      war_sequence  — list of war-entry dicts (empty if no war)
      outcome       — 'player_wins' | 'bot_wins' | 'game_over'
      winner        — 'player' | 'bot' | 'draw' | None
      cards_won     — total cards in the pot
    """
    pd = game['player_deck']
    bd = game['bot_deck']

    # Edge-case: called when a deck is already empty
    if not pd:
        game['game_over'] = True
        game['winner'] = 'bot'
        return _game_over_result('bot', None, None)

    if not bd:
        game['game_over'] = True
        game['winner'] = 'player'
        return _game_over_result('player', None, None)

    # Safety valve
    game['round_count'] += 1
    if game['round_count'] > _MAX_ROUNDS:
        game['game_over'] = True
        game['winner'] = 'draw'
        return _game_over_result('draw', None, None)

    pot = []

    # Initial flip
    p_card = pd.pop(0)
    b_card = bd.pop(0)
    pot.extend([p_card, b_card])

    result = {
        'player_card': p_card,
        'bot_card':    b_card,
        'war_sequence': [],
        'outcome':  None,
        'winner':   None,
        'cards_won': 0,
    }

    # Resolve any chain of ties with War sequences
    while p_card['value'] == b_card['value']:
        war_entry = {
            'player_down': [],
            'bot_down':    [],
            'player_up':   None,
            'bot_up':      None,
        }

        # Not enough cards to execute War → that player loses
        if len(pd) < 4:
            game['game_over'] = True
            game['winner'] = 'bot'
            result['outcome'] = 'game_over'
            result['winner'] = 'bot'
            result['war_sequence'].append(war_entry)
            return result

        if len(bd) < 4:
            game['game_over'] = True
            game['winner'] = 'player'
            result['outcome'] = 'game_over'
            result['winner'] = 'player'
            result['war_sequence'].append(war_entry)
            return result

        # 3 face-down cards each
        for _ in range(3):
            down_p = pd.pop(0)
            down_b = bd.pop(0)
            war_entry['player_down'].append(down_p)
            war_entry['bot_down'].append(down_b)
            pot.extend([down_p, down_b])

        # 1 face-up battle card each
        p_card = pd.pop(0)
        b_card = bd.pop(0)
        war_entry['player_up'] = p_card
        war_entry['bot_up']    = b_card
        pot.extend([p_card, b_card])

        result['war_sequence'].append(war_entry)

    # Distribute pot to winner (shuffled to avoid predictable ordering)
    random.shuffle(pot)
    if p_card['value'] > b_card['value']:
        pd.extend(pot)
        result['outcome'] = 'player_wins'
    else:
        bd.extend(pot)
        result['outcome'] = 'bot_wins'

    result['cards_won'] = len(pot)

    # Check win conditions after distributing
    if not bd:
        game['game_over'] = True
        game['winner'] = 'player'
        result['winner'] = 'player'
    elif not pd:
        game['game_over'] = True
        game['winner'] = 'bot'
        result['winner'] = 'bot'

    return result


def _game_over_result(winner, p_card, b_card):
    return {
        'player_card':  p_card,
        'bot_card':     b_card,
        'war_sequence': [],
        'outcome':      'game_over',
        'winner':       winner,
        'cards_won':    0,
    }


def _snapshot(game):
    """Return a public state summary (no full deck contents)."""
    return {
        'player_count': len(game['player_deck']),
        'bot_count':    len(game['bot_deck']),
        'round_count':  game['round_count'],
        'game_over':    game['game_over'],
        'winner':       game['winner'],
    }


# ─── Routes ──────────────────────────────────────────────────────────────────

@war_bp.route('/new', methods=['POST'])
def new_game():
    """Start a new game. Returns game_id and the initial state snapshot."""
    deck = _build_deck()
    game_id = str(uuid.uuid4())

    _active_games[game_id] = {
        'player_deck': deck[:26],
        'bot_deck':    deck[26:],
        'round_count': 0,
        'game_over':   False,
        'winner':      None,
    }

    return jsonify({'game_id': game_id, **_snapshot(_active_games[game_id])}), 201


@war_bp.route('/play', methods=['POST'])
def play():
    """Play one round. Returns the round result merged with the updated state."""
    data = request.get_json(silent=True) or {}
    game_id = data.get('game_id')

    if not game_id or game_id not in _active_games:
        return jsonify({'error': 'Game not found. Start a new game first.'}), 404

    game = _active_games[game_id]

    if game['game_over']:
        return jsonify({'error': 'This game is already over.'}), 400

    round_result = _play_round(game)

    return jsonify({**round_result, **_snapshot(game)}), 200


@war_bp.route('/state', methods=['GET'])
def get_state():
    """Return current state without advancing the game."""
    game_id = request.args.get('game_id')

    if not game_id or game_id not in _active_games:
        return jsonify({'error': 'Game not found.'}), 404

    return jsonify(_snapshot(_active_games[game_id])), 200


@war_bp.route('/quit', methods=['POST'])
def quit_game():
    """End a game and free its memory."""
    data = request.get_json(silent=True) or {}
    game_id = data.get('game_id')

    if game_id and game_id in _active_games:
        del _active_games[game_id]

    return jsonify({'message': 'Game ended.'}), 200
