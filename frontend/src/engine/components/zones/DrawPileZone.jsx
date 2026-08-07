import React from 'react';
import CardBack from '../CardBack';
import './DrawPileZone.css';

export default function DrawPileZone({ G, ctx, config = {}, handlers, playerID, isAnimating, sandboxMode, sandboxLabel }) {
  const pile = G?.[config.pileField] ?? [];
  const count = pile.length ?? (sandboxMode ? 32 : 0);
  const label = config.label || 'Draw Pile';

  function handleClick() {
    if (!config.drawable || isAnimating) return;
    handlers.drawCard?.(playerID, 1);
  }

  const isClickable = config.drawable && !isAnimating && count > 0;

  return (
    <div className={`draw-pile-zone ${sandboxMode ? 'sandbox-zone' : ''}`}>
      {sandboxMode && <span className="sandbox-label">{sandboxLabel || 'DrawPileZone'}</span>}
      <div className="draw-pile-label">{label}</div>
      <div
        className={`draw-pile-stack ${isClickable ? 'clickable' : ''}`}
        onClick={handleClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && isClickable) { e.preventDefault(); handleClick(); } }}
        aria-label={`${label}: ${sandboxMode ? 32 : count} cards${isClickable ? '. Click to draw.' : ''}`}
      >
        {(count > 0 || sandboxMode) ? (
          <>
            <CardBack width={54} height={76} />
            {(sandboxMode || count > 1) && <div className="draw-shadow-mid" />}
            {(sandboxMode || count > 8) && <div className="draw-shadow-deep" />}
          </>
        ) : (
          <div className="draw-pile-empty">Empty</div>
        )}
      </div>
      <div className="draw-pile-count">{sandboxMode ? 32 : count} cards</div>
    </div>
  );
}
