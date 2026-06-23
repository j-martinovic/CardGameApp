// Hand.jsx — local or opponent hand of cards. Fans out, owns selection state,
// and supports drag-out and keyboard confirm. No parent wiring required beyond
// the callbacks below.
import React from 'react';
import Card from './Card';
import './primitives.css';

export default function Hand({
  cards = [],
  playerId,
  isOwner = true,
  onCardSelect,
  onCardConfirm,
  selectedCardId,
  disabled = false,
}) {
  const zoneId = `hand-${playerId ?? ''}`;
  const interactive = isOwner && !disabled;

  function handleCardClick({ cardId }) {
    if (!interactive) return;
    onCardSelect?.(selectedCardId === cardId ? null : cardId);
  }

  function handleKeyDownCapture(e, cardId) {
    if (!interactive) return;
    if ((e.key === 'Enter' || e.key === ' ') && selectedCardId === cardId) {
      e.preventDefault();
      e.stopPropagation();
      onCardConfirm?.(cardId);
    }
  }

  return (
    <div className={`hand ${disabled ? 'hand--disabled' : ''}`} aria-label={isOwner ? 'Your hand' : 'Opponent hand'}>
      {cards.map((card) => (
        <div key={card.id} onKeyDownCapture={(e) => handleKeyDownCapture(e, card.id)}>
          {console.log(card)}
          <Card
            cardData={{ ...card, faceUp: isOwner }}
            sourceZoneId={zoneId}
            onClick={handleCardClick}
            selected={interactive && selectedCardId === card.id}
            disabled={!interactive}
          />
        </div>
      ))}
    </div>
  );
}
