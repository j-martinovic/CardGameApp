import React, { useState, useEffect, useRef } from 'react';
import Card from '../Card';
import CardBack from '../CardBack';
import './PlayerHandZone.css';

// stacked layout: face-down deck pile + animated play slot (War)
function StackedHand({ G, ctx, config, handlers, playerID, isAnimating, setAnimating, sandboxMode }) {
  const [displayCard, setDisplayCard] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const deckCount = G?.[config.deckField]?.length ?? (sandboxMode ? 26 : 0);
  const roundCount = G?.[config.roundCountField] ?? 0;
  const roundResult = G?.[config.roundResultField] ?? null;

  useEffect(() => {
    if (!roundCount) return;
    const nextCard = G?.[config.playedCardField];
    if (!nextCard) return;

    setDisplayCard(nextCard);
    setFlipped(false);

    const preDelay = config.flipPreDelayMs ?? 0;
    const flipDelay = config.flipDelayMs ?? 80;

    const t = setTimeout(() => {
      if (mountedRef.current) setFlipped(true);
    }, preDelay + flipDelay);

    return () => clearTimeout(t);
  }, [roundCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const canPlay = !isAnimating && !ctx?.gameover && deckCount > 0;

  function handleDeckClick() {
    const action = config.deckClickAction;
    if (!action || !canPlay) return;
    if (action.disabledWhen?.(null, G, ctx, playerID)) return;

    const args = action.argsFrom ? action.argsFrom() : [];
    handlers[action.handler]?.(...args);

    if (action.lockMs) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), action.lockMs);
    }
  }

  const resultClass = roundResult === 'player' ? 'result-win'
    : roundResult === 'bot' ? 'result-loss'
    : roundResult === 'draw' ? 'result-draw'
    : '';

  return (
    <div className={`player-stacked ${resultClass}`}>
      <div className="player-stacked-label">
        {playerID !== undefined ? `Player ${playerID}` : 'You'}
      </div>

      <div
        className={`player-deck-pile ${canPlay && config.deckClickAction ? 'deck-clickable' : ''}`}
        onClick={handleDeckClick}
        role={canPlay && config.deckClickAction ? 'button' : undefined}
        tabIndex={canPlay && config.deckClickAction ? 0 : undefined}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && canPlay) { e.preventDefault(); handleDeckClick(); } }}
        aria-label={`Your deck (${deckCount} cards)`}
      >
        {deckCount > 0 ? (
          <>
            <CardBack width={72} height={100} />
            {deckCount > 1 && <div className="deck-shadow-mid" />}
            {deckCount > 5 && <div className="deck-shadow-deep" />}
          </>
        ) : (
          <div className="deck-empty">Empty</div>
        )}
        <span className="deck-count">{deckCount}</span>
      </div>

      <div className={`player-play-slot ${displayCard || sandboxMode ? 'has-card' : ''}`}>
        {(displayCard || sandboxMode) && (
          <div className={`play-flip-wrap ${flipped ? 'flipped' : ''}`}>
            <div className="play-flip-inner">
              <div className="play-flip-back"><CardBack width={72} height={100} /></div>
              <div className="play-flip-front">
                <Card rank={displayCard?.rank || 'A'} suit={displayCard?.suit || '♠'} width={72} height={100} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// fan layout: face-up selectable hand (Go Fish)
function FanHand({ G, ctx, config, playerID, selection, setSelection, sandboxMode }) {
  const players = G?.[config.playersField] ?? {};
  const player = players[playerID] ?? {};
  const hand = player[config.handField || 'hand'] ?? [];
  const books = player[config.booksField || 'books'] ?? [];

  const isMyTurn = ctx?.currentPlayer === playerID;

  // Sandbox placeholder
  const displayHand = sandboxMode && hand.length === 0
    ? [{ rank: 'A', suit: '♠' }, { rank: 'K', suit: '♥' }, { rank: 'Q', suit: '♦' }, { rank: 'J', suit: '♣' }, { rank: '10', suit: '♠' }]
    : hand;

  return (
    <div className="player-fan">
      <div className="player-fan-header">
        <span className="player-fan-label">Your Hand ({displayHand.length} cards)</span>
        {!isMyTurn && !sandboxMode && (
          <span className="player-fan-waiting">— Waiting for your turn…</span>
        )}
        {books.length > 0 && (
          <span className="player-fan-books">{books.length} book{books.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="player-fan-cards">
        {displayHand.map((card, i) => {
          const isSelected = selection?.rank === card.rank;
          return (
            <button
              key={i}
              className={`player-fan-card-btn ${isSelected ? 'selected' : ''} ${isMyTurn || sandboxMode ? 'interactive' : ''}`}
              onClick={() => {
                if (!isMyTurn && !sandboxMode) return;
                setSelection?.(prev => ({ ...prev, rank: isSelected ? null : card.rank }));
              }}
              aria-label={`${card.rank} of ${card.suit}${isSelected ? ' (selected)' : ''}`}
            >
              <Card rank={card.rank} suit={card.suit} faceUp width={60} height={84} />
            </button>
          );
        })}
        {displayHand.length === 0 && (
          <span className="player-fan-empty">No cards in hand</span>
        )}
      </div>
    </div>
  );
}

export default function PlayerHandZone({ G, ctx, config = {}, handlers, playerID, isAnimating, setAnimating, selection, setSelection, sandboxMode, sandboxLabel }) {
  return (
    <div className={`player-hand-zone layout-${config.layout || 'fan'} ${sandboxMode ? 'sandbox-zone' : ''}`}>
      {sandboxMode && <span className="sandbox-label">{sandboxLabel || 'PlayerHandZone'}</span>}

      {config.layout === 'fan' ? (
        <FanHand G={G} ctx={ctx} config={config} playerID={playerID} selection={selection} setSelection={setSelection} sandboxMode={sandboxMode} />
      ) : (
        <StackedHand G={G} ctx={ctx} config={config} handlers={handlers} playerID={playerID} isAnimating={isAnimating} setAnimating={setAnimating} sandboxMode={sandboxMode} />
      )}
    </div>
  );
}
