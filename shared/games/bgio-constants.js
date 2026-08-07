// Local copy of boardgame.io's INVALID_MOVE constant so the shared game
// definitions have zero package dependencies — this folder is imported by both
// the Node game server and the Vite frontend, which each have their own
// node_modules. The value is part of boardgame.io's public API and stable:
// returning this string from a move tells the framework to reject the move.
export const INVALID_MOVE = 'INVALID_MOVE';
