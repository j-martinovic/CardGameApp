// CardBack.jsx — face-down card component. Matches the casino theme.
import React from 'react';

/**
 * CardBack({ width, height, className })
 * Renders an SVG face-down playing card with the vintage casino back pattern.
 */
export default function CardBack({ width = 80, height = 112, className = '' }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 80 112"
      className={className}
      aria-label="Face-down card"
      role="img"
    >
      {/* Card body */}
      <rect x="1" y="1" width="78" height="110" rx="6" ry="6"
        fill="#1a1a6e" stroke="#c9a84c" strokeWidth="1.5" />
      {/* Inner border */}
      <rect x="5" y="5" width="70" height="102" rx="4" ry="4"
        fill="none" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6" />
      {/* Diamond pattern grid */}
      <pattern id="diamondPat" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
        <polygon points="6,0 12,6 6,12 0,6"
          fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.35" />
      </pattern>
      <rect x="6" y="6" width="68" height="100" rx="3" ry="3" fill="url(#diamondPat)" />
      {/* Center emblem */}
      <text x="40" y="60" textAnchor="middle" dominantBaseline="middle"
        fontSize="22" fill="#c9a84c" opacity="0.8" fontFamily="serif">♦</text>
    </svg>
  );
}
