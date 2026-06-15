"""
Shared debug and development handlers.

These handlers are intended for development and QA only.
Guard all calls with an environment check before registering in production:

    if app.debug:
        app.register_blueprint(debug_bp)
"""
import copy
import time


def force_specific_deal(game_state: dict, player_id: str, hand: list) -> dict:
    """Override a player's hand with a specific set of cards for testing.

    Args:
        game_state: Current game state dict. Expected key: 'hands'.
        player_id: ID of the player whose hand to override.
        hand: List of card dicts to assign to the player.

    Returns:
        Updated game_state with the player's hand replaced.
    """
    game_state.setdefault("hands", {})[player_id] = hand
    game_state.setdefault("debug_log", []).append({
        "action": "force_deal",
        "player": player_id,
        "hand": hand,
        "timestamp": time.time(),
    })
    return game_state


def reveal_all_hands(game_state: dict) -> dict:
    """Flip every card in every hand face-up (god-mode view).

    Args:
        game_state: Current game state dict. Expected key: 'hands'.

    Returns:
        Updated game_state with all cards marked face_up.
    """
    for player_id, hand in game_state.get("hands", {}).items():
        for card in hand:
            card["face_up"] = True
    game_state.setdefault("debug_log", []).append({
        "action": "reveal_all_hands",
        "timestamp": time.time(),
    })
    return game_state


def simulate_disconnect(game_state: dict, player_id: str) -> dict:
    """Simulate a player disconnection for reconnection-flow testing.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player to mark as disconnected.

    Returns:
        Updated game_state with the player marked as disconnected.
    """
    game_state.setdefault("disconnected", [])
    if player_id not in game_state["disconnected"]:
        game_state["disconnected"].append(player_id)
    game_state.setdefault("debug_log", []).append({
        "action": "simulate_disconnect",
        "player": player_id,
        "timestamp": time.time(),
    })
    return game_state


def step_game_state(game_state: dict, patch: dict) -> dict:
    """Apply an arbitrary patch dict to the game state for manual testing.

    Args:
        game_state: Current game state dict.
        patch: Dict of key-value pairs to merge into game_state.

    Returns:
        Updated game_state with patch applied (shallow merge at top level).
    """
    game_state.update(patch)
    game_state.setdefault("debug_log", []).append({
        "action": "step_game_state",
        "patch_keys": list(patch.keys()),
        "timestamp": time.time(),
    })
    return game_state


def dump_game_log(game_state: dict) -> dict:
    """Return a serializable snapshot of the full game log for inspection.

    Args:
        game_state: Current game state dict.

    Returns:
        Dict with 'action_log', 'debug_log', and a deep-copied state snapshot.
    """
    return {
        "action_log": copy.deepcopy(game_state.get("action_log", [])),
        "debug_log": copy.deepcopy(game_state.get("debug_log", [])),
        "state_snapshot": copy.deepcopy(game_state),
        "timestamp": time.time(),
    }
