// Card.jsx — face-up playing card component.
import React from 'react';
import './Card.css';

const RED_SUITS = new Set(['H', 'D']);

/**
 * Card({ rank, suit, faceUp, width, height, className })
 *
 * Renders a single playing card face-up or face-down.
 * When faceUp is false, renders the blue diamond back pattern.
 */
export default function Card({ rank = 'A', suit = 'S', faceUp = true, width = 80, height = 112, className = '' }) {

// var suit_ = "C"

// if (suit === "♠") {
//   suit_ = "S"
// } else if (suit === "♥") {
//   suit_ = "H"
// } else if (suit === "♦") {
//   suit_ = "D"
// }

function CardFace({ rank = 'A', suit = 'S', width = 100, height = 140 }) {
 
  const imgUrl = new URL(`../../assets/cards/cards_good/${rank}${suit}.svg`, import.meta.url).href;

  return (
      <img
        src={imgUrl}
        x="0"
        y="0"
        width="100%"
        height="100%"
        /* 'xMidYMid meet' ensures that your card asset preserves its 
          original design proportions perfectly without stretching if 
          the passed width and height aspect ratios vary slightly.
        */
        preserveAspectRatio="xMidYMid meet"
      />
  );
}


  
  const isRed = RED_SUITS.has(suit);
  const colorClass = isRed ? 'card-red' : 'card-black';

  if (!faceUp) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 80 112"
        className={`card-svg card-face-down ${className}`}
        aria-label="Face-down card"
      >
        <rect x="1" y="1" width="78" height="110" rx="6" ry="6"
          fill="#1a1a6e" stroke="#c9a84c" strokeWidth="1.5" />
        <rect x="5" y="5" width="70" height="102" rx="4" ry="4"
          fill="none" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6" />
        <pattern id={`dp-${rank}-${suit}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
          <polygon points="6,0 12,6 6,12 0,6"
            fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.35" />
        </pattern>
        <rect x="6" y="6" width="68" height="100" rx="3" ry="3" fill={`url(#dp-${rank}-${suit})`} />
        <text x="40" y="60" textAnchor="middle" dominantBaseline="middle"
          fontSize="22" fill="#c9a84c" opacity="0.8" fontFamily="serif">♦</text>
      </svg>
    );
  }

  return (
    <div
      className={`card-face ${colorClass} ${className}`}
      style={{ width, height }}
      aria-label={`${rank} of ${suit}`}
      role="img"
    >
      {/* <span className="card-corner card-top-left">
        <span className="card-rank">{rank}</span>
        <span className="card-suit">{suit}</span>
      </span>
      <span className="card-center-suit">{suit}</span>
      <span className="card-corner card-bot-right">
        <span className="card-rank">{rank}</span>
        <span className="card-suit">{suit}</span>
      </span> */}
      <CardFace rank={rank} suit={suit} width={width} height={height}/>
    </div>
  );
}
