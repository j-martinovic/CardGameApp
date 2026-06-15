"""
Shared social interaction handlers.

These are server-side side-effect handlers (not game-state mutations).
They are called from the shared_handlers Blueprint routes in api_routes.py.
"""
import time


def send_chat_message(player_id: str, message: str, room_id: str, chat_log: list) -> dict:
    """Append a chat message to the room's chat log.

    Args:
        player_id: ID of the sender.
        message: Text content of the message (max 500 chars enforced here).
        room_id: ID of the room the message belongs to.
        chat_log: Mutable list of existing chat entries.

    Returns:
        The new chat entry dict that was appended.
    """
    entry = {
        "player_id": player_id,
        "message": message[:500],
        "room_id": room_id,
        "timestamp": time.time(),
        "type": "chat",
    }
    chat_log.append(entry)
    return entry


def send_emoji_reaction(player_id: str, emoji: str, room_id: str, reaction_log: list) -> dict:
    """Broadcast an emoji reaction from a player.

    Args:
        player_id: ID of the reacting player.
        emoji: A single emoji character or short code (e.g., '👍', ':thumbsup:').
        room_id: Room the reaction belongs to.
        reaction_log: Mutable list of existing reactions.

    Returns:
        The new reaction entry dict that was appended.
    """
    entry = {
        "player_id": player_id,
        "emoji": emoji[:8],
        "room_id": room_id,
        "timestamp": time.time(),
        "type": "emoji",
    }
    reaction_log.append(entry)
    return entry


def send_quick_phrase(player_id: str, phrase_key: str, room_id: str, chat_log: list) -> dict:
    """Send a predefined quick phrase (e.g., 'Good game!', 'Nice move!').

    Args:
        player_id: ID of the sending player.
        phrase_key: Key identifying the phrase from a predefined set.
        room_id: Room the phrase belongs to.
        chat_log: Mutable list of existing chat entries.

    Returns:
        The new chat entry dict that was appended.
    """
    entry = {
        "player_id": player_id,
        "phrase_key": phrase_key,
        "room_id": room_id,
        "timestamp": time.time(),
        "type": "quick_phrase",
    }
    chat_log.append(entry)
    return entry


def mute_player(requester_id: str, target_id: str, mute_list: dict) -> dict:
    """Add a player to the requester's personal mute list.

    Args:
        requester_id: ID of the player doing the muting.
        target_id: ID of the player to mute.
        mute_list: Dict mapping player IDs to their list of muted player IDs.

    Returns:
        Updated mute_list.
    """
    mute_list.setdefault(requester_id, [])
    if target_id not in mute_list[requester_id]:
        mute_list[requester_id].append(target_id)
    return mute_list


def report_player(reporter_id: str, reported_id: str, reason: str, report_store: list) -> dict:
    """File a report against a player for moderator review.

    Args:
        reporter_id: ID of the reporting player.
        reported_id: ID of the player being reported.
        reason: Text description of the violation.
        report_store: Mutable list of existing reports.

    Returns:
        The new report entry dict that was appended.
    """
    entry = {
        "reporter": reporter_id,
        "reported": reported_id,
        "reason": reason[:1000],
        "timestamp": time.time(),
        "status": "pending",
    }
    report_store.append(entry)
    return entry


def block_player(requester_id: str, target_id: str, block_list: dict) -> dict:
    """Add a player to the requester's block list (prevents future room joins together).

    Args:
        requester_id: ID of the blocking player.
        target_id: ID of the player to block.
        block_list: Dict mapping player IDs to their list of blocked player IDs.

    Returns:
        Updated block_list.
    """
    block_list.setdefault(requester_id, [])
    if target_id not in block_list[requester_id]:
        block_list[requester_id].append(target_id)
    return block_list


def send_spectator_chat(spectator_id: str, message: str, room_id: str, spectator_chat_log: list) -> dict:
    """Append a message to the spectator-only chat channel.

    Args:
        spectator_id: ID of the spectator sending the message.
        message: Text content (max 500 chars).
        room_id: Room the message belongs to.
        spectator_chat_log: Mutable list of spectator chat entries.

    Returns:
        The new spectator chat entry dict that was appended.
    """
    entry = {
        "spectator_id": spectator_id,
        "message": message[:500],
        "room_id": room_id,
        "timestamp": time.time(),
        "type": "spectator_chat",
    }
    spectator_chat_log.append(entry)
    return entry
