// WarAI.js — bot configuration for the War game.
//
// War has no strategy: the winning card is determined entirely by the shuffled
// deck order. The "bot" is just the server resolving the second player's draw
// inside the human player's playCard move (see War.js).
//
// This file exists to centralize bot-related constants and to document where
// future AI improvements would go if War were extended with optional rules
// (e.g., "declare war voluntarily" variants).

// Milliseconds the UI waits before revealing the bot's card.
// This is a pure UX delay — it does not affect server-side timing.
export const BOT_DELAY_MS = 700;

// Milliseconds before the round result is shown after both cards flip.
export const RESULT_DELAY_MS = 1200;

// Label shown for the bot player in all UI components.
export const BOT_DISPLAY_NAME = 'The House';
