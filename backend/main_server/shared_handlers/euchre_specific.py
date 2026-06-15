"""
Euchre-specific game handlers.

These handlers cover Euchre's unique bidding mechanics (ordering up, going alone,
stick/screw the dealer). All functions are stubs with correct signatures —
implement validation and scoring inside the Euchre game's move resolver.
"""
import time


def order_it_up(game_state: dict, player_id: str) -> dict:
    """Order the dealer to pick up the turned-up card, naming that card's suit as trump.

    Args:
        game_state: Current game state dict. Expected key: 'turned_up_card'.
        player_id: ID of the player ordering it up (may be any non-dealer).

    Returns:
        Updated game_state with trump_suit set from the turned-up card and
        'ordered_by' recorded.
    """
    turned_up = game_state.get("turned_up_card", {})
    suit = turned_up.get("suit")
    if suit:
        game_state["trump_suit"] = suit
    game_state["ordered_by"] = player_id
    game_state.setdefault("bid_history", []).append({
        "player": player_id,
        "call": "order_up",
        "trump": suit,
        "timestamp": time.time(),
    })
    return game_state


def pass_pick_it_up(game_state: dict, player_id: str) -> dict:
    """Pass during the first round of bidding (decline to order it up).

    Args:
        game_state: Current game state dict.
        player_id: ID of the passing player.

    Returns:
        Updated game_state with the pass recorded in bid_history.
    """
    game_state.setdefault("bid_history", []).append({
        "player": player_id,
        "call": "pass",
        "round": 1,
        "timestamp": time.time(),
    })
    game_state.setdefault("round1_passes", []).append(player_id)
    return game_state


def go_alone(game_state: dict, player_id: str) -> dict:
    """Declare that the maker will play without their partner's help.

    Awards 4 points if successful instead of 2 (game-specific scoring stub).

    Args:
        game_state: Current game state dict.
        player_id: ID of the player going alone.

    Returns:
        Updated game_state with 'going_alone' set and partner's hand hidden.
    """
    game_state["going_alone"] = True
    game_state["loner_player"] = player_id
    # Determine partner and mark them as sitting out — partnership mapping is game-specific.
    game_state.setdefault("sitting_out", [])
    game_state.setdefault("action_log", []).append({
        "event": "go_alone",
        "player": player_id,
        "timestamp": time.time(),
    })
    return game_state


def stick_the_dealer(game_state: dict, dealer_id: str) -> dict:
    """Force the dealer to name trump when everyone has passed in round 2.

    'Stick the dealer' is a house rule that prevents a second pass by the dealer.

    Args:
        game_state: Current game state dict.
        dealer_id: ID of the dealer who must name trump.

    Returns:
        Updated game_state with 'must_name_trump' flag set on the dealer.
    """
    game_state["must_name_trump"] = True
    game_state["must_name_trump_player"] = dealer_id
    game_state.setdefault("action_log", []).append({
        "event": "stick_the_dealer",
        "dealer": dealer_id,
        "timestamp": time.time(),
    })
    return game_state


def screw_the_dealer(game_state: dict, dealer_id: str) -> dict:
    """Alias for stick_the_dealer — some regions use this term instead.

    Args:
        game_state: Current game state dict.
        dealer_id: ID of the dealer who must name trump.

    Returns:
        Updated game_state via stick_the_dealer.
    """
    return stick_the_dealer(game_state, dealer_id)
