/**
 * @file CardFace.jsx
 * @description Renders a single playing card face as inline SVG.
 *
 * Usage:
 *   import CardFace from './assets/cards/CardFace';
 *   <CardFace rank="A" suit="spades" />
 *   <CardFace rank="K" suit="hearts" width={80} height={112} />
 *
 * Props:
 *   rank  {string} - "A","2"–"10","J","Q","K"
 *   suit  {string} - "spades" | "hearts" | "diamonds" | "clubs"
 *   width  {number} - SVG width in px (default: 100)
 *   height {number} - SVG height in px (default: 140)
 *
 * NOTE: cards.js (https://einaregilsson.github.io/cards.js/) was evaluated as
 * an alternative but is a DOM-manipulation library not suited for React's
 * virtual DOM. This pure-SVG component gives full control and is framework-native.
 * TODO: If animated card dealing is needed, consider wrapping this in a
 * motion component (e.g. framer-motion) rather than migrating to cards.js.
 */

import { useMemo } from 'react';

// ─── Suit symbols and colors ────────────────────────────────────────────────

const SUIT_SYMBOL = {
  spades:   '♠',
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
};

const SUIT_COLOR = {
  spades:   '#1a1a1a',
  clubs:    '#1a1a1a',
  hearts:   '#c0392b',
  diamonds: '#c0392b',
};

// ─── Pip layout: [x%, y%] positions for each rank ───────────────────────────
// Coordinates are percentages of the inner card face area (0–100).

const PIP_LAYOUTS = {
  'A':  [[50, 50]],
  '2':  [[50, 25], [50, 75]],
  '3':  [[50, 20], [50, 50], [50, 80]],
  '4':  [[30, 25], [70, 25], [30, 75], [70, 75]],
  '5':  [[30, 25], [70, 25], [50, 50], [30, 75], [70, 75]],
  '6':  [[30, 20], [70, 20], [30, 50], [70, 50], [30, 80], [70, 80]],
  '7':  [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [30, 80], [70, 80]],
  '8':  [[30, 18], [70, 18], [50, 32], [30, 50], [70, 50], [50, 68], [30, 82], [70, 82]],
  '9':  [[30, 18], [70, 18], [30, 38], [70, 38], [50, 50], [30, 62], [70, 62], [30, 82], [70, 82]],
  '10': [[30, 15], [70, 15], [50, 28], [30, 42], [70, 42], [30, 58], [70, 58], [50, 72], [30, 85], [70, 85]],
  // J, Q, K use face art instead of pips
  'J':  null,
  'Q':  null,
  'K':  null,
};

// ─── Face card art (minimal decorative SVG path per rank) ────────────────────

/**
 * Returns a simple decorative SVG element for face cards (J, Q, K).
 * Placed in the center of the card; cx/cy are the center coordinates.
 */
function FaceArt({ rank, suit, cx, cy, color }) {
  const size = 28;

  if (rank === 'K') {
    // Crown shape
    return (
      <g>
        <polygon
          points={`${cx},${cy - size * 0.9} ${cx - size * 0.5},${cy - size * 0.1} ${cx - size * 0.8},${cy - size * 0.7} ${cx - size * 0.3},${cy - size * 0.2} ${cx},${cy - size * 0.8} ${cx + size * 0.3},${cy - size * 0.2} ${cx + size * 0.8},${cy - size * 0.7} ${cx + size * 0.5},${cy - size * 0.1} ${cx},${cy - size * 0.9}`}
          fill={color} opacity="0.15"
          stroke={color} strokeWidth="1"
        />
        <rect x={cx - size * 0.6} y={cy - size * 0.1} width={size * 1.2} height={size * 0.5}
          fill={color} opacity="0.12" rx="2"/>
        <text x={cx} y={cy + size * 0.6}
          fontSize="22" fontFamily="Georgia,serif" fontWeight="bold"
          fill={color} textAnchor="middle" opacity="0.75">K</text>
      </g>
    );
  }

  if (rank === 'Q') {
    return (
      <g>
        <circle cx={cx} cy={cy - size * 0.4} r={size * 0.55}
          fill={color} opacity="0.1" stroke={color} strokeWidth="1"/>
        <circle cx={cx} cy={cy - size * 0.4} r={size * 0.3}
          fill={color} opacity="0.15"/>
        <text x={cx} y={cy + size * 0.6}
          fontSize="22" fontFamily="Georgia,serif" fontWeight="bold"
          fill={color} textAnchor="middle" opacity="0.75">Q</text>
      </g>
    );
  }

  if (rank === 'J') {
    return (
      <g>
        <path d={`M${cx},${cy - size * 0.8} L${cx + size * 0.5},${cy + size * 0.4} L${cx - size * 0.5},${cy + size * 0.4} Z`}
          fill={color} opacity="0.1" stroke={color} strokeWidth="1"/>
        <text x={cx} y={cy + size * 0.6}
          fontSize="22" fontFamily="Georgia,serif" fontWeight="bold"
          fill={color} textAnchor="middle" opacity="0.75">J</text>
      </g>
    );
  }

  return null;
}

