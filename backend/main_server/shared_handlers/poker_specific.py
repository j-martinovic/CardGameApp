"""
Poker-specific game handlers.

These handlers cover mechanics unique to Poker variants (all-in, side pots,
rabbit hunting, muck/show). Game-specific hand ranking and pot allocation
must be implemented in the calling game's move resolver.
"""
import time


def all_in(game_state: dict, player_id: str) -> dict:
    """Commit all of a player's remaining chips to the pot.

    Args:
        game_state: Current game state dict. Expected keys: 'chips', 'bets', 'pot'.
        player_id: ID of the all-in player.

    Returns:
        Updated game_state with the player's chips moved to pot and recorded as all-in.
    """
    chips = game_state.get("chips", {}).get(player_id, 0)
    already_bet = game_state.get("bets", {}).get(player_id, 0)
    game_state.setdefault("bets", {})[player_id] = already_bet + chips
    game_state.setdefault("chips", {})[player_id] = 0
    game_state.setdefault("pot", 0)
    game_state["pot"] += chips
    game_state.setdefault("all_in_players", [])
    if player_id not in game_state["all_in_players"]:
        game_state["all_in_players"].append(player_id)
    current_bet = game_state.get("current_bet", 0)
    total_bet = already_bet + chips
    if total_bet > current_bet:
        game_state["current_bet"] = total_bet
    game_state.setdefault("action_log", []).append({
        "event": "all_in",
        "player": player_id,
        "amount": chips,
        "timestamp": time.time(),
    })
    return game_state


def show_hand(game_state: dict, player_id: str) -> dict:
    """Flip the player's hole cards face-up for showdown.

    Args:
        game_state: Current game state dict. Expected key: 'hands'.
        player_id: ID of the player showing their hand.

    Returns:
        Updated game_state with the player's cards marked face_up.
    """
    hand = game_state.get("hands", {}).get(player_id, [])
    for card in hand:
        card["face_up"] = True
    game_state.setdefault("showdown_hands", {})[player_id] = hand
    return game_state


def muck_hand(game_state: dict, player_id: str) -> dict:
    """Discard the player's hand face-down at showdown (losers may muck).

    Args:
        game_state: Current game state dict.
        player_id: ID of the player mucking their hand.

    Returns:
        Updated game_state with the mucked hand recorded and hand cleared.
    """
    hand = game_state.get("hands", {}).get(player_id, [])
    for card in hand:
        card["face_up"] = False
    game_state.setdefault("muck_pile", []).extend(hand)
    game_state.setdefault("hands", {})[player_id] = []
    game_state.setdefault("action_log", []).append({
        "event": "muck",
        "player": player_id,
        "timestamp": time.time(),
    })
    return game_state


def rabbit_hunt(game_state: dict, requesting_player_id: str) -> dict:
    """Reveal the next card(s) that would have been dealt (rabbit hunting).

    This is a post-hand entertainment feature. The deck must not have been
    modified after the hand ended.

    Args:
        game_state: Current game state dict. Expected key: 'deck'.
        requesting_player_id: ID of the player requesting the rabbit hunt.

    Returns:
        Updated game_state with the next card(s) tagged as 'rabbit_cards'.
    """
    deck = game_state.get("deck", [])
    rabbit = deck[0] if deck else None
    game_state["rabbit_card"] = rabbit
    game_state["rabbit_hunt_requested_by"] = requesting_player_id
    return game_state


def track_side_pot(game_state: dict) -> dict:
    """Recalculate side pots based on the current all-in amounts.

    Side pots are created when players with different chip counts go all-in.
    The exact split requires iterating over all-in amounts — this is a stub
    that records the trigger; the game-specific resolver must compute splits.

    Args:
        game_state: Current game state dict. Expected keys: 'bets', 'all_in_players'.

    Returns:
        Updated game_state with 'side_pots_dirty' flag set for the resolver.
    """
    game_state["side_pots_dirty"] = True
    game_state.setdefault("action_log", []).append({
        "event": "side_pot_recalculate_needed",
        "timestamp": time.time(),
    })
    return game_state


def auto_fold_checkbox(game_state: dict, player_id: str, enabled: bool) -> dict:
    """Toggle the auto-fold preference for a player when it's not their turn.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player toggling the setting.
        enabled: True to enable auto-fold, False to disable.

    Returns:
        Updated game_state with the player's auto_fold preference recorded.
    """
    game_state.setdefault("auto_fold", {})[player_id] = enabled
    return game_state
