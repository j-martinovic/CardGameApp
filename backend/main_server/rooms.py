# rooms.py — In-memory room/lobby system for real-time multiplayer.
# Rooms bridge Flask auth (user IDs) with boardgame.io match IDs.
# This file is a Flask Blueprint registered in main.py.

import time
import uuid
import string
import random
from flask import Blueprint, request, jsonify
from config import db
from models import User

rooms_bp = Blueprint('rooms', __name__, url_prefix='/rooms')

# Module-level in-memory store. Cleared on server restart.
_rooms = {}


def _generate_room_code():
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(chars, k=4))
        if not any(r['room_code'] == code for r in _rooms.values()):
            return code


def _is_guest(user_id):
    return isinstance(user_id, str) and str(user_id).startswith('guest_')


def _validate_user(user_id):
    """Returns True if user exists or is a guest. Returns False if real ID not found."""
    if _is_guest(user_id):
        return True
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        return False
    return User.query.get(uid) is not None


def _room_summary(room):
    return {
        'room_id': room['room_id'],
        'room_code': room['room_code'],
        'game_name': room['game_name'],
        'player_count': len(room['players']),
        'max_players': room['max_players'],
        'status': room['status'],
    }


@rooms_bp.route('/create', methods=['POST'])
def create_room():
    data = request.get_json(force=True) or {}
    user_id = data.get('user_id')
    user_name = data.get('user_name', 'Player')
    game_name = data.get('game_name', 'war')
    max_players = int(data.get('max_players', 2))
    min_players = int(data.get('min_players', 2))

    if user_id is None:
        return jsonify({'message': 'user_id is required'}), 400

    if not _validate_user(user_id):
        return jsonify({'message': 'User not found'}), 404

    room_id = str(uuid.uuid4())
    room_code = _generate_room_code()

    room = {
        'room_id': room_id,
        'game_name': game_name,
        'host_user_id': user_id,
        'players': [
            {
                'user_id': user_id,
                'user_name': user_name,
                'ready': False,
                'player_index': 0,
                'bgio_player_id': '0',
            }
        ],
        'max_players': max_players,
        'min_players': min_players,
        'status': 'waiting',
        'bgio_match_id': None,
        'created_at': time.time(),
        'room_code': room_code,
    }

    _rooms[room_id] = room
    return jsonify({'room_id': room_id, 'room_code': room_code, 'room': room}), 201


@rooms_bp.route('/<room_id>/join', methods=['POST'])
def join_room(room_id):
    room = _rooms.get(room_id)
    if not room:
        return jsonify({'message': 'Room not found'}), 404

    data = request.get_json(force=True) or {}
    user_id = data.get('user_id')
    user_name = data.get('user_name', 'Player')

    if user_id is None:
        return jsonify({'message': 'user_id is required'}), 400

    if room['status'] != 'waiting':
        return jsonify({'message': 'Room is not accepting players'}), 400

    if len(room['players']) >= room['max_players']:
        return jsonify({'message': 'Room is full'}), 400

    if any(str(p['user_id']) == str(user_id) for p in room['players']):
        return jsonify({'message': 'Already in room'}), 400

    if not _validate_user(user_id):
        return jsonify({'message': 'User not found'}), 404

    player_index = len(room['players'])
    room['players'].append({
        'user_id': user_id,
        'user_name': user_name,
        'ready': False,
        'player_index': player_index,
        'bgio_player_id': str(player_index),
    })

    return jsonify({'room': room, 'player_index': player_index}), 200


@rooms_bp.route('/<room_id>/leave', methods=['POST'])
def leave_room(room_id):
    room = _rooms.get(room_id)
    if not room:
        return jsonify({'message': 'Room not found'}), 404

    data = request.get_json(force=True) or {}
    user_id = data.get('user_id')

    if user_id is None:
        return jsonify({'message': 'user_id is required'}), 400

    room['players'] = [p for p in room['players'] if str(p['user_id']) != str(user_id)]

    if not room['players']:
        del _rooms[room_id]
        return jsonify({'message': 'Room deleted (last player left)'}), 200

    if str(room['host_user_id']) == str(user_id):
        room['host_user_id'] = room['players'][0]['user_id']

    # Re-index remaining players
    for i, p in enumerate(room['players']):
        p['player_index'] = i
        p['bgio_player_id'] = str(i)

    return jsonify({'message': 'Left room', 'room': room}), 200


@rooms_bp.route('/<room_id>/ready', methods=['POST'])
def set_ready(room_id):
    room = _rooms.get(room_id)
    if not room:
        return jsonify({'message': 'Room not found'}), 404

    data = request.get_json(force=True) or {}
    user_id = data.get('user_id')
    ready = bool(data.get('ready', True))

    for p in room['players']:
        if str(p['user_id']) == str(user_id):
            p['ready'] = ready
            return jsonify({'room': room}), 200

    return jsonify({'message': 'Player not in room'}), 404


@rooms_bp.route('/<room_id>', methods=['GET'])
def get_room(room_id):
    room = _rooms.get(room_id)
    if not room:
        return jsonify({'message': 'Room not found'}), 404
    return jsonify({'room': room}), 200


@rooms_bp.route('/code/<room_code>', methods=['GET'])
def get_room_by_code(room_code):
    code = room_code.upper()
    for room in _rooms.values():
        if room['room_code'] == code:
            return jsonify({'room_id': room['room_id'], 'room': room}), 200
    return jsonify({'message': 'Room not found'}), 404


@rooms_bp.route('/<room_id>/start', methods=['POST'])
def start_room(room_id):
    room = _rooms.get(room_id)
    if not room:
        return jsonify({'message': 'Room not found'}), 404

    data = request.get_json(force=True) or {}
    user_id = data.get('user_id')

    if str(room['host_user_id']) != str(user_id):
        return jsonify({'message': 'Only the host can start the game'}), 403

    if len(room['players']) < room['min_players']:
        return jsonify({'message': f"Need at least {room['min_players']} players"}), 400

    if not all(p['ready'] for p in room['players']):
        return jsonify({'message': 'All players must be ready'}), 400

    room['status'] = 'starting'
    return jsonify({'room': room, 'bgio_match_id': None}), 200


@rooms_bp.route('/<room_id>/set_match', methods=['POST'])
def set_match(room_id):
    room = _rooms.get(room_id)
    if not room:
        return jsonify({'message': 'Room not found'}), 404

    data = request.get_json(force=True) or {}
    user_id = data.get('user_id')
    bgio_match_id = data.get('bgio_match_id')

    if str(room['host_user_id']) != str(user_id):
        return jsonify({'message': 'Only the host can set the match ID'}), 403

    room['bgio_match_id'] = bgio_match_id
    room['status'] = 'in_progress'
    return jsonify({'room': room}), 200


@rooms_bp.route('/cleanup', methods=['POST'])
def cleanup_rooms():
    cutoff = time.time() - 7200  # 2 hours
    to_delete = [rid for rid, r in _rooms.items() if r['created_at'] < cutoff]
    for rid in to_delete:
        del _rooms[rid]
    return jsonify({'deleted_count': len(to_delete)}), 200


@rooms_bp.route('', methods=['GET'])
def list_rooms():
    open_rooms = [
        _room_summary(r)
        for r in _rooms.values()
        if r['status'] == 'waiting'
    ]
    return jsonify({'rooms': open_rooms}), 200
