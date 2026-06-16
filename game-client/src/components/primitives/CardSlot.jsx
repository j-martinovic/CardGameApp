// CardSlot.jsx — a reserved space for exactly one card (dealt positions,
// foundation piles, field slots).
import React from 'react';
import Card from './Card';
import { useCardInteraction } from '../../hooks/useCardInteraction';
import './primitives.css';

export default function CardSlot({ slotId, card, isDropTarget = true, onDrop, onSlotClick, disabled = false }) {
  const isFilled = !!card;

  const { dropHandlers, hoverHandlers, isOver } = useCardInteraction({
    sourceZoneId: slotId,
    isDropTarget: isDropTarget && !disabled && !isFilled,
    onDrop,
    disabled,
  });

  function handleClick() {
    if (disabled) return;
    onSlotClick?.({ slotId, cardId: card?.id });
  }

  return (
    <div
      className={`card-slot ${isFilled ? 'card-slot--filled' : 'card-slot--empty'} ${isOver ? 'zone--drop-active' : ''}`}
      {...dropHandlers}
      {...hoverHandlers}
      onClick={handleClick}
      aria-label={isFilled ? `${card.rank} of ${card.suit}` : 'Empty card slot'}
    >
      {isFilled ? (
        <Card cardData={card} sourceZoneId={slotId} disabled={disabled} />
      ) : (
        <div className="card-slot-placeholder" />
      )}
    </div>
  );
}
