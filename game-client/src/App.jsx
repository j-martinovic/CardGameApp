// App.jsx — top-level routing for the game client.
//
// Screens:
//   'lobby'       — Lobby.jsx (game selection + name entry)
//   'multiplayer' — MultiplayerLobby.jsx (online room system)
//   'playground'  — PlaygroundPage.jsx (custom game builder)
//   'game'        — boardgame.io Client HOC (renders game board)
//
// No React Router used — simple state-machine routing.

import React, { useState } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { WarGame } from './games/war/War';
import WarBoard from './games/war/WarBoard';
import { GoFishGame } from './games/gofish/GoFish';
import GoFishBoard from './games/gofish/GoFishBoard';
import Lobby from './lobby/Lobby';
import MultiplayerLobby from './lobby/MultiplayerLobby';
import PlaygroundPage from './playground/PlaygroundPage';
import { useGameState } from './hooks/useGameState';

// const BGIO_SERVER = import.meta.env.VITE_BGIO_SERVER_URL || 'http://localhost:8000';
const BGIO_SERVER = 'http://localhost:8000';

// Build Client HOCs once outside render to avoid re-creation.
const WarClient = Client({
  game: WarGame,
  board: WarBoard,
  multiplayer: SocketIO({ server: BGIO_SERVER }),
  debug: false,
});

const GoFishClient = Client({
  game: GoFishGame,
  board: GoFishBoard,
  multiplayer: SocketIO({ server: BGIO_SERVER }),
  debug: false,
});

export default function App() {
  const { matchCredentials, joinMatch, leaveMatch, userName } = useGameState('Player');

  const [screen, setScreen] = useState('lobby');
  const [currentGame, setCurrentGame] = useState(null);

  // userId: read from URL param or sessionStorage (null = guest)
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId') || sessionStorage.getItem('userId') || null;
  const urlName = urlParams.get('userName') || null;
  if (urlName) sessionStorage.setItem('mp_name', urlName);

  function handleJoinMatch(gameName, matchID, playerID, playerName, playerCredentials) {
    joinMatch(matchID, playerID, playerName, playerCredentials);
    setCurrentGame(gameName);
    setScreen('game');
  }

  function handleQuit() {
    leaveMatch();
    setCurrentGame(null);
    setScreen('lobby');
  }



  // // ── Render game screen ────────────────────────────────────────────────────
  // if (screen === 'game' && matchCredentials) {
  //   const commonProps = {
  //     matchID: matchCredentials.matchID,
  //     playerID: matchCredentials.playerID,
  //     credentials: matchCredentials.playerCredentials,
  //     onQuit: handleQuit,
  //     playerName: matchCredentials.playerName,
  //   };

  //   if (currentGame === 'war') return <WarClient {...commonProps} />;
  //   if (currentGame === 'go_fish') return <GoFishClient {...commonProps} />;
  //   // Fallback: return to lobby
  //   handleQuit();
  // }

  // // ── Render multiplayer lobby ──────────────────────────────────────────────
  // if (screen === 'multiplayer') return (
  //   <MultiplayerLobby
  //     userId={userId}
  //     userName={urlName || sessionStorage.getItem('mp_name') || userName}
  //     onJoinMatch={handleJoinMatch}
  //     onBack={() => setScreen('lobby')}
  //   />
  // );

  // // ── Render playground ─────────────────────────────────────────────────────
  // if (screen === 'playground') return (
  //   <PlaygroundPage
  //     userId={userId}
  //     userName={urlName || sessionStorage.getItem('mp_name') || userName}
  //     onJoinMatch={handleJoinMatch}
  //     onBack={() => setScreen('lobby')}
  //   />
  // );

  // // ── Render main lobby ─────────────────────────────────────────────────────
  // return (
  //   <Lobby
  //     userName={urlName || userName}
  //     onJoinMatch={handleJoinMatch}
  //     onMultiplayer={() => setScreen('multiplayer')}
  //     onPlayground={() => setScreen('playground')}
  //   />
  // );

  // ── Render game screen ────────────────────────────────────────────────────
  if (screen === 'game') {
    // If the screen moved to game but the hook is still resolving credentials,
    // show a quick loading block instead of crashing or falling through to Lobby.
    if (!matchCredentials) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h3>Connecting to Game Server...</h3>
          <p>Synchronizing match credentials...</p>
          <button onClick={handleQuit} style={{ marginTop: '1rem' }}>Cancel</button>
        </div>
      );
    }

    const commonProps = {
      matchID: matchCredentials.matchID,
      playerID: matchCredentials.playerID,
      credentials: matchCredentials.playerCredentials,
      onQuit: handleQuit,
      playerName: matchCredentials.playerName,
    };

    if (currentGame === 'war') return <WarClient {...commonProps} />;
    if (currentGame === 'go_fish') return <GoFishClient {...commonProps} />;
    
    // Safe fallback inside the active game context loop
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Error: Game configuration "{currentGame}" not found.</p>
        <button onClick={handleQuit}>Return to Lobby</button>
      </div>
    );
  }

  // ── Render multiplayer lobby ──────────────────────────────────────────────
  if (screen === 'multiplayer') return (
    <MultiplayerLobby
      userId={userId}
      userName={urlName || sessionStorage.getItem('mp_name') || userName}
      onJoinMatch={handleJoinMatch}
      onBack={() => setScreen('lobby')}
    />
  );

  // ── Render playground ─────────────────────────────────────────────────────
  if (screen === 'playground') return (
    <PlaygroundPage
      userId={userId}
      userName={urlName || sessionStorage.getItem('mp_name') || userName}
      onJoinMatch={handleJoinMatch}
      onBack={() => setScreen('lobby')}
    />
  );

  // ── Render main lobby ─────────────────────────────────────────────────────
  return (
    <Lobby
      userName={urlName || userName}
      onJoinMatch={handleJoinMatch}
      onMultiplayer={() => setScreen('multiplayer')}
      onPlayground={() => setScreen('playground')}
    />
  );
}
