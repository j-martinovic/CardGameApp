// RoomsAPI.js — client-side wrapper for Flask /rooms endpoints.
// Flask runs on port 5000 (VITE_FLASK_API_URL).

const FLASK_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5000';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${FLASK_URL}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(json.message || `HTTP ${res.status}`), { status: res.status, data: json });
  }
  return json;
}

export function createRoom(userId, userName, gameName, maxPlayers, minPlayers = 2) {
  return request('POST', '/rooms/create', {
    user_id: userId,
    user_name: userName,
    game_name: gameName,
    max_players: maxPlayers,
    min_players: minPlayers,
  });
}

export function joinRoom(roomId, userId, userName) {
  return request('POST', `/rooms/${roomId}/join`, { user_id: userId, user_name: userName });
}

export function leaveRoom(roomId, userId) {
  return request('POST', `/rooms/${roomId}/leave`, { user_id: userId });
}

export function setReady(roomId, userId, ready) {
  return request('POST', `/rooms/${roomId}/ready`, { user_id: userId, ready });
}

export function getRoom(roomId) {
  return request('GET', `/rooms/${roomId}`);
}

export function getRoomByCode(roomCode) {
  return request('GET', `/rooms/code/${roomCode.toUpperCase()}`);
}

export function startRoom(roomId, userId) {
  return request('POST', `/rooms/${roomId}/start`, { user_id: userId });
}

export function setRoomMatch(roomId, userId, bgioMatchId) {
  return request('POST', `/rooms/${roomId}/set_match`, { user_id: userId, bgio_match_id: bgioMatchId });
}

export function listOpenRooms() {
  return request('GET', '/rooms');
}
