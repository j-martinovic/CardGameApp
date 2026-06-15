"""
Shared lobby management handlers.

These complement the Flask rooms blueprint (rooms.py) with higher-level
lobby actions that aren't covered by the base room CRUD.
"""
import time


def create_room(room_store: dict, host_id: str, game_name: str, max_players: int, house_rules: dict = None) -> dict:
    """Create a new lobby room.

    Args:
        room_store: Mutable dict of room_id -> room data.
        host_id: ID of the player creating the room.
        game_name: Name of the game to be played.
        max_players: Maximum number of players allowed.
        house_rules: Optional game-specific rule overrides.

    Returns:
        The newly created room dict.
    """
    import uuid, random, string
    room_id = str(uuid.uuid4())
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    room = {
        "room_id": room_id,
        "room_code": code,
        "host_id": host_id,
        "game_name": game_name,
        "max_players": max_players,
        "players": [host_id],
        "spectators": [],
        "house_rules": house_rules or {},
        "status": "waiting",
        "created_at": time.time(),
    }
    room_store[room_id] = room
    return room


def join_room(room: dict, player_id: str) -> dict:
    """Add a player to an existing room.

    Args:
        room: The room dict to join.
        player_id: ID of the joining player.

    Returns:
        Updated room dict. Raises ValueError if room is full or in progress.
    """
    if room["status"] != "waiting":
        raise ValueError("Room is not accepting players")
    if len(room["players"]) >= room["max_players"]:
        raise ValueError("Room is full")
    if player_id not in room["players"]:
        room["players"].append(player_id)
    return room


def leave_room(room: dict, player_id: str) -> dict:
    """Remove a player from a room.

    Args:
        room: The room dict to leave.
        player_id: ID of the leaving player.

    Returns:
        Updated room dict with the player removed.
    """
    room["players"] = [p for p in room["players"] if p != player_id]
    room["spectators"] = [s for s in room["spectators"] if s != player_id]
    return room


def ready_up(room: dict, player_id: str, ready: bool = True) -> dict:
    """Toggle a player's ready state in the lobby.

    Args:
        room: The room dict containing player ready states.
        player_id: ID of the player toggling their state.
        ready: True to mark ready, False to unmark.

    Returns:
        Updated room dict with the ready state map updated.
    """
    room.setdefault("ready_states", {})[player_id] = ready
    return room


def spectate_game(room: dict, spectator_id: str) -> dict:
    """Add a user as a spectator in a room.

    Args:
        room: The room dict to spectate.
        spectator_id: ID of the spectating user.

    Returns:
        Updated room dict with the spectator added.
    """
    if spectator_id not in room.get("spectators", []):
        room.setdefault("spectators", []).append(spectator_id)
    return room


def promote_spectator(room: dict, spectator_id: str) -> dict:
    """Move a spectator into the player roster (filling an open seat).

    Args:
        room: The room dict.
        spectator_id: ID of the spectator to promote.

    Returns:
        Updated room dict with the spectator moved to players. Raises ValueError if room is full.
    """
    if len(room.get("players", [])) >= room.get("max_players", 0):
        raise ValueError("No open seats")
    spectators = room.get("spectators", [])
    if spectator_id in spectators:
        spectators.remove(spectator_id)
    room.setdefault("players", []).append(spectator_id)
    return room


def set_house_rules(room: dict, host_id: str, rules: dict) -> dict:
    """Update the house rules for a room (host only).

    Args:
        room: The room dict.
        host_id: ID of the user attempting to change rules (must be host).
        rules: Dict of rule_key -> rule_value overrides.

    Returns:
        Updated room dict with house rules applied. Raises ValueError if not host.
    """
    if str(room.get("host_id")) != str(host_id):
        raise ValueError("Only the host can change house rules")
    room["house_rules"] = rules
    return room


def kick_vote(room: dict, voter_id: str, target_id: str, kick_votes: dict) -> dict:
    """Cast a vote to kick a player from the room.

    Args:
        room: The room dict (used to check player count for threshold).
        voter_id: ID of the voting player.
        target_id: ID of the player to kick.
        kick_votes: Mutable dict of target_id -> list of voter IDs.

    Returns:
        Updated kick_votes dict. Includes 'should_kick' bool if threshold met.
    """
    kick_votes.setdefault(target_id, [])
    if voter_id not in kick_votes[target_id]:
        kick_votes[target_id].append(voter_id)
    player_count = len(room.get("players", []))
    threshold = max(2, player_count // 2 + 1)
    kick_votes["should_kick"] = len(kick_votes[target_id]) >= threshold
    return kick_votes


def rematch_request(room: dict, requester_id: str, rematch_votes: list) -> dict:
    """Record a rematch request from a player.

    Args:
        room: The room dict.
        requester_id: ID of the player requesting a rematch.
        rematch_votes: Mutable list of player IDs who voted for rematch.

    Returns:
        Updated rematch_votes list.
    """
    if requester_id not in rematch_votes:
        rematch_votes.append(requester_id)
    return rematch_votes


def accept_rematch(room: dict, player_id: str, rematch_votes: list) -> dict:
    """Accept a rematch request (alias for rematch_request for semantic clarity).

    Args:
        room: The room dict.
        player_id: ID of the player accepting.
        rematch_votes: Mutable list of player IDs who voted for rematch.

    Returns:
        Updated rematch_votes list.
    """
    return rematch_request(room, player_id, rematch_votes)


def bot_fill_player(room: dict, seat_index: int) -> dict:
    """Fill an empty seat with a bot player.

    Args:
        room: The room dict.
        seat_index: The seat index (0-based) to fill with a bot.

    Returns:
        Updated room dict with a bot entry added at the given seat index.
    """
    bot_id = f"bot_{seat_index}"
    bots = room.setdefault("bots", {})
    bots[str(seat_index)] = {"bot_id": bot_id, "name": f"Bot {seat_index + 1}"}
    return room


def host_migration(room: dict, old_host_id: str, new_host_id: str) -> dict:
    """Transfer host privileges to a new player.

    Args:
        room: The room dict.
        old_host_id: ID of the current host (validated by caller).
        new_host_id: ID of the player receiving host privileges.

    Returns:
        Updated room dict with host_id changed. Raises ValueError if new host is not in room.
    """
    if new_host_id not in room.get("players", []):
        raise ValueError("New host must be a player in the room")
    room["host_id"] = new_host_id
    room.setdefault("action_log", []).append({
        "event": "host_migration",
        "from": old_host_id,
        "to": new_host_id,
        "timestamp": time.time(),
    })
    return room
