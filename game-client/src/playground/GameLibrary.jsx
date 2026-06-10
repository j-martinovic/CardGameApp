// GameLibrary.jsx — browse public saved custom games.

import React, { useState, useEffect } from 'react';
import { listPublicGames, recordPlay } from './PlaygroundAPI';

const cardStyle = {
  background: '#1a2a3a',
  border: '1px solid #c9a84c44',
  borderRadius: 10,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

export default function GameLibrary({ onPlayGame }) {
  const [games, setGames] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const LIMIT = 12;

  useEffect(() => {
    loadGames();
  }, [offset]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadGames() {
    setLoading(true); setError('');
    try {
      const data = await listPublicGames(LIMIT, offset);
      setGames(data.games || []);
      setTotal(data.total || 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handlePlay(game) {
    try { await recordPlay(game.gameId); } catch { /* ignore */ }
    onPlayGame?.(game);
  }

  return (
    <div>
      <h2 style={{ color: '#c9a84c', marginBottom: 16 }}>Public Games</h2>
      {error && <div style={{ color: '#c88', marginBottom: 12 }}>{error}</div>}
      {loading && <div style={{ opacity: 0.6 }}>Loading…</div>}
      {!loading && games.length === 0 && (
        <p style={{ opacity: 0.6 }}>No public games yet. Build one and share it!</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {games.map(g => (
          <div key={g.gameId} style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{g.gameName}</div>
            <div style={{ fontSize: 13, opacity: 0.7, flex: 1 }}>{g.description || 'No description'}</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>
              {g.rules?.numPlayers || 2} players &bull; {g.playCount} plays
            </div>
            <button
              onClick={() => handlePlay(g)}
              style={{
                background: '#c9a84c', color: '#000', border: 'none',
                borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
                fontWeight: 700, fontFamily: 'Georgia, serif',
              }}>
              Play Now
            </button>
          </div>
        ))}
      </div>
      {total > LIMIT && (
        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
          <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            style={{ background: '#333', color: '#e8d5a3', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}>
            ← Prev
          </button>
          <span style={{ lineHeight: '32px', opacity: 0.7 }}>
            {Math.floor(offset / LIMIT) + 1} / {Math.ceil(total / LIMIT)}
          </span>
          <button disabled={offset + LIMIT >= total} onClick={() => setOffset(offset + LIMIT)}
            style={{ background: '#333', color: '#e8d5a3', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
