// useBoardEventHandlers — the event handler layer for physical card interactions
// (drag-drop, tap-to-select-then-tap-to-play, deck click, end turn).
//
// This extends the existing shared_handlers layer rather than replacing it: it
// dispatches through the same abstract handler bag GenericBoard already builds
// from useCardInteractions/useTurnRound (so per-game moveOverrides still apply),
// and only adds the zone-routing logic needed by the drag/drop primitives.
//
// Usage:
//   const handlers = useBoardEventHandlers({ G, ctx, moves, playerID }, { handlers: composedHandlers });

import { useCallback, useState } from 'react';

// Key is `${sourceZoneType}→${targetZoneType}`; value is a key into the
// abstract handler bag (the same names GenericBoard's baseHandlers exposes).
const DEFAULT_MOVE_MAP = {
  'hand→play': 'playCard',
  'hand→discard': 'discardCard',
  'deck→hand': 'drawCard',
  'pile→hand': 'discardCard',
  'hand→slot': 'playCard',
};

export function useBoardEventHandlers(props = {}, options = {}) {
  const { ctx, playerID } = props;
  const handlers = options.handlers || {};
  const moveMap = { ...DEFAULT_MOVE_MAP, ...(options.moveMap || {}) };

  const [selectedCardId, setSelectedCardId] = useState(null);

  const dispatchMove = useCallback((sourceZoneType, targetZoneType, cardId, sourceZoneId, targetZoneId) => {
    const moveName = moveMap[`${sourceZoneType}→${targetZoneType}`];
    const fn = moveName && handlers[moveName];
    if (typeof fn !== 'function') {
      return;
    }
    fn(playerID, cardId, sourceZoneId, targetZoneId);
  }, [handlers, moveMap, playerID]);

  const handleCardDrop = useCallback(({ cardId, sourceZoneId, targetZoneId, sourceZoneType, targetZoneType }) => {
    dispatchMove(
      sourceZoneType || sourceZoneId,
      targetZoneType || targetZoneId,
      cardId,
      sourceZoneId,
      targetZoneId,
    );
    setSelectedCardId(null);
  }, [dispatchMove]);

  const handleCardClick = useCallback(({ cardId, zoneId, zoneType }) => {
    if (!zoneType || zoneType === 'hand') {
      setSelectedCardId((prev) => (prev === cardId ? null : cardId));
      return;
    }
    if (selectedCardId) {
      handleCardDrop({
        cardId: selectedCardId,
        sourceZoneId: `hand-${playerID}`,
        targetZoneId: zoneId,
        sourceZoneType: 'hand',
        targetZoneType: zoneType,
      });
    }
  }, [selectedCardId, handleCardDrop, playerID]);

  const handleZoneClick = useCallback(({ zoneId, zoneType }) => {
    if (!selectedCardId) return;
    handleCardDrop({
      cardId: selectedCardId,
      sourceZoneId: `hand-${playerID}`,
      targetZoneId: zoneId,
      sourceZoneType: 'hand',
      targetZoneType: zoneType,
    });
  }, [selectedCardId, handleCardDrop, playerID]);

  // Route deck clicks through the moveMap so per-game configs can remap
  // 'deck→hand' (e.g. War overrides it to 'playCard' instead of 'drawCard').
  const handleDeckClick = useCallback((deckId) => {
    dispatchMove('deck', 'hand', undefined, deckId, undefined);
  }, [dispatchMove]);

  const handleEndTurn = useCallback(() => {
    if (ctx?.events?.endTurn) {
      ctx.events.endTurn();
      return;
    }
    handlers.endTurn?.(playerID);
  }, [ctx, handlers, playerID]);

  return {
    handleCardDrop,
    handleCardClick,
    handleZoneClick,
    handleDeckClick,
    handleEndTurn,
    selectedCardId,
    setSelectedCardId,
  };
}
