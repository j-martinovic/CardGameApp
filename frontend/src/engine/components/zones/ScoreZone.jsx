import React from 'react';
import './ScoreZone.css';

// War-style: compare two deck counts
function DeckScores({ G, config, playerID }) {
  const playerCount = G?.[config.playerDeckField]?.length ?? 0;
  const opponentCount = G?.[config.opponentDeckField]?.length ?? 0;

  return (
    <div className="score-deck-row">
      <div className={`score-entry ${playerCount > opponentCount ? 'score-leading' : ''}`}>
        <span className="score-value">{playerCount}</span>
        <span className="score-label">{config.playerLabel || 'Your Cards'}</span>
      </div>
      <div className="score-divider">·</div>
      <div className={`score-entry ${opponentCount > playerCount ? 'score-leading' : ''}`}>
        <span className="score-value">{opponentCount}</span>
        <span className="score-label">{config.opponentLabel || 'Opponent'}</span>
      </div>
    </div>
  );
}

// GoFish-style: each player's books count
function PlayerScores({ G, config, playerID }) {
  const players = G?.[config.playersField] ?? {};
  const booksField = config.booksField || 'books';

  const entries = Object.entries(players).map(([id, p]) => ({
    id,
    books: p[booksField]?.length ?? 0,
    isMe: id === playerID,
  }));

  entries.sort((a, b) => b.books - a.books);

  return (
    <div className="score-player-list">
      {entries.map(({ id, books, isMe }) => (
        <div key={id} className={`score-player-entry ${isMe ? 'score-me' : ''}`}>
          <span className="score-player-label">{isMe ? 'You' : `P${id}`}</span>
          <span className="score-player-value">{books} {books === 1 ? 'book' : 'books'}</span>
        </div>
      ))}
    </div>
  );
}

export default function ScoreZone({ G, ctx, config = {}, playerID, sandboxMode, sandboxLabel }) {
  // Sandbox placeholders
  const sandboxG = sandboxMode && !G?.playerDeck && !G?.players
    ? config.dataSource === 'players'
      ? { players: { '0': { books: [{ rank: 'A' }] }, '1': { books: [] } } }
      : { playerDeck: Array(18), botDeck: Array(34) }
    : G;

  return (
    <div className={`score-zone ${sandboxMode ? 'sandbox-zone' : ''}`}>
      {sandboxMode && <span className="sandbox-label">{sandboxLabel || 'ScoreZone'}</span>}
      <div className="score-header">{config.label || 'Score'}</div>
      {config.dataSource === 'players' ? (
        <PlayerScores G={sandboxG} config={config} playerID={playerID} />
      ) : (
        <DeckScores G={sandboxG} config={config} playerID={playerID} />
      )}
    </div>
  );
}
