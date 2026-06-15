"""
Shared scoring and achievement handlers.

These handlers update scores, unlock achievements, and manage hand history exports.
Score formulas are game-specific and must be provided by the calling resolver.
"""
import time


def update_score(game_state: dict, player_id: str, delta: int, reason: str = "") -> dict:
    """Add (or subtract) points from a player's score.

    Args:
        game_state: Current game state dict. Expected key: 'scores'.
        player_id: ID of the player whose score to update.
        delta: Points to add (negative to subtract).
        reason: Optional label for the score change (for the score log).

    Returns:
        Updated game_state with the player's score adjusted.
    """
    scores = game_state.setdefault("scores", {})
    scores[player_id] = scores.get(player_id, 0) + delta
    game_state.setdefault("score_log", []).append({
        "player": player_id,
        "delta": delta,
        "reason": reason,
        "total": scores[player_id],
        "timestamp": time.time(),
    })
    return game_state


def unlock_achievement(game_state: dict, player_id: str, achievement_id: str) -> dict:
    """Mark an achievement as unlocked for a player.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player unlocking the achievement.
        achievement_id: Unique identifier for the achievement (e.g., 'first_war').

    Returns:
        Updated game_state with the achievement recorded.
    """
    achievements = game_state.setdefault("achievements", {}).setdefault(player_id, [])
    if achievement_id not in achievements:
        achievements.append(achievement_id)
        game_state.setdefault("action_log", []).append({
            "event": "achievement_unlocked",
            "player": player_id,
            "achievement_id": achievement_id,
            "timestamp": time.time(),
        })
    return game_state


def export_hand_history(game_state: dict) -> list:
    """Return a serializable copy of the hand/action log for export.

    Args:
        game_state: Current game state dict. Expected key: 'action_log'.

    Returns:
        A list of action log entries (deep copy) suitable for JSON serialization.
    """
    import copy
    return copy.deepcopy(game_state.get("action_log", []))


def kibitz_replay_step(game_state: dict, step_index: int, hand_history: list) -> dict:
    """Return the game state at a specific step for kibitz/replay viewing.

    Args:
        game_state: Current game state dict (used as a base for reconstruction).
        step_index: Index into hand_history to replay up to.
        hand_history: Full list of logged game events for this hand.

    Returns:
        A dict with 'step' (the event at step_index) and 'total_steps' count.
    """
    total = len(hand_history)
    step = hand_history[step_index] if 0 <= step_index < total else None
    return {"step": step, "step_index": step_index, "total_steps": total}
