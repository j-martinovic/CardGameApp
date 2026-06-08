// App.jsx — top-level routing for the game client.
//
// Screens:
//   'lobby'  — Lobby.jsx (game selection + name entry)
//   'game'   — boardgame.io Client HOC (renders WarBoard.jsx)
//
// No React Router used — the game client only has two screens and
// simple state-machine routing is clearer than URL-based routing here.

import React, { useState } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { WarGame } from './games/war/War';
import WarBoard from './games/war/WarBoard';
import Lobby from './lobby/Lobby';
import { useGameState } from './hooks/useGameState';

const BGIO_SERVER = import.meta.env.VITE_BGIO_SERVER_URL || 'http://localhost:8000';

// Build the boardgame.io WarClient once (outside render to avoid re-creation).
// The Client HOC handles Socket.IO connection and injects G/ctx/moves into WarBoard.
const WarClient = Client({
  game: WarGame,
  board: WarBoard,
  multiplayer: SocketIO({ server: BGIO_SERVER }),
  debug: false,
});

export default function App() {
  const { matchCredentials, joinMatch, leaveMatch, userName } = useGameState('Player');

  const [currentGame, setCurrentGame] = useState(null); // 'war' | null (extensible)

  function handleJoinMatch(gameName, matchID, playerID, playerName, playerCredentials) {
    joinMatch(matchID, playerID, playerName, playerCredentials);
    setCurrentGame(gameName);
  }

  function handleQuit() {
    leaveMatch();
    setCurrentGame(null);
  }

  // ── Render game screen ───────────────────────────────────────────────────
  if (currentGame === 'war' && matchCredentials) {
    return (
      <WarClient
        matchID={matchCredentials.matchID}
        playerID={matchCredentials.playerID}
        credentials={matchCredentials.playerCredentials}
        // Extra props forwarded to WarBoard via boardgame.io's passThrough.
        // WarBoard reads these from its own props.
        onQuit={handleQuit}
        playerName={matchCredentials.playerName}
      />
    );
  }

  // ── Render lobby ─────────────────────────────────────────────────────────
  return (
    <Lobby
      userName={userName}
      onJoinMatch={handleJoinMatch}
    />
  );
}
