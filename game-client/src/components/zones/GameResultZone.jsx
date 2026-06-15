import React from 'react';
import './GameResultZone.css';

export default function GameResultZone({ G, ctx, playerID, config = {}, handlers, onQuit, onPlayAgain, playerName }) {
  const gameover = ctx?.gameover;
  if (!gameover) return null;

  const winner = gameover.winner;
  const isMyWin = winner === playerID || winner === 'player';
  const isDraw = winner === 'draw';

  const headline = isDraw ? 'A Draw'
    : isMyWin ? 'Victory!'
    : 'Defeated';

  const emblem = isDraw ? '⚖' : isMyWin ? '♛' : '☠';

  const overlayClass = isDraw ? 'result-overlay--draw'
    : isMyWin ? 'result-overlay--win'
    : 'result-overlay--loss';

  // Build score lines from G for various game shapes
  const scores = [];
  if (G?.playerDeck !== undefined && G?.botDeck !== undefined) {
    scores.push(`Your cards: ${G.playerDeck.length}`, `House cards: ${G.botDeck.length}`);
  } else if (G?.players && playerID !== undefined) {
    Object.entries(G.players).forEach(([id, p]) => {
      const label = id === playerID ? (playerName || `You (P${id})`) : `Player ${id}`;
      scores.push(`${label}: ${p.books?.length ?? 0} books`);
    });
  }

  const roundCount = G?.roundCount ?? ctx?.turn ?? 0;

  return (
    <div className={`game-result-overlay ${overlayClass}`} role="dialog" aria-modal="true" aria-label="Game result">
      <div className="game-result-box">
        <div className="game-result-emblem" aria-hidden="true">{emblem}</div>
        <h2 className="game-result-headline">{headline}</h2>

        {roundCount > 0 && (
          <p className="game-result-rounds">{roundCount} rounds played</p>
        )}

        {scores.length > 0 && (
          <div className="game-result-scores">
            {scores.map((s, i) => <div key={i} className="game-result-score-line">{s}</div>)}
          </div>
        )}

        <div className="game-result-actions">
          {onPlayAgain && (
            <button className="game-result-btn game-result-btn--primary" onClick={onPlayAgain}>
              Play Again
            </button>
          )}
          <button className="game-result-btn game-result-btn--secondary" onClick={onQuit}>
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
