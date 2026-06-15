# ── REGISTRATION ─────────────────────────────────────────────────────────────
#
# To register this Blueprint on the Flask app, add ONE line to
# backend/main_server/main.py, immediately after the existing Blueprint
# registrations:
#
#     from shared_handlers.api_routes import shared_handlers_bp
#     app.register_blueprint(shared_handlers_bp)
#
# All routes will then be available under the /shared prefix.
#
# ─────────────────────────────────────────────────────────────────────────────

from flask import Blueprint, request, jsonify

from .social import (
    send_chat_message,
    send_emoji_reaction,
    send_quick_phrase,
    mute_player,
    report_player,
    block_player,
    send_spectator_chat,
)
from .lobby import (
    create_room as _create_room,
    join_room as _join_room,
    leave_room as _leave_room,
    ready_up as _ready_up,
    spectate_game,
    promote_spectator,
    set_house_rules,
    kick_vote,
    rematch_request,
    accept_rematch,
    bot_fill_player,
    host_migration,
)

shared_handlers_bp = Blueprint("shared_handlers", __name__, url_prefix="/shared")

# ── In-memory stores (mirrors rooms.py pattern; swap for DB in production) ──

_chat_logs: dict = {}        # room_id -> list[entry]
_reaction_logs: dict = {}    # room_id -> list[entry]
_spectator_logs: dict = {}   # room_id -> list[entry]
_mute_lists: dict = {}       # player_id -> list[player_id]
_block_lists: dict = {}      # player_id -> list[player_id]
_reports: list = []
_rooms: dict = {}            # room_id -> room dict (shared_handlers own copy)
_kick_votes: dict = {}       # room_id -> {target_id: [voter_ids]}
_rematch_votes: dict = {}    # room_id -> list[player_id]


# ── Social routes ─────────────────────────────────────────────────────────────

@shared_handlers_bp.route("/chat/message", methods=["POST"])
def route_send_chat_message():
    """POST /shared/chat/message — Send a chat message to a room."""
    data = request.get_json(force=True) or {}
    player_id = data.get("player_id")
    message = data.get("message", "")
    room_id = data.get("room_id")
    if not all([player_id, room_id]):
        return jsonify({"message": "player_id and room_id are required"}), 400
    log = _chat_logs.setdefault(room_id, [])
    entry = send_chat_message(player_id, message, room_id, log)
    return jsonify({"entry": entry}), 201


@shared_handlers_bp.route("/chat/emoji", methods=["POST"])
def route_send_emoji_reaction():
    """POST /shared/chat/emoji — Broadcast an emoji reaction."""
    data = request.get_json(force=True) or {}
    player_id = data.get("player_id")
    emoji = data.get("emoji", "")
    room_id = data.get("room_id")
    if not all([player_id, room_id]):
        return jsonify({"message": "player_id and room_id are required"}), 400
    log = _reaction_logs.setdefault(room_id, [])
    entry = send_emoji_reaction(player_id, emoji, room_id, log)
    return jsonify({"entry": entry}), 201


@shared_handlers_bp.route("/chat/quick_phrase", methods=["POST"])
def route_send_quick_phrase():
    """POST /shared/chat/quick_phrase — Send a predefined quick phrase."""
    data = request.get_json(force=True) or {}
    player_id = data.get("player_id")
    phrase_key = data.get("phrase_key", "")
    room_id = data.get("room_id")
    if not all([player_id, room_id]):
        return jsonify({"message": "player_id and room_id are required"}), 400
    log = _chat_logs.setdefault(room_id, [])
    entry = send_quick_phrase(player_id, phrase_key, room_id, log)
    return jsonify({"entry": entry}), 201


@shared_handlers_bp.route("/chat/spectator", methods=["POST"])
def route_send_spectator_chat():
    """POST /shared/chat/spectator — Send a spectator-only chat message."""
    data = request.get_json(force=True) or {}
    spectator_id = data.get("spectator_id")
    message = data.get("message", "")
    room_id = data.get("room_id")
    if not all([spectator_id, room_id]):
        return jsonify({"message": "spectator_id and room_id are required"}), 400
    log = _spectator_logs.setdefault(room_id, [])
    entry = send_spectator_chat(spectator_id, message, room_id, log)
    return jsonify({"entry": entry}), 201


