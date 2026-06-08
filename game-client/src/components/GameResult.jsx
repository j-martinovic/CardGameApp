// GameResult.jsx — full-screen overlay shown when the game ends.
import React from 'react';
import './GameResult.css';

/**
 * Props:
 *   result      — { winner: 'player' | 'bot' | 'draw' }
 *   roundCount  — total rounds played
 *   playerName  — display name for the player
 *   onPlayAgain — callback to start a new match
 *   onQuit      — callback to return to lobby
 */
export default function GameResult({ result, roundCount = 0, playerName = 'You', onPlayAgain, onQuit }) {
  if (!result) return null;

  const { winner } = result;

  const headline = winner === 'player' ? 'Victory!'
    : winner === 'bot' ? 'Defeated'
    : 'A Draw';

  const subline = winner === 'player'
    ? `${playerName} conquers The House in ${roundCount} rounds.`
    : winner === 'bot'
    ? `The House wins after ${roundCount} rounds.`
    : `Mutual exhaustion — no winner after ${roundCount} rounds.`;

  const overlayClass = winner === 'player' ? 'result-overlay--win'
    : winner === 'bot' ? 'result-overlay--loss'
    : 'result-overlay--draw';

  return (
    <div className={`result-overlay ${overlayClass}`} role="dialog" aria-modal="true" aria-label="Game result">
      <div className="result-box">
        <div className="result-emblem" aria-hidden="true">
          {winner === 'player' ? '♛' : winner === 'bot' ? '☠' : '⚖'}
        </div>
        <h2 className="result-headline">{headline}</h2>
        <p className="result-subline">{subline}</p>

        <div className="result-actions">
          {onPlayAgain && (
            <button className="result-btn result-btn--primary" onClick={onPlayAgain}>
              Play Again
            </button>
          )}
          <button className="result-btn result-btn--secondary" onClick={onQuit}>
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
