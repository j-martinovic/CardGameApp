import React from 'react';
import './BiddingPanel.css';

const RED_SUITS = new Set(['♥', '♦']);

function suitColorClass(suit) {
  return RED_SUITS.has(suit) ? 'bp-suit--red' : 'bp-suit--black';
}

function isUnbiddable(level, suit, unbiddableBids) {
  return unbiddableBids.some(b => b.level === level && b.suit === suit);
}

export default function BiddingPanel({
  visible,
  levelMin = 1,
  levelMax = 7,
  suits = ['♠', '♥', '♦', '♣'],
  includeNT = true,
  unbiddableBids = [],
  wildCards = [],
  onBid,
  onPass,
  onWildCard,
}) {
  if (!visible) return null;

  const columns = includeNT ? [...suits, 'NT'] : [...suits];

  // Build rows from highest level at top to lowest at bottom
  const levels = [];
  for (let l = levelMax; l >= levelMin; l--) levels.push(l);

  return (
    <div className="bp-overlay">
      <div className="bp-panel">
        {/* CSS custom property drives grid-template-columns — only dynamic value needed */}
        <div className="bp-grid" style={{ '--bp-cols': columns.length }}>
          {levels.map(level =>
            columns.map(suit => {
              const unbiddable = isUnbiddable(level, suit, unbiddableBids);
              const isNT = suit === 'NT';
              return (
                <button
                  key={`${level}-${suit}`}
                  className={[
                    'bp-cell',
                    isNT ? 'bp-cell--nt' : '',
                    unbiddable ? 'bp-cell--unbiddable' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => onBid?.(level, suit)}
                  disabled={unbiddable}
                  aria-label={`${level}${isNT ? 'NT' : suit}`}
                >
                  <span className="bp-cell-level">{level}</span>
                  <span className={`bp-cell-suit ${suitColorClass(suit)}`}>
                    {isNT ? 'NT' : suit}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="bp-bottom-row">
          <div className="bp-wildcards">
            {wildCards.map((wc, i) => (
              <button
                key={i}
                className={['bp-wc-btn', wc.disabled ? 'bp-wc-btn--disabled' : ''].filter(Boolean).join(' ')}
                onClick={() => onWildCard?.(wc.label)}
                disabled={wc.disabled}
                aria-label={wc.label}
              >
                {wc.label}
              </button>
            ))}
          </div>
          <button className="bp-pass-btn" onClick={() => onPass?.()}>
            Pass
          </button>
        </div>
      </div>
    </div>
  );
}
