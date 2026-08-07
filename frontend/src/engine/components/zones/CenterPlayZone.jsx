import React from 'react';
import './CenterPlayZone.css';

// versus style: War-style center with round badge, WAR! badge, round counter
function VersusCenter({ G, config, sandboxMode }) {
  const roundResult = G?.[config.roundResultField] ?? null;
  const roundCount = G?.[config.roundCountField] ?? (sandboxMode ? 3 : 0);
  const warSequences = G?.[config.warField] ?? [];
  const isWarRound = warSequences.length > 0;

  return (
    <div className="center-versus">
      {isWarRound && (
        <div className="war-badge" role="status" aria-live="polite">WAR!</div>
      )}
      {!isWarRound && roundResult && (
        <div className={`round-result-badge result-${roundResult}`} role="status" aria-live="polite">
          {roundResult === 'player' ? 'You win the round'
            : roundResult === 'bot' ? 'House wins'
            : 'Draw'}
        </div>
      )}
      {sandboxMode && !roundResult && (
        <div className="center-versus-vs">VS</div>
      )}
      {roundCount > 0 && (
        <div className="round-counter" aria-label={`Round ${roundCount}`}>
          Round {roundCount}
        </div>
      )}
    </div>
  );
}

// request style: GoFish-style showing the current ask status
function RequestCenter({ G, config, playerID, sandboxMode }) {
  const currentAsk = G?.[config.currentAskField] ?? null;
  const actionLog = G?.[config.actionLogField] ?? [];

  const showGoFishBanner = currentAsk?.result === 'go_fish' && currentAsk?.askerID === playerID;

  return (
    <div className="center-request">
      {showGoFishBanner && (
        <div className="go-fish-banner" role="status" aria-live="polite">
          Go Fish!
          {currentAsk.drawnCard && (
            <span className="go-fish-draw">
              {' '}Drew {currentAsk.drawnCard.rank}{currentAsk.drawnCard.suit}
              {currentAsk.drawnMatchesAsk ? ' — matched! Ask again.' : '.'}
            </span>
          )}
        </div>
      )}
      {currentAsk && currentAsk.result === 'success' && currentAsk.askerID === playerID && (
        <div className="ask-success-banner" role="status" aria-live="polite">
          Got {currentAsk.rank}s from Player {currentAsk.targetPlayerID}!
        </div>
      )}
      {actionLog.length > 0 && (
        <div className="action-log-preview">
          {actionLog.slice(0, 3).map((entry, i) => (
            <div key={i} className="action-log-entry" style={{ opacity: 1 - i * 0.3 }}>
              {entry}
            </div>
          ))}
        </div>
      )}
      {sandboxMode && actionLog.length === 0 && (
        <div className="action-log-preview">
          <div className="action-log-entry" style={{ opacity: 0.5 }}>P0 asked P1 for Kings — Go Fish!</div>
        </div>
      )}
    </div>
  );
}

export default function CenterPlayZone({ G, ctx, config = {}, handlers, playerID, sandboxMode, sandboxLabel }) {
  return (
    <div className={`center-play-zone style-${config.style || 'versus'} ${sandboxMode ? 'sandbox-zone' : ''}`}>
      {sandboxMode && <span className="sandbox-label">{sandboxLabel || 'CenterPlayZone'}</span>}

      {config.style === 'request' ? (
        <RequestCenter G={G} config={config} playerID={playerID} sandboxMode={sandboxMode} />
      ) : (
        <VersusCenter G={G} config={config} sandboxMode={sandboxMode} />
      )}
    </div>
  );
}
