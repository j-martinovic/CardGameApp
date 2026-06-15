import React from 'react';
import Card from '../Card';
import './DiscardPileZone.css';

export default function DiscardPileZone({ G, ctx, config = {}, handlers, sandboxMode, sandboxLabel }) {
  const pile = G?.[config.pileField] ?? [];
  const count = pile.length;
  const topCard = pile[pile.length - 1] ?? (sandboxMode ? { rank: '7', suit: '♦' } : null);
  const label = config.label || 'Discard';

  return (
    <div className={`discard-pile-zone ${sandboxMode ? 'sandbox-zone' : ''}`}>
      {sandboxMode && <span className="sandbox-label">{sandboxLabel || 'DiscardPileZone'}</span>}
      <div className="discard-pile-label">{label}</div>
      <div className="discard-pile-slot" aria-label={`${label}: ${count} cards`}>
        {topCard ? (
          <Card rank={topCard.rank} suit={topCard.suit} faceUp width={54} height={76} />
        ) : (
          <div className="discard-pile-empty">Empty</div>
        )}
      </div>
      {count > 0 && (
        <div className="discard-pile-count">{count} cards</div>
      )}
    </div>
  );
}
