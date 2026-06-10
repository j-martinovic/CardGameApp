// MultiplayerLobby.jsx — online room creation, joining, and waiting UI.
// Manages 4 sub-screens via local state: choose | create | join_code | browse | waiting

import React, { useState, useEffect, useRef } from 'react';
import {
  createRoom, joinRoom, leaveRoom, setReady,
  getRoom, getRoomByCode, startRoom, setRoomMatch, listOpenRooms,
} from './RoomsAPI';
import { createMultiplayerMatch, joinMultiplayerMatch } from './LobbyAPI';

const MULTIPLAYER_GAMES = [
  { id: 'go_fish', label: 'Go Fish', icon: '🐟', minPlayers: 2, maxPlayers: 6 },
  { id: 'war', label: 'War', icon: '⚔', minPlayers: 2, maxPlayers: 2 },
];

function guestId() {
  const key = 'mp_guest_id';
  let id = sessionStorage.getItem(key);
  if (!id) { id = `guest_${Date.now()}`; sessionStorage.setItem(key, id); }
  return id;
}

export default function MultiplayerLobby({ userId, userName, onJoinMatch, onBack }) {
  const [screen, setScreen] = useState('choose');
  const [name, setName] = useState(userName || sessionStorage.getItem('mp_name') || '');
  const [selectedGame, setSelectedGame] = useState('go_fish');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openRooms, setOpenRooms] = useState([]);
  const pollRef = useRef(null);

  const effectiveUserId = userId || guestId();
  const effectiveName = name.trim() || 'Player';

  useEffect(() => {
    if (name) sessionStorage.setItem('mp_name', name);
  }, [name]);

  // Poll room state while on waiting screen
  useEffect(() => {
    if (screen !== 'waiting' || !roomId) return;
    pollRef.current = setInterval(async () => {
      try {
        const data = await getRoom(roomId);
        setRoom(data.room);
        if (data.room.status === 'in_progress' && data.room.bgio_match_id) {
          clearInterval(pollRef.current);
          _joinMatchFromRoom(data.room);
        }
      } catch { /* ignore poll errors */ }
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [screen, roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll open rooms on browse screen
  useEffect(() => {
    if (screen !== 'browse') return;
    const load = async () => {
      try { const d = await listOpenRooms(); setOpenRooms(d.rooms || []); } catch { /* */ }
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [screen]);

  async function _joinMatchFromRoom(r) {
    const pid = String(playerIndex);
    try {
      const { playerCredentials } = await joinMultiplayerMatch(r.game_name, r.bgio_match_id, pid, effectiveName);
      onJoinMatch(r.game_name, r.bgio_match_id, pid, effectiveName, playerCredentials);
    } catch (e) {
      setError('Failed to connect to game: ' + e.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const game = MULTIPLAYER_GAMES.find(g => g.id === selectedGame);
      const data = await createRoom(effectiveUserId, effectiveName, selectedGame, maxPlayers, game?.minPlayers || 2);
      setRoomId(data.room_id);
      setRoom(data.room);
      setPlayerIndex(0);
      setScreen('waiting');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleJoinByCode(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const found = await getRoomByCode(roomCode);
      const joined = await joinRoom(found.room_id, effectiveUserId, effectiveName);
      setRoomId(found.room_id);
      setRoom(joined.room);
      setPlayerIndex(joined.player_index);
      setScreen('waiting');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleJoinFromBrowse(r) {
    setError(''); setLoading(true);
    try {
      const joined = await joinRoom(r.room_id, effectiveUserId, effectiveName);
      setRoomId(r.room_id);
      setRoom(joined.room);
      setPlayerIndex(joined.player_index);
      setScreen('waiting');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleReady() {
    if (!roomId) return;
    const me = room?.players?.find(p => String(p.user_id) === String(effectiveUserId));
    if (!me) return;
    try {
      const data = await setReady(roomId, effectiveUserId, !me.ready);
      setRoom(data.room);
    } catch (e) { setError(e.message); }
  }

  async function handleStart() {
    setError(''); setLoading(true);
    try {
      await startRoom(roomId, effectiveUserId);
      const { matchID } = await createMultiplayerMatch(room.game_name, room.players.length);
      await setRoomMatch(roomId, effectiveUserId, matchID);
      const { playerCredentials } = await joinMultiplayerMatch(room.game_name, matchID, '0', effectiveName);
      onJoinMatch(room.game_name, matchID, '0', effectiveName, playerCredentials);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleLeave() {
    if (roomId) {
      try { await leaveRoom(roomId, effectiveUserId); } catch { /* */ }
    }
    clearInterval(pollRef.current);
    setRoom(null); setRoomId(null); setScreen('choose');
  }

  const isHost = room && String(room.host_user_id) === String(effectiveUserId);
  const allReady = room?.players?.length >= (room?.min_players || 2) && room?.players?.every(p => p.ready);
  const me = room?.players?.find(p => String(p.user_id) === String(effectiveUserId));

  // ── Screen: Choose ────────────────────────────────────────────────────────
  if (screen === 'choose') return (
    <div className="lobby-screen">
      <header className="lobby-header">
        <div className="lobby-brand">♠ Play with Friends ♥</div>
        <p className="lobby-tagline">Create or join a room, then start together.</p>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
        <label className="lobby-form-label">Your Name</label>
        <input className="lobby-form-input" value={name} onChange={e => setName(e.target.value)}
          placeholder="Display name" maxLength={32} autoComplete="off" />
        <button className="lobby-start-btn" onClick={() => setScreen('create')}>Create a Room</button>
        <button className="lobby-start-btn" style={{ background: '#2d5a27' }} onClick={() => setScreen('join_code')}>Join with Code</button>
        <button className="lobby-start-btn" style={{ background: '#1a3a5c' }} onClick={() => setScreen('browse')}>Browse Open Rooms</button>
      </div>
      {error && <div className="lobby-error">{error}</div>}
      <footer className="lobby-footer">
        <button className="lobby-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={onBack}>← Back to Lobby</button>
      </footer>
    </div>
  );

  // ── Screen: Create Room ───────────────────────────────────────────────────
  if (screen === 'create') return (
    <div className="lobby-screen">
      <header className="lobby-header"><div className="lobby-brand">Create a Room</div></header>
      <form className="lobby-form" onSubmit={handleCreate} noValidate>
        <section className="lobby-games" aria-label="Select game">
          {MULTIPLAYER_GAMES.map(g => (
            <button type="button" key={g.id}
              className={`lobby-game-card ${selectedGame === g.id ? 'selected' : ''}`}
              onClick={() => { setSelectedGame(g.id); setMaxPlayers(g.minPlayers); }}>
              <span className="game-card-icon">{g.icon}</span>
              <span className="game-card-label">{g.label}</span>
              <span className="game-card-desc">{g.minPlayers}–{g.maxPlayers} players</span>
            </button>
          ))}
        </section>
        <label className="lobby-form-label">Max Players</label>
        <select className="lobby-form-input" value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))}>
          {Array.from({ length: (MULTIPLAYER_GAMES.find(g => g.id === selectedGame)?.maxPlayers || 6) - 1 }, (_, i) => i + 2).map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {error && <div className="lobby-error">{error}</div>}
        <button className="lobby-start-btn" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create Room'}
        </button>
      </form>
      <footer className="lobby-footer">
        <button className="lobby-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setScreen('choose')}>← Back</button>
      </footer>
    </div>
  );

  // ── Screen: Join with Code ────────────────────────────────────────────────
  if (screen === 'join_code') return (
    <div className="lobby-screen">
      <header className="lobby-header"><div className="lobby-brand">Join with Code</div></header>
      <form className="lobby-form" onSubmit={handleJoinByCode} noValidate>
        <label className="lobby-form-label">Room Code (4 characters)</label>
        <input className="lobby-form-input" value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="XKQZ" maxLength={4} style={{ textTransform: 'uppercase', letterSpacing: 8, fontSize: 24, textAlign: 'center' }} />
        {error && <div className="lobby-error">{error}</div>}
        <button className="lobby-start-btn" type="submit" disabled={loading || roomCode.length < 4}>
          {loading ? 'Finding…' : 'Find Room'}
        </button>
      </form>
      <footer className="lobby-footer">
        <button className="lobby-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setScreen('choose')}>← Back</button>
      </footer>
    </div>
  );

  // ── Screen: Browse Rooms ──────────────────────────────────────────────────
  if (screen === 'browse') return (
    <div className="lobby-screen">
      <header className="lobby-header"><div className="lobby-brand">Open Rooms</div></header>
      {openRooms.length === 0
        ? <p style={{ textAlign: 'center', opacity: 0.6, marginTop: 32 }}>No open rooms yet — create one!</p>
        : (
          <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 520, margin: '0 auto' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #c9a84c' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Game</th>
                <th style={{ padding: '8px 12px' }}>Code</th>
                <th style={{ padding: '8px 12px' }}>Players</th>
                <th style={{ padding: '8px 12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {openRooms.map(r => (
                <tr key={r.room_id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px 12px' }}>{r.game_name}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace', fontSize: 18 }}>{r.room_code}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{r.player_count}/{r.max_players}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <button className="lobby-start-btn" style={{ padding: '6px 16px', fontSize: 13 }}
                      disabled={loading || r.player_count >= r.max_players}
                      onClick={() => handleJoinFromBrowse(r)}>
                      Join
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
      {error && <div className="lobby-error">{error}</div>}
      <footer className="lobby-footer">
        <button className="lobby-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setScreen('choose')}>← Back</button>
      </footer>
    </div>
  );

  // ── Screen: Room Waiting ──────────────────────────────────────────────────
  if (screen === 'waiting') return (
    <div className="lobby-screen">
      <header className="lobby-header">
        <div className="lobby-brand">Waiting Room</div>
        {room && (
          <p style={{ fontSize: 28, letterSpacing: 6, fontFamily: 'monospace', color: '#c9a84c', margin: '8px 0 0' }}>
            Share this code: <strong>{room.room_code}</strong>
          </p>
        )}
      </header>

      {/* Player seats */}
      <section style={{ maxWidth: 400, margin: '24px auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {room && Array.from({ length: room.max_players }).map((_, i) => {
          const player = room.players[i];
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 8,
              background: player ? '#1a2a3a' : '#111',
              border: `1px solid ${player ? '#c9a84c' : '#333'}`,
            }}>
              <span style={{ fontSize: 20, minWidth: 28 }}>{player ? '👤' : '⏳'}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>
                {player ? player.user_name : 'Waiting for player…'}
              </span>
              {player && (
                <span style={{ color: player.ready ? '#4caf50' : '#888', fontWeight: 700 }}>
                  {player.ready ? '✓ Ready' : '○ Not ready'}
                </span>
              )}
            </div>
          );
        })}
      </section>

      {error && <div className="lobby-error">{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto' }}>
        {me && (
          <button className="lobby-start-btn"
            style={{ background: me.ready ? '#555' : '#2d5a27' }}
            onClick={handleReady}>
            {me.ready ? 'Unready' : 'Ready'}
          </button>
        )}
        {isHost && (
          <button className="lobby-start-btn" onClick={handleStart}
            disabled={!allReady || loading}>
            {loading ? 'Starting…' : 'Start Game'}
          </button>
        )}
        <button className="lobby-start-btn" style={{ background: '#5a1a1a' }} onClick={handleLeave}>
          {isHost ? 'Cancel Room' : 'Leave Room'}
        </button>
      </div>
    </div>
  );

  return null;
}
