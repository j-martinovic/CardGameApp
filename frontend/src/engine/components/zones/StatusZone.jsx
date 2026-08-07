import React from 'react';
import './StatusZone.css';

export default function StatusZone({ G, ctx, playerID, config = {}, sandboxMode, sandboxLabel, onEndTurn, canEndTurn, onQuit }) {
  const currentPlayer = ctx?.currentPlayer ?? '?';
  const phase = ctx?.phase ?? 'playing';
  const turn = ctx?.turn ?? 0;
  const isMyTurn = currentPlayer === playerID;

  const roundCount = G?.[config.roundCountField] ?? turn;

  return (
    <div className={`status-zone ${sandboxMode ? 'sandbox-zone' : ''}`}>
      {sandboxMode && <span className="sandbox-label">{sandboxLabel || 'StatusZone'}</span>}
      <div className="status-inner">
        <span className="status-turn">
          {isMyTurn ? 'Your Turn' : `Player ${currentPlayer}'s Turn`}
        </span>
        {phase && phase !== 'default' && (
          <span className="status-phase">Phase: {phase}</span>
        )}
        {roundCount > 0 && (
          <span className="status-round">Round {roundCount}</span>
        )}
        {config.timer?.enabled && (
          <span className="status-timer">⏱ {config.timer.seconds ?? 30}s</span>
        )}
        {onEndTurn && (
          <button className="status-end-turn-btn" onClick={onEndTurn} disabled={!canEndTurn}>
            End Turn
          </button>
        )}
        {onQuit && (
          <button className="status-quit-btn" onClick={onQuit} type="button">Quit</button>
        )}
      </div>
    </div>
  );
}
