// useSocial — shared hook for chat, emoji, and moderation actions.
//
// These actions are side effects on the Flask backend (not boardgame.io moves).
// Usage:
//   const { sendChatMessage, sendEmojiReaction, mutePlayer, ... } = useSocial(roomID);

import { SHARED_API_BASE } from './config.js';

async function post(path, body) {
  const res = await fetch(`${SHARED_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.message || `HTTP ${res.status}`), { data: json });
  return json;
}

/**
 * @param {string} roomID — the room this hook is scoped to
 * @returns {object}      — named async handler functions
 */
export function useSocial(roomID) {
  return {
    /** Send a chat message to the room. */
    sendChatMessage: (playerID, message) =>
      post('/chat/message', { player_id: playerID, message, room_id: roomID }),

    /** Broadcast an emoji reaction. */
    sendEmojiReaction: (playerID, emoji) =>
      post('/chat/emoji', { player_id: playerID, emoji, room_id: roomID }),

    /** Send a predefined quick phrase. */
    sendQuickPhrase: (playerID, phraseKey) =>
      post('/chat/quick_phrase', { player_id: playerID, phrase_key: phraseKey, room_id: roomID }),

    /** Add a player to the requester's personal mute list. */
    mutePlayer: (requesterID, targetID) =>
      post('/moderation/mute', { requester_id: requesterID, target_id: targetID }),

    /** File a report against a player for moderator review. */
    reportPlayer: (reporterID, reportedID, reason) =>
      post('/moderation/report', { reporter_id: reporterID, reported_id: reportedID, reason }),

    /** Add a player to the requester's block list. */
    blockPlayer: (requesterID, targetID) =>
      post('/moderation/block', { requester_id: requesterID, target_id: targetID }),

    /** Send a message visible only in the spectator chat channel. */
    sendSpectatorChat: (spectatorID, message) =>
      post('/chat/spectator', { spectator_id: spectatorID, message, room_id: roomID }),
  };
}