@shared_handlers_bp.route("/moderation/mute", methods=["POST"])
def route_mute_player():
    """POST /shared/moderation/mute — Add a player to the requester's mute list."""
    data = request.get_json(force=True) or {}
    requester_id = data.get("requester_id")
    target_id = data.get("target_id")
    if not all([requester_id, target_id]):
        return jsonify({"message": "requester_id and target_id are required"}), 400
    mute_player(requester_id, target_id, _mute_lists)
    return jsonify({"message": "Player muted"}), 200


@shared_handlers_bp.route("/moderation/report", methods=["POST"])
def route_report_player():
    """POST /shared/moderation/report — File a report against a player."""
    data = request.get_json(force=True) or {}
    reporter_id = data.get("reporter_id")
    reported_id = data.get("reported_id")
    reason = data.get("reason", "")
    if not all([reporter_id, reported_id]):
        return jsonify({"message": "reporter_id and reported_id are required"}), 400
    entry = report_player(reporter_id, reported_id, reason, _reports)
    return jsonify({"report": entry}), 201


@shared_handlers_bp.route("/moderation/block", methods=["POST"])
def route_block_player():
    """POST /shared/moderation/block — Add a player to the requester's block list."""
    data = request.get_json(force=True) or {}
    requester_id = data.get("requester_id")
    target_id = data.get("target_id")
    if not all([requester_id, target_id]):
        return jsonify({"message": "requester_id and target_id are required"}), 400
    block_player(requester_id, target_id, _block_lists)
    return jsonify({"message": "Player blocked"}), 200


# ── Lobby routes ──────────────────────────────────────────────────────────────

@shared_handlers_bp.route("/lobby/create", methods=["POST"])
def route_create_room():
    """POST /shared/lobby/create — Create a new lobby room."""
    data = request.get_json(force=True) or {}
    host_id = data.get("host_id")
    game_name = data.get("game_name", "unknown")
    max_players = int(data.get("max_players", 2))
    house_rules = data.get("house_rules", {})
    if not host_id:
        return jsonify({"message": "host_id is required"}), 400
    room = _create_room(_rooms, host_id, game_name, max_players, house_rules)
    return jsonify({"room": room}), 201


@shared_handlers_bp.route("/lobby/<room_id>/join", methods=["POST"])
def route_join_room(room_id):
    """POST /shared/lobby/<room_id>/join — Join an existing lobby room."""
    room = _rooms.get(room_id)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    data = request.get_json(force=True) or {}
    player_id = data.get("player_id")
    if not player_id:
        return jsonify({"message": "player_id is required"}), 400
    try:
        room = _join_room(room, player_id)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    return jsonify({"room": room}), 200


@shared_handlers_bp.route("/lobby/<room_id>/leave", methods=["POST"])
def route_leave_room(room_id):
    """POST /shared/lobby/<room_id>/leave — Leave a lobby room."""
    room = _rooms.get(room_id)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    data = request.get_json(force=True) or {}
    player_id = data.get("player_id")
    if not player_id:
        return jsonify({"message": "player_id is required"}), 400
    room = _leave_room(room, player_id)
    return jsonify({"room": room}), 200


@shared_handlers_bp.route("/lobby/<room_id>/ready", methods=["POST"])
def route_ready_up(room_id):
    """POST /shared/lobby/<room_id>/ready — Toggle ready state."""
    room = _rooms.get(room_id)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    data = request.get_json(force=True) or {}
    player_id = data.get("player_id")
    ready = bool(data.get("ready", True))
    if not player_id:
        return jsonify({"message": "player_id is required"}), 400
    room = _ready_up(room, player_id, ready)
    return jsonify({"room": room}), 200


