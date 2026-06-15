"""
Shared turn and round lifecycle handlers.

Each function accepts `game_state` (dict) and lifecycle-specific arguments.
boardgame.io manages authoritative turn order; these handlers track supplemental
state (logs, reconnection snapshots, resync flags) that Flask may need.
"""
import copy
import time


def start_game(game_state: dict, player_ids: list) -> dict:
    """Initialize shared round metadata at game start.

    Args:
        game_state: Current game state dict.
        player_ids: Ordered list of player IDs participating in the game.

    Returns:
        Updated game_state with round_number set to 1 and player list recorded.
    """
    game_state["round_number"] = 1
    game_state["players"] = player_ids
    game_state["status"] = "in_progress"
    game_state.setdefault("action_log", []).append(
        {"event": "game_started", "players": player_ids, "timestamp": time.time()}
    )
    return game_state


def end_turn(game_state: dict, player_id: str) -> dict:
    """Record that the given player's turn has ended.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player whose turn ended.

    Returns:
        Updated game_state with the turn-end logged.
    """
    game_state.setdefault("action_log", []).append(
        {"event": "turn_ended", "player": player_id, "timestamp": time.time()}
    )
    return game_state


def start_next_round(game_state: dict) -> dict:
    """Increment round counter and clear per-round transient state.

    Args:
        game_state: Current game state dict. Expected key: 'round_number'.

    Returns:
        Updated game_state with round_number incremented.
    """
    game_state["round_number"] = game_state.get("round_number", 0) + 1
    game_state["action_log"] = []
    return game_state


def forfeit(game_state: dict, player_id: str) -> dict:
    """Record a player forfeit, marking them as eliminated.

    Args:
        game_state: Current game state dict.
        player_id: ID of the forfeiting player.

    Returns:
        Updated game_state with the player marked as forfeited.
    """
    game_state.setdefault("forfeits", []).append(player_id)
    game_state.setdefault("eliminated", [])
    if player_id not in game_state["eliminated"]:
        game_state["eliminated"].append(player_id)
    game_state.setdefault("action_log", []).append(
        {"event": "forfeit", "player": player_id, "timestamp": time.time()}
    )
    return game_state


def turn_timeout_autoplay(game_state: dict, player_id: str) -> dict:
    """Auto-play or auto-pass for a player whose turn timer has expired.

    The game-specific resolver should check game_state['turn_timeout_player']
    and apply the default action (fold, pass, etc.) for its rules.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player who timed out.

    Returns:
        Updated game_state with the timeout recorded and a flag set for the resolver.
    """
    game_state["turn_timeout_player"] = player_id
    game_state.setdefault("timeouts", []).append(
        {"player": player_id, "event": "turn_timeout", "timestamp": time.time()}
    )
    return game_state


def undo_last_action(game_state: dict, previous_state_snapshot: dict) -> dict:
    """Restore game state to a previous snapshot (undo).

    Callers are responsible for storing snapshots before each move.

    Args:
        game_state: Current game state dict (ignored; replaced by snapshot).
        previous_state_snapshot: A deep copy of the state before the last action.

    Returns:
        The restored game_state snapshot.
    """
    return copy.deepcopy(previous_state_snapshot)


def restore_reconnection_state(game_state: dict, player_id: str) -> dict:
    """Restore a reconnecting player's view by tagging them as reconnected.

    boardgame.io will re-send the full G to the reconnected client; this
    function records the reconnection event for logging and analytics.

    Args:
        game_state: Current game state dict.
        player_id: ID of the reconnecting player.

    Returns:
        Updated game_state with the reconnection event logged.
    """
    game_state.setdefault("reconnections", []).append(
        {"player": player_id, "timestamp": time.time()}
    )
    return game_state


def force_resync(game_state: dict) -> dict:
    """Set a resync flag that instructs all clients to re-fetch full state.

    Useful after a server migration or state corruption recovery.

    Args:
        game_state: Current game state dict.

    Returns:
        Updated game_state with 'resync_required' set to True.
    """
    game_state["resync_required"] = True
    game_state.setdefault("action_log", []).append(
        {"event": "force_resync", "timestamp": time.time()}
    )
    return game_state
