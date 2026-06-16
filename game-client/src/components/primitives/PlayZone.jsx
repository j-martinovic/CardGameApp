// PlayZone.jsx — where cards get deposited during play. Primary drag-and-drop
// and tap-to-play target. Replaces the old "Play Card" button.
import React from 'react';
import Card from './Card';
import { useCardInteraction } from '../../hooks/useCardInteraction';
import './primitives.css';

export default function PlayZone({
  zoneId,
  cards = [],
  isDropTarget = true,
  onDrop,
  onPlay,
  selectedCardId,
  label,
  maxCards = null,
  disabled = false,
}) {
  const isEmpty = cards.length === 0;
  const isFull = maxCards != null && cards.length >= maxCards;

  function handleZoneClick() {
    if (disabled || isFull || !selectedCardId) return;
    onPlay?.({ cardId: selectedCardId, zoneId });
  }

  const { dropHandlers, hoverHandlers, isOver, isHovered } = useCardInteraction({
    sourceZoneId: zoneId,
    isDropTarget: isDropTarget && !disabled && !isFull,
    onDrop,
    disabled,
  });

  const canTapToPlay = !disabled && !isFull && !!selectedCardId;

  const classNames = [
    'play-zone',
    isEmpty ? 'play-zone--empty' : 'play-zone--occupied',
    isOver ? 'zone--drop-active' : '',
    isHovered && canTapToPlay ? 'play-zone--pulse' : '',
    disabled ? 'card--disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      {...dropHandlers}
      {...hoverHandlers}
      onClick={handleZoneClick}
      role={canTapToPlay ? 'button' : undefined}
      tabIndex={canTapToPlay ? 0 : undefined}
      aria-label={label || 'Play zone'}
    >
      {label && <div className="play-zone-label">{label}</div>}
      {isEmpty ? (
        <span>Empty</span>
      ) : (
        <div className="play-zone-cards">
          {cards.map((card) => (
            <Card key={card.id} cardData={card} sourceZoneId={zoneId} disabled />
          ))}
        </div>
      )}
    </div>
  );
}