@shared_handlers_bp.route("/lobby/<room_id>/spectate", methods=["POST"])
def route_spectate(room_id):
    """POST /shared/lobby/<room_id>/spectate — Join as a spectator."""
    room = _rooms.get(room_id)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    data = request.get_json(force=True) or {}
    spectator_id = data.get("spectator_id")
    if not spectator_id:
        return jsonify({"message": "spectator_id is required"}), 400
    room = spectate_game(room, spectator_id)
    return jsonify({"room": room}), 200


@shared_handlers_bp.route("/lobby/<room_id>/promote_spectator", methods=["POST"])
def route_promote_spectator(room_id):
    """POST /shared/lobby/<room_id>/promote_spectator — Promote spectator to player."""
    room = _rooms.get(room_id)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    data = request.get_json(force=True) or {}
    spectator_id = data.get("spectator_id")
    if not spectator_id:
        return jsonify({"message": "spectator_id is required"}), 400
    try:
        room = promote_spectator(room, spectator_id)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    return jsonify({"room": room}), 200


@shared_handlers_bp.route("/lobby/<room_id>/house_rules", methods=["POST"])
def route_set_house_rules(room_id):
    """POST /shared/lobby/<room_id>/house_rules — Update room's house rules."""
    room = _rooms.get(room_id)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    data = request.get_json(force=True) or {}
    host_id = data.get("host_id")
    rules = data.get("rules", {})
    if not host_id:
        return jsonify({"message": "host_id is required"}), 400
    try:
        room = set_house_rules(room, host_id, rules)
    except ValueError as e:
        return jsonify({"message": str(e)}), 403
    return jsonify({"room": room}), 200


@shared_handlers_bp.route("/lobby/<room_id>/kick_vote", methods=["POST"])
def route_kick_vote(room_id):
    """POST /shared/lobby/<room_id>/kick_vote — Cast a vote to kick a player."""
    room = _rooms.get(room_id)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    data = request.get_json(force=True) or {}
    voter_id = data.get("voter_id")
    target_id = data.get("target_id")
    if not all([voter_id, target_id]):
        return jsonify({"message": "voter_id and target_id are required"}), 400
    votes = _kick_votes.setdefault(room_id, {})
    result = kick_vote(room, voter_id, target_id, votes)
    return jsonify({"kick_votes": result}), 200


@shared_handlers_bp.route("/lobby/<room_id>/rematch", methods=["POST"])
def route_rematch_request(room_id):
    """POST /shared/lobby/<room_id>/rematch — Request or accept a rematch."""
    room = _rooms.get(room_id)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    data = request.get_json(force=True) or {}
    player_id = data.get("player_id")
    if not player_id:
        return jsonify({"message": "player_id is required"}), 400
    votes = _rematch_votes.setdefault(room_id, [])
    rematch_request(room, player_id, votes)
    all_agreed = len(votes) >= len(room.get("players", []))
    return jsonify({"votes": votes, "all_agreed": all_agreed}), 200


@shared_handlers_bp.route("/lobby/<room_id>/bot_fill", methods=["POST"])
def route_bot_fill(room_id):
    """POST /shared/lobby/<room_id>/bot_fill — Fill a seat with a bot."""
    room = _rooms.get(room_id)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    data = request.get_json(force=True) or {}
    seat_index = data.get("seat_index", 0)
    room = bot_fill_player(room, int(seat_index))
    return jsonify({"room": room}), 200


@shared_handlers_bp.route("/lobby/<room_id>/host_migration", methods=["POST"])
def route_host_migration(room_id):
    """POST /shared/lobby/<room_id>/host_migration — Transfer host role."""
    room = _rooms.get(room_id)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    data = request.get_json(force=True) or {}
    old_host_id = data.get("old_host_id")
    new_host_id = data.get("new_host_id")
    if not all([old_host_id, new_host_id]):
        return jsonify({"message": "old_host_id and new_host_id are required"}), 400
    try:
        room = host_migration(room, old_host_id, new_host_id)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    return jsonify({"room": room}), 200
