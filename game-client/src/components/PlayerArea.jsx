// PlayerArea.jsx — bottom half of the war table (human player's side).
import React from 'react';
import Card from './Card';
import CardBack from './CardBack';
import './PlayerArea.css';

/**
 * Props:
 *   deckCount   — number of cards remaining in player's deck
 *   playedCard  — { rank, suit } | null — the card the player just played
 *   flipped     — bool — whether the played card has flipped face-up
 *   roundResult — 'player' | 'bot' | 'draw' | null
 *   playerName  — display name for the player
 *   onPlayCard  — callback when the player clicks their deck
 *   canPlay     — bool — whether the player can click right now
 */
export default function PlayerArea({ deckCount = 0, playedCard = null, flipped = false, roundResult = null, playerName = 'You', onPlayCard, canPlay = true }) {
  const resultClass = roundResult === 'player' ? 'result-win'
    : roundResult === 'bot' ? 'result-loss'
    : roundResult === 'draw' ? 'result-draw'
    : '';

  return (
    <div className={`player-area ${resultClass}`}>
      <div className="player-label">{playerName}</div>

      {/* Deck pile — click to play */}
      <div
        className={`player-deck-pile ${canPlay && deckCount > 0 ? 'deck-clickable' : ''}`}
        onClick={canPlay && deckCount > 0 ? onPlayCard : undefined}
        role={canPlay ? 'button' : undefined}
        tabIndex={canPlay ? 0 : undefined}
        onKeyDown={canPlay ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlayCard?.(); } } : undefined}
        aria-label={`Your deck (${deckCount} cards). Click to play.`}
      >
        {deckCount > 0 ? (
          <>
            <CardBack width={72} height={100} className="player-deck-card" />
            {deckCount > 1 && <div className="deck-shadow-mid" />}
            {deckCount > 5 && <div className="deck-shadow-deep" />}
          </>
        ) : (
          <div className="deck-empty" aria-label="Deck empty">Empty</div>
        )}
        <span className="deck-count">{deckCount}</span>
      </div>

      {/* Play slot — shows the card the player just played */}
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
