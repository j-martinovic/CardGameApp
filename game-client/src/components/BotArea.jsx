// BotArea.jsx — top half of the war table (bot's side). Mirrors PlayerArea layout.
import React from 'react';
import Card from './Card';
import CardBack from './CardBack';
import './PlayerArea.css'; // reuse shared deck/flip styles

/**
 * Props:
 *   deckCount   — number of cards remaining in bot's deck
 *   playedCard  — { rank, suit } | null
 *   flipped     — bool
 *   roundResult — 'player' | 'bot' | 'draw' | null
 *   botName     — display name for the bot
 */
export default function BotArea({ deckCount = 0, playedCard = null, flipped = false, roundResult = null, botName = 'The House' }) {
  const resultClass = roundResult === 'bot' ? 'result-win'
    : roundResult === 'player' ? 'result-loss'
    : roundResult === 'draw' ? 'result-draw'
    : '';

  return (
    <div className={`player-area ${resultClass}`} style={{ borderRadius: '16px 16px 0 0', flexDirection: 'row-reverse' }}>
      <div className="player-label" style={{ color: '#e8c9c9' }}>{botName}</div>

      {/* Deck pile (no click handler — bot doesn't need one) */}
      <div className="player-deck-pile" aria-label={`Bot deck (${deckCount} cards)`}>
        {deckCount > 0 ? (
          <>
            <CardBack width={72} height={100} className="player-deck-card" />
            {deckCount > 1 && <div className="deck-shadow-mid" />}
            {deckCount > 5 && <div className="deck-shadow-deep" />}
          </>
        ) : (
          <div className="deck-empty" aria-label="Bot deck empty">Empty</div>
        )}
        <span className="deck-count">{deckCount}</span>
      </div>

      {/* Play slot */}
      <div className={`player-play-slot ${playedCard ? 'has-card' : ''}`}>
        {playedCard && (
          <div className={`play-flip-wrap ${flipped ? 'flipped' : ''}`}>
            <div className="play-flip-inner">
              <div className="play-flip-back">
                <CardBack width={72} height={100} />
              </div>
              <div className="play-flip-front">
                <Card rank={playedCard.rank} suit={playedCard.suit} width={72} height={100} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
