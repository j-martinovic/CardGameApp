// PlaygroundAPI.js — thin fetch wrapper over Flask /playground endpoints.

const FLASK_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5000';

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${FLASK_URL}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(json.message || `HTTP ${res.status}`), { status: res.status, data: json });
  }
  return json;
}

export function saveGame(rules, creatorUserId = null, saveToDB = false, isPublic = false) {
  return request('POST', '/playground/games', {
    rules,
    creator_user_id: creatorUserId,
    save_to_db: saveToDB,
    is_public: isPublic,
  });
}

export function loadGame(gameId) {
  return request('GET', `/playground/games/${gameId}`);
}

export function updateGame(gameId, rules, userId) {
  return request('PUT', `/playground/games/${gameId}`, { rules, user_id: userId });
}

export function deleteGame(gameId, userId) {
  return request('DELETE', `/playground/games/${gameId}`, { user_id: userId });
}

export function listPublicGames(limit = 20, offset = 0) {
  return request('GET', `/playground/games?public=true&limit=${limit}&offset=${offset}`);
}

export function recordPlay(gameId) {
  return request('POST', `/playground/games/${gameId}/play`);
}
