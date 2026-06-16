// useCardInteraction — centralizes HTML5 drag/drop/hover/click wiring so every
// card primitive (Card, Hand, Deck, Pile, PlayZone, CardSlot) shares the same
// logic instead of each one reimplementing dataTransfer parsing.
//
// Usage:
//   const { dragHandlers, dropHandlers, hoverHandlers, isDragging, isOver, isHovered } =
//     useCardInteraction({ cardId, sourceZoneId, isDropTarget, onDrop, onClick, disabled });

import { useCallback, useState } from 'react';

const PAYLOAD_TYPE = 'application/json';

export function useCardInteraction({
  cardId,
  sourceZoneId,
  isDropTarget = false,
  onDrop,
  onClick,
  disabled = false,
} = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const onDragStart = useCallback((e) => {
    if (disabled) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(PAYLOAD_TYPE, JSON.stringify({ cardId, sourceZoneId }));
    setIsDragging(true);
  }, [cardId, sourceZoneId, disabled]);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e) => {
    if (disabled || !isDropTarget) return;
    e.preventDefault();
    setIsOver(true);
  }, [disabled, isDropTarget]);

  const onDragLeave = useCallback(() => {
    setIsOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    if (disabled || !isDropTarget) return;
    e.preventDefault();
    setIsOver(false);

    let payload;
    try {
      payload = JSON.parse(e.dataTransfer.getData(PAYLOAD_TYPE));
    } catch {
      return;
    }
    if (!payload || payload.cardId == null) return;

    onDrop?.({ ...payload, targetZoneId: sourceZoneId });
  }, [disabled, isDropTarget, onDrop, sourceZoneId]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick?.({ cardId, sourceZoneId });
  }, [disabled, onClick, cardId, sourceZoneId]);

  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);

  return {
    dragHandlers: { draggable: !disabled, onDragStart, onDragEnd },
    dropHandlers: { onDragOver, onDragLeave, onDrop: handleDrop },
    hoverHandlers: { onMouseEnter, onMouseLeave },
    clickHandlers: { onClick: handleClick },
    isDragging,
    isOver,
    isHovered,
  };
}
