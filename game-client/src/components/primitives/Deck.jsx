// Deck.jsx — face-down stack. Click to draw. Replaces the old "Draw Card" button.
import React from 'react';
import CardBack from '../CardBack';
import './primitives.css';

export default function Deck({ deckId, cardCount = 0, onDraw, disabled = false }) {
  const isEmpty = cardCount <= 0;
  const clickable = !disabled && !isEmpty;

  function handleClick() {
    if (!clickable) return;
    onDraw?.();
  }

  function handleKeyDown(e) {
    if (!clickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDraw?.();
    }
  }

  return (
    <div
      className={`deck ${clickable ? 'deck--clickable' : ''} ${disabled ? 'card--disabled' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : -1}
      aria-label={isEmpty ? `${deckId || 'Deck'} empty` : `${deckId || 'Deck'}: ${cardCount} cards. Click to draw.`}
    >
      {isEmpty ? (
        <div className="deck-empty-label">Empty</div>
      ) : (
        <>
          <CardBack width={80} height={112} />
          <span className="deck-count-badge">{cardCount}</span>
        </>
      )}
    </div>
  );
}
