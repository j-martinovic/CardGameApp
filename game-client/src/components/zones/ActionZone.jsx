import React, { useState, useRef, useEffect } from 'react';
import './ActionZone.css';

// All handler names available for sandbox "show all" mode
const ALL_HANDLER_KEYS = [
  'playCard', 'drawCard', 'discardCard', 'sortHand', 'selectCard', 'deselectCard',
  'revealCard', 'shuffleReset', 'burnCard', 'cutDeck', 'markCardHeld', 'snapCardBack',
  'endTurn', 'startNextRound', 'forfeit', 'undoLastAction', 'forceResync',
  'claimTrick', 'challengePlay', 'meldDeclare', 'declareWin', 'sitOutNextHand',
  'placeBid', 'raiseBet', 'callBet', 'fold', 'check', 'allIn',
  'updateScore', 'unlockAchievement',
  'sendChatMessage', 'sendEmojiReaction', 'sendQuickPhrase',
];

export default function ActionZone({
  G, ctx, config = {}, handlers, playerID,
  isAnimating, setAnimating,
  selection, setSelection,
  onQuit, sandboxMode, sandboxLabel,
}) {
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const actions = sandboxMode
    ? ALL_HANDLER_KEYS.map(key => ({ label: key, handler: key, phase: 'any' }))
    : (config.actions || []);

  function handleAction(action) {
    if (isAnimating) return;
    if (action.disabledWhen?.(selection, G, ctx, playerID)) return;

    const args = action.argsFrom
      ? action.argsFrom(selection, G, playerID)
      : [];

    handlers[action.handler]?.(...args);

    if (action.lockMs) {
      setAnimating(true);
      if (mountedRef.current) {
        setTimeout(() => {
          if (mountedRef.current) setAnimating(false);
        }, action.lockMs);
      }
    }

    if (action.resetSelection) {
      setSelection?.({ cardIndex: null, rank: null, target: null });
    }
  }

  function isDisabled(action) {
    if (isAnimating) return true;
    if (action.disabledWhen) return action.disabledWhen(selection, G, ctx, playerID);
    return false;
  }

  function isVisible(action) {
    if (sandboxMode) return true;
    if (action.phase === 'any' || !action.phase) return true;
    return action.phase === ctx?.phase;
  }

  const visibleActions = actions.filter(isVisible);

  return (
    <div className={`action-zone ${sandboxMode ? 'sandbox-zone sandbox-action' : ''}`}>
      {sandboxMode && <span className="sandbox-label">{sandboxLabel || 'ActionZone'}</span>}

      <div className="action-buttons">
        {visibleActions.map((action, i) => (
          <button
            key={i}
            className={`action-btn ${isDisabled(action) ? 'action-btn-disabled' : ''}`}
            onClick={() => handleAction(action)}
            disabled={isDisabled(action)}
            aria-label={action.label}
          >
            {action.label}
          </button>
        ))}
      </div>

      {onQuit && (
        <button className="action-quit-btn" onClick={onQuit} type="button">
          Quit
        </button>
      )}
    </div>
  );
}
