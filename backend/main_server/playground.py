# playground.py — stores custom game rule definitions.
# Games are stored in SQLite (new table: custom_games).
# Also supports session-only games that are never persisted.

import json
import time
import uuid
from flask import Blueprint, request, jsonify
from config import db

playground_bp = Blueprint('playground', __name__, url_prefix='/playground')

# Session-only games (not persisted to DB).
_session_games = {}


class CustomGame(db.Model):
    __tablename__ = 'custom_games'
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.String(36), unique=True, nullable=False)
    creator_user_id = db.Column(db.Integer, nullable=True)
    game_name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    rules_json = db.Column(db.Text, nullable=False)
    is_public = db.Column(db.Boolean, default=False)
    play_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.Float, nullable=False)
    updated_at = db.Column(db.Float, nullable=False)

    def to_json(self):
        return {
            'gameId': self.game_id,
            'creatorUserId': self.creator_user_id,
            'gameName': self.game_name,
            'description': self.description,
            'rules': json.loads(self.rules_json),
            'isPublic': self.is_public,
            'playCount': self.play_count,
            'createdAt': self.created_at,
            'updatedAt': self.updated_at,
        }


@playground_bp.route('/games', methods=['POST'])
def save_game():
    data = request.get_json(force=True) or {}
    rules = data.get('rules', {})
    creator_user_id = data.get('creator_user_id')
    save_to_db = bool(data.get('save_to_db', False))
    is_public = bool(data.get('is_public', False))

    game_id = str(uuid.uuid4())
    game_name = rules.get('gameName') or 'My Custom Game'
    description = rules.get('gameDescription', '')
    now = time.time()

    if save_to_db:
        with db.session.begin():
            game = CustomGame(
                game_id=game_id,
                creator_user_id=creator_user_id,
                game_name=game_name,
                description=description,
                rules_json=json.dumps(rules),
                is_public=is_public,
                play_count=0,
                created_at=now,
                updated_at=now,
            )
            db.session.add(game)
        message = 'Game saved to database'
    else:
        _session_games[game_id] = {
            'game_id': game_id,
            'creator_user_id': creator_user_id,
            'game_name': game_name,
            'description': description,
            'rules': rules,
            'is_public': False,
            'play_count': 0,
            'created_at': now,
            'updated_at': now,
        }
        message = 'Game saved to session'

    return jsonify({'game_id': game_id, 'game_name': game_name, 'message': message}), 201


@playground_bp.route('/games/<game_id>', methods=['GET'])
def get_game(game_id):
    if game_id in _session_games:
        return jsonify(_session_games[game_id]), 200

    game = CustomGame.query.filter_by(game_id=game_id).first()
    if not game:
        return jsonify({'message': 'Game not found'}), 404
    return jsonify(game.to_json()), 200


@playground_bp.route('/games/<game_id>', methods=['PUT'])
def update_game(game_id):
    data = request.get_json(force=True) or {}
    rules = data.get('rules', {})
    user_id = data.get('user_id')

    if game_id in _session_games:
        entry = _session_games[game_id]
        if entry['creator_user_id'] is not None and str(entry['creator_user_id']) != str(user_id):
            return jsonify({'message': 'Not authorized'}), 403
        entry['rules'] = rules
        entry['game_name'] = rules.get('gameName', entry['game_name'])
        entry['description'] = rules.get('gameDescription', entry['description'])
        entry['updated_at'] = time.time()
        return jsonify({'game_id': game_id, 'message': 'Updated'}), 200

    game = CustomGame.query.filter_by(game_id=game_id).first()
    if not game:
        return jsonify({'message': 'Game not found'}), 404
    if game.creator_user_id is not None and str(game.creator_user_id) != str(user_id):
        return jsonify({'message': 'Not authorized'}), 403

    game.rules_json = json.dumps(rules)
    game.game_name = rules.get('gameName', game.game_name)
    game.description = rules.get('gameDescription', game.description)
    game.updated_at = time.time()
    db.session.commit()
    return jsonify({'game_id': game_id, 'message': 'Updated'}), 200


@playground_bp.route('/games/<game_id>', methods=['DELETE'])
def delete_game(game_id):
    data = request.get_json(force=True) or {}
    user_id = data.get('user_id')

    if game_id in _session_games:
        del _session_games[game_id]
        return jsonify({'message': 'Deleted'}), 200

    game = CustomGame.query.filter_by(game_id=game_id).first()
    if not game:
        return jsonify({'message': 'Game not found'}), 404
    if game.creator_user_id is not None and str(game.creator_user_id) != str(user_id):
        return jsonify({'message': 'Not authorized'}), 403

    db.session.delete(game)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200


@playground_bp.route('/games', methods=['GET'])
def list_games():
    public_only = request.args.get('public', 'false').lower() == 'true'
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))

    query = CustomGame.query
    if public_only:
        query = query.filter_by(is_public=True)

    total = query.count()
    games = query.order_by(CustomGame.created_at.desc()).offset(offset).limit(limit).all()
    return jsonify({'games': [g.to_json() for g in games], 'total': total}), 200


@playground_bp.route('/games/<game_id>/play', methods=['POST'])
def record_play(game_id):
    game = CustomGame.query.filter_by(game_id=game_id).first()
    if game:
        game.play_count += 1
        db.session.commit()
    return jsonify({'message': 'Play recorded'}), 200
