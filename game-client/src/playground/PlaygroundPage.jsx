// PlaygroundPage.jsx — top-level screen for the Game Playground.
// Screens: builder | preview | playing | library

import React, { useState } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { buildCustomGame } from './CustomGameEngine';
import { DEFAULT_RULES } from './RuleSchema';
import RuleBuilder from './RuleBuilder';
import CustomBoard from './CustomBoard';
import GameLibrary from './GameLibrary';
import { saveGame } from './PlaygroundAPI';
import { createCustomGameMatch } from '../lobby/LobbyAPI';

const BGIO_SERVER = import.meta.env.VITE_BGIO_SERVER_URL || 'http://localhost:8000';

let CustomClient = null;

const containerStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse at center, #0d1f2d 0%, #07110d 100%)',
  color: '#e8d5a3',
  fontFamily: 'Georgia, serif',
  padding: 20,
  boxSizing: 'border-box',
};

const tabStyle = (active) => ({
  background: active ? '#c9a84c' : '#1a2a3a',
  color: active ? '#000' : '#e8d5a3',
  border: 'none',
  borderRadius: 6,
  padding: '8px 20px',
  cursor: 'pointer',
  fontWeight: active ? 700 : 400,
  fontFamily: 'Georgia, serif',
  fontSize: 14,
});

export default function PlaygroundPage({ userId, userName, onJoinMatch, onBack }) {
  const [screen, setScreen] = useState('builder');
  const [currentRules, setCurrentRules] = useState({ ...DEFAULT_RULES, gameName: 'My Custom Game', numPlayers: 1 });
  const [matchState, setMatchState] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePlay(rules) {
    setError(''); setLoading(true);
    try {
      const gameWithId = { ...rules, gameId: `pg_${Date.now()}` };
      // Save rules session-only so Flask returns a game_id
      await saveGame(gameWithId, userId, false, false);
      // Create a local match using the 'custom' boardgame.io game with rules in setupData
      const numPlayers = rules.numPlayers || 1;
      const { matchID, playerID, playerCredentials } = await createCustomGameMatch(gameWithId, numPlayers, userName || 'Player');

      // Build a one-off Client for this specific custom game
      const customGame = buildCustomGame(gameWithId);
      CustomClient = Client({
        game: customGame,
        board: CustomBoard,
        multiplayer: SocketIO({ server: BGIO_SERVER }),
        debug: false,
      });

      setMatchState({ matchID, playerID, playerCredentials, rules: gameWithId });
      setScreen('playing');
    } catch (e) {
      setError('Failed to start game: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(rules) {
    setSaveMsg(''); setError('');
    try {
      const data = await saveGame(rules, userId, true, true);
      setSaveMsg(`Saved! ID: ${data.game_id}`);
    } catch (e) {
      setError('Save failed: ' + e.message);
    }
  }

  function handlePlayFromLibrary(game) {
    setCurrentRules(game.rules || DEFAULT_RULES);
    handlePlay(game.rules || DEFAULT_RULES);
  }

  function handleQuitGame() {
    setMatchState(null);
    setScreen('builder');
  }

  if (screen === 'playing' && matchState && CustomClient) {
    return (
      <CustomClient
        matchID={matchState.matchID}
        playerID={matchState.playerID}
        credentials={matchState.playerCredentials}
        onQuit={handleQuitGame}
        playerName={userName || 'Player'}
      />
    );
  }

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#c9a84c' }}>Game Playground</div>
        <div style={{ fontSize: 13, opacity: 0.6 }}>Design, build, and play your own card games.</div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={tabStyle(screen === 'builder')} onClick={() => setScreen('builder')}>Build a Game</button>
        <button style={tabStyle(screen === 'library')} onClick={() => setScreen('library')}>Game Library</button>
      </div>

      {error && <div style={{ color: '#c88', background: '#2a0a0a', border: '1px solid #c88', borderRadius: 6, padding: '8px 14px', marginBottom: 12 }}>{error}</div>}
      {saveMsg && <div style={{ color: '#4caf50', background: '#0a2a0a', border: '1px solid #4caf50', borderRadius: 6, padding: '8px 14px', marginBottom: 12 }}>{saveMsg}</div>}
      {loading && <div style={{ opacity: 0.6, marginBottom: 12 }}>Starting game…</div>}

      {screen === 'builder' && (
        <RuleBuilder
          initialRules={currentRules}
          onPlay={handlePlay}
          onSave={handleSave}
          onCancel={onBack}
        />
      )}

      {screen === 'library' && (
        <GameLibrary onPlayGame={handlePlayFromLibrary} />
      )}

      <footer style={{ marginTop: 24, textAlign: 'center' }}>
        <button onClick={onBack}
          style={{ background: 'none', border: '1px solid #555', color: '#e8d5a3', borderRadius: 6, padding: '6px 18px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13 }}>
          ← Back to Lobby
        </button>
      </footer>
    </div>
  );
}
