// Barrel export for all shared handler hooks.
//
// Usage:
//   import { useCardInteractions, useBetting, useTurnRound } from '@/shared_handlers';
//   // or with a relative path:
//   import { useCardInteractions } from '../shared_handlers';

export { useCardInteractions } from './useCardInteractions.js';
export { useBetting }          from './useBetting.js';
export { useTurnRound }        from './useTurnRound.js';
export { usePlayerActions }    from './usePlayerActions.js';
export { useSocial }           from './useSocial.js';
export { useLobby }            from './useLobby.js';
export { useBridgeSpecific }   from './useBridgeSpecific.js';
export { useEuchreSpecific }   from './useEuchreSpecific.js';
export { usePokerSpecific }    from './usePokerSpecific.js';
export { useScoring }          from './useScoring.js';
export { useDebug }            from './useDebug.js';

// Config constants — re-exported so games can read them without importing config directly.
export { API_BASE_URL, SHARED_API_BASE } from './config.js';
