import React, { useState, useEffect, useRef } from 'react';
import Card from '../Card';
import CardBack from '../CardBack';
import './OpponentHandZone.css';

// stacked layout: single opponent with a face-down deck pile + animated play slot (War)
function StackedOpponent({ G, config, handlers, isAnimating, roundResult, sandboxMode }) {
  const [displayCard, setDisplayCard] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const deckCount = G?.[config.deckField]?.length ?? (sandboxMode ? 26 : 0);
  const roundCount = G?.[config.roundCountField] ?? 0;

  useEffect(() => {
    if (!roundCount) return;
    const nextCard = G?.[config.playedCardField];
    if (!nextCard) return;

    setDisplayCard(nextCard);
    setFlipped(false);

    const preDelay = config.flipPreDelayMs ?? 700;
    const flipDelay = config.flipDelayMs ?? 80;

    const t = setTimeout(() => {
      if (mountedRef.current) setFlipped(true);
    }, preDelay + flipDelay);

    return () => clearTimeout(t);
  }, [roundCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const resultClass = roundResult === 'bot' ? 'result-win'
    : roundResult === 'player' ? 'result-loss'
    : roundResult === 'draw' ? 'result-draw'
    : '';

  return (
    <div className={`opp-stacked ${resultClass}`}>
      <div className="opp-stacked-label">{config.opponentName || 'Opponent'}</div>

      <div className="opp-deck-pile" aria-label={`Opponent deck: ${deckCount} cards`}>
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

      <div className={`opp-play-slot ${displayCard || sandboxMode ? 'has-card' : ''}`}>
        {(displayCard || sandboxMode) && (
          <div className={`play-flip-wrap ${flipped ? 'flipped' : ''}`}>
            <div className="play-flip-inner">
              <div className="play-flip-back"><CardBack width={72} height={100} /></div>
              <div className="play-flip-front">
                <Card rank={displayCard?.rank || 'K'} suit={displayCard?.suit || '♠'} width={72} height={100} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// fan layout: multiple opponents, each showing N face-down cards (Go Fish)
function FanOpponents({ G, config, playerID, selection, setSelection, sandboxMode }) {
  const players = G?.[config.playersField] ?? {};
  const handField = config.handField || 'hand';
  const booksField = config.booksField || 'books';

  const opponentIDs = Object.keys(players).filter(id => id !== playerID);

  if (sandboxMode && opponentIDs.length === 0) {
    // Show a placeholder opponent in sandbox
    return (
      <div className="opp-fan-row">
        <div className="opp-fan-opponent">
          <button className="opp-fan-select-btn">Opponent (sandbox)</button>
          <div className="opp-fan-cards">
            {Array.from({ length: 5 }).map((_, i) => <CardBack key={i} width={36} height={50} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="opp-fan-row">
      {opponentIDs.map(oid => {
        const opp = players[oid] || {};
        const hand = opp[handField] || [];
        const books = opp[booksField] || [];
        const isSelected = selection?.target === oid;

        return (
          <div key={oid} className={`opp-fan-opponent ${isSelected ? 'selected' : ''}`}>
            <button
              className={`opp-fan-select-btn ${isSelected ? 'active' : ''}`}
              onClick={() => setSelection?.(prev => ({ ...prev, target: isSelected ? null : oid }))}
            >
              Player {oid} {isSelected ? '✓' : ''}
              <span className="opp-meta">{hand.length} cards · {books.length} books</span>
            </button>
            <div className="opp-fan-cards">
              {hand.slice(0, 10).map((_, i) => <CardBack key={i} width={36} height={50} />)}
              {hand.length === 0 && <span className="opp-empty-hand">Empty</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OpponentHandZone({ G, ctx, config = {}, handlers, playerID, isAnimating, selection, setSelection, sandboxMode, sandboxLabel }) {
  const roundResult = G?.[config.roundResultField] ?? null;

  return (
    <div className={`opponent-hand-zone layout-${config.layout || 'stacked'} ${sandboxMode ? 'sandbox-zone' : ''}`}>
      {sandboxMode && <span className="sandbox-label">{sandboxLabel || 'OpponentHandZone'}</span>}

      {config.layout === 'fan' ? (
        <FanOpponents G={G} config={config} playerID={playerID} selection={selection} setSelection={setSelection} sandboxMode={sandboxMode} />
      ) : (
        <StackedOpponent G={G} config={config} handlers={handlers} isAnimating={isAnimating} roundResult={roundResult} sandboxMode={sandboxMode} />
      )}
    </div>
  );
}
