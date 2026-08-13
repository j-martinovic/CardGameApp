import React from 'react';
import './JokerSuitPanel.css';

const RED_SUITS = new Set(['♥', '♦']);

export default function JokerSuitPanel({
  visible,
  prompt = 'Choose a suit for the Joker',
  suits = ['♠', '♥', '♦', '♣'],
  onSelect,
}) {
  if (!visible) return null;

  return (
    <div className="jsp-overlay">
      <div className="jsp-panel">
        <p className="jsp-prompt">{prompt}</p>
        <div className="jsp-suits">
          {suits.map(suit => (
            <button
              key={suit}
              className={['jsp-suit-btn', RED_SUITS.has(suit) ? 'jsp-suit--red' : 'jsp-suit--black'].join(' ')}
              onClick={() => onSelect?.(suit)}
              aria-label={`Choose ${suit}`}
            >
              {suit}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