// ─── Pip font size based on rank ─────────────────────────────────────────────

function pipFontSize(rank) {
  if (rank === 'A') return 28;
  if (rank === '10') return 12;
  return 14;
}

// ─── Main component ──────────────────────────────────────────────────────────
/**
 * Renders a single playing card as an inline SVG.
 */
function CardFace({ rank = 'A', suit = 'S', width = 100, height = 140 }) {
 
  const imgUrl = new URL(`./cards_good/${rank}${suit}.svg`, import.meta.url).href;

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


function CardFace_old({ rank = 'A', suit = 'spades', width = 100, height = 140 }) {
  const color = SUIT_COLOR[suit] ?? '#1a1a1a';
  const symbol = SUIT_SYMBOL[suit] ?? '?';
  const pips = PIP_LAYOUTS[rank];

  // Inner face area: inset 10px from card edge on each side
  const faceX = 10;
  const faceY = 10;
  const faceW = width - 20;
  const faceH = height - 20;

  // Center of the card face
  const cx = width / 2;
  const cy = height / 2;

  // Compute absolute pip positions from percentage layout
  const pipPositions = useMemo(() => {
    if (!pips) return [];
    return pips.map(([pctX, pctY]) => ({
      x: faceX + (pctX / 100) * faceW,
      y: faceY + (pctY / 100) * faceH,
    }));
  }, [rank, suit, width, height]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${rank} of ${suit}`}
    >
      {/* Card body */}
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="7" ry="7"
        fill="#fffdf5" stroke="#c8a96e" strokeWidth="1.5"/>

      {/* Top-left rank + suit */}
      <text x="6" y="17"
        fontSize="12" fontFamily="Georgia,serif" fontWeight="bold"
        fill={color}>{rank}</text>
      <text x="6" y="29"
        fontSize="11" fontFamily="Arial,sans-serif"
        fill={color}>{symbol}</text>

      {/* Bottom-right rank + suit (rotated 180°) */}
      <text x={width - 6} y={height - 18}
        fontSize="12" fontFamily="Georgia,serif" fontWeight="bold"
        fill={color} textAnchor="end"
        transform={`rotate(180, ${width - 6}, ${height - 18})`}>{rank}</text>
      <text x={width - 6} y={height - 6}
        fontSize="11" fontFamily="Arial,sans-serif"
        fill={color} textAnchor="end"
        transform={`rotate(180, ${width - 6}, ${height - 6})`}>{symbol}</text>

      {/* Center: pips for number cards, face art for J/Q/K */}
      {pips ? (
        pipPositions.map((pos, index) => (
          <text
            key={index}
            x={pos.x}
            y={pos.y}
            fontSize={pipFontSize(rank)}
            fontFamily="Arial,sans-serif"
            fill={color}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {symbol}
          </text>
        ))
      ) : (
        <FaceArt rank={rank} suit={suit} cx={cx} cy={cy} color={color} />
      )}
    </svg>
  );
}

export default CardFace;
