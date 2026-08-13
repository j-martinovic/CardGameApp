import React, { useEffect, useState } from 'react';
import './DiceRoller.css';

// Maps each face value to the CSS pip-position class names
const FACE_PIPS = {
  1: ['mc'],
  2: ['tr', 'bl'],
  3: ['tr', 'mc', 'bl'],
  4: ['tl', 'tr', 'bl', 'br'],
  5: ['tl', 'tr', 'mc', 'bl', 'br'],
  6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
};

function Die({ value, rolling, rollKey }) {
  const pips = FACE_PIPS[Math.max(1, Math.min(6, value))] || FACE_PIPS[1];
  return (
    <div className="dr-die-wrap">
      {/* key on inner div forces animation to restart on each new roll */}
      <div key={rollKey} className={['dr-die', rolling ? 'dr-die--rolling' : ''].filter(Boolean).join(' ')}>
        {pips.map((pos, i) => (
          <div key={i} className={`dr-pip dr-pip--${pos}`} />
        ))}
      </div>
    </div>
  );
}

export default function DiceRoller({
  visible,
  numDice = 1,
  values = [1],
  rolling = false,
  onRollComplete,
}) {
  const [rollKey, setRollKey] = useState(0);

  // Increment key each time a new roll starts so the animation element remounts
  useEffect(() => {
    if (!rolling) return;
    setRollKey(k => k + 1);
    const timer = setTimeout(() => onRollComplete?.(), 600);
    return () => clearTimeout(timer);
  }, [rolling]);

  if (!visible) return null;

  const count = Math.min(Math.max(numDice, 1), 2);
  const diceValues = Array.from({ length: count }, (_, i) => values[i] ?? 1);

  return (
    <div className="dr-overlay">
      <div className="dr-panel">
        <div className="dr-dice-row">
          {diceValues.map((val, i) => (
            <Die key={i} value={val} rolling={rolling} rollKey={rollKey} />
          ))}
        </div>
      </div>
    </div>
  );
}
