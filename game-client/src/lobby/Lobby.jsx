// Lobby.jsx — game selection screen.
// Shows available games, lets the player enter their name, and starts a match.
import React, { useState, useEffect } from 'react';
import { createAndJoinMatch } from './LobbyAPI';
import './Lobby.css';

const GAMES = [
  {
    id: 'war',
    label: 'War',
    description: 'A classic battle of cards. 26 vs 26 — may the best deck win.',
    icon: '⚔',
    available: true,
  },
  {
    id: 'go_fish',
    label: 'Go Fish',
    description: 'Ask your opponents for ranks, collect books of 4. Most books wins!',
    icon: '🐟',
    available: true,
  },
  {
    id: 'blackjack',
    label: 'Blackjack',
    description: 'Coming soon.',
    icon: '21',
    available: false,
  },
];

/**
 * Props:
 *   userName      — pre-filled player name (from URL param or localStorage)
 *   onJoinMatch   — callback(gameName, matchID, playerID, playerName, playerCredentials)
 *   onMultiplayer — callback to switch to MultiplayerLobby screen
 *   onPlayground  — callback to switch to PlaygroundPage screen
 */
export default function Lobby({ userName = '', onJoinMatch, onMultiplayer, onPlayground }) {
  const [name, setName] = useState(userName || '');
  const [selectedGame, setSelectedGame] = useState('war');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync if userName changes externally (e.g., URL param resolved after mount).
  useEffect(() => {
    if (userName && !name) setName(userName);
  }, [userName]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStart(e) {
    e.preventDefault();
    const displayName = name.trim() || 'Player';
    setError('');
    setLoading(true);
    try {
      const { matchID, playerID, playerCredentials } = await createAndJoinMatch(selectedGame, displayName);
      onJoinMatch(selectedGame, matchID, playerID, displayName, playerCredentials);
    } catch (err) {
      setError('Could not connect to the game server. Is it running on port 8000?');
      console.error('Lobby createAndJoinMatch error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lobby-screen">
      {/* Header */}
      <header className="lobby-header">
        <div className="lobby-brand">
          <span className="lobby-suit" aria-hidden="true">♠</span>
          Royal Table
          <span className="lobby-suit" aria-hidden="true">♥</span>
        </div>
        <p className="lobby-tagline">Choose your game. Sit down. Win.</p>
      </header>

      {/* Game grid */}
      <section className="lobby-games" aria-label="Available games">
        {GAMES.map((game) => (
          <button
            key={game.id}
            className={`lobby-game-card ${selectedGame === game.id ? 'selected' : ''} ${!game.available ? 'unavailable' : ''}`}
            onClick={() => game.available && setSelectedGame(game.id)}
            disabled={!game.available}
            aria-pressed={selectedGame === game.id}
            aria-label={game.available ? `Select ${game.label}` : `${game.label} — coming soon`}
          >
            <span className="game-card-icon" aria-hidden="true">{game.icon}</span>
            <span className="game-card-label">{game.label}</span>
            <span className="game-card-desc">{game.description}</span>
            {!game.available && <span className="game-card-soon">Coming Soon</span>}
          </button>
        ))}
      </section>

      {/* Start form */}
      <form className="lobby-form" onSubmit={handleStart} noValidate>
        <label className="lobby-form-label" htmlFor="playerName">
          Your Name
        </label>
        <input
          id="playerName"
          className="lobby-form-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter display name"
          maxLength={32}
          autoComplete="off"
          disabled={loading}
        />

        {error && <div className="lobby-error" role="alert">{error}</div>}

        <button
          className="lobby-start-btn"
          type="submit"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Connecting…' : 'Deal Me In'}
        </button>
      </form>

      {/* Multiplayer & Playground buttons */}
      <div style={{ display: 'flex', gap: 10, maxWidth: 400, margin: '12px auto 0' }}>
        {onMultiplayer && (
          <button
            className="lobby-start-btn"
            style={{ background: '#1a3a5c', flex: 1 }}
            type="button"
            onClick={onMultiplayer}
          >
            👥 Play with Friends
          </button>
        )}
        {onPlayground && (
          <button
            className="lobby-start-btn"
            style={{ background: '#2d1a5c', flex: 1 }}
            type="button"
            onClick={onPlayground}
          >
            🔧 Build a Game
          </button>
        )}
      </div>

      <footer className="lobby-footer">
        <a href="http://localhost:5173" className="lobby-footer-link">
          ← Back to main site
        </a>
      </footer>
    </div>
  );
}
