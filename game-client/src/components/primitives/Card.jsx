// Card.jsx — interactive card primitive. Wraps the existing visual Card/CardBack
// face components and layers on hover/click/drag/selected/disabled behavior so
// no parent needs to wire that up itself.
import React from 'react';
import CardFace from '../Card';
import CardBack from '../CardBack';
import { useCardInteraction } from '../../hooks/useCardInteraction';
import './primitives.css';

export default function Card({
  cardData,
  sourceZoneId,
  onClick,
  selected = false,
  disabled = false,
  width = 80,
  height = 112,
}) {
  const { id, rank, suit, faceUp = true } = cardData || {};

  const { dragHandlers, hoverHandlers, isDragging, isHovered } = useCardInteraction({
    cardId: id,
    sourceZoneId,
    onClick,
    disabled,
  });

  function handleClick() {
    if (disabled) return;
    onClick?.({ cardId: id, sourceZoneId });
  }

  function handleKeyDown(e) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  const classNames = [
    'card',
    faceUp ? 'card--face-up' : 'card--face-down',
    isHovered && !disabled ? 'card--hovered' : '',
    selected ? 'card--selected' : '',
    isDragging ? 'card--dragging' : '',
    disabled ? 'card--disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      {...dragHandlers}
      {...hoverHandlers}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={faceUp ? `${rank} of ${suit}` : 'Face-down card'}
      aria-pressed={selected}
    >
      {faceUp ? (
        <CardFace rank={rank} suit={suit} faceUp width={width} height={height} />
      ) : (
        <CardBack width={width} height={height} />
      )}
    </div>
  );
}
