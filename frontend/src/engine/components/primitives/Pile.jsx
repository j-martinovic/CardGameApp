// Pile.jsx — face-up (or mixed) accumulating stack: discard pile, won-cards pile,
// or any communal collection. Top card is always fully visible and is a drop target.
import React from 'react';
import Card from './Card';
import { useCardInteraction } from '../../hooks/useCardInteraction';
import './primitives.css';

export default function Pile({
  pileId,
  cards = [],
  faceUp = true,
  isDropTarget = false,
  onDrop,
  onTopCardClick,
  label,
}) {
  const topCard = cards[cards.length - 1];

  const { dropHandlers, hoverHandlers, isOver, isHovered } = useCardInteraction({
    sourceZoneId: pileId,
    isDropTarget,
    onDrop,
  });

  return (
    <div className="pile-wrapper">
      {label && <div className="pile-label">{label}</div>}
      <div
        className={`pile ${isOver ? 'zone--drop-active' : ''} ${isHovered ? 'pile--hovered' : ''}`}
        {...dropHandlers}
        {...hoverHandlers}
        aria-label={`${label || 'Pile'}: ${cards.length} cards`}
      >
        {topCard ? (
          <Card
            cardData={{ ...topCard, faceUp }}
            sourceZoneId={pileId}
            onClick={() => onTopCardClick?.({ cardId: topCard.id, pileId })}
          />
        ) : (
          <div className="pile-empty">Empty</div>
        )}
        {cards.length > 0 && <span className="pile-count-badge">{cards.length}</span>}
      </div>
    </div>
  );
}
