import React from 'react';

export default function TestBoard({ G, ctx, moves, playerID, matchID }) {
  // Determine game status
  const isMyTurn = ctx.currentPlayer === playerID;
  const winner = ctx.gameover;

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      backgroundColor: '#1e1e1e',
      color: '#fff',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <h2 style={{ color: '#c9a84c', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        ⚙️ boardgame.io Testing Board
      </h2>

      {/* Network Connection Info */}
      <div style={{ background: '#2d2d2d', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
        <p style={{ margin: '4px 0' }}><strong>Match ID:</strong> {matchID || 'Local Mode'}</p>
        <p style={{ margin: '4px 0' }}><strong>Your Player Seat:</strong> {playerID !== null ? `Player ${playerID}` : 'Spectator'}</p>
        <p style={{ margin: '4px 0' }}><strong>Current Turn Position:</strong> Player {ctx.currentPlayer}</p>
      </div>

      {/* Turn Alert Status */}
      {winner ? (
        <div style={{ padding: '10px', background: '#2e5a27', color: '#fff', fontWeight: 'bold', borderRadius: '4px' }}>
          🎉 Game Over! Winner: Player {winner.winner}
        </div>
      ) : (
        <div style={{
          padding: '10px',
          background: isMyTurn ? '#1a3a5c' : '#3a3a3a',
          color: '#fff',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}>
          {isMyTurn ? "🟢 IT'S YOUR TURN! Make a move." : "⏳ Waiting for opponent..."}
        </div>
      )}

      {/* Interaction Testing Section */}
      <div style={{ marginTop: '25px' }}>
        <h3>[ Test Moves ]</h3>
        
        {/* standard play card target button */}
        <button 
          onClick={() => {
            if (moves.playCard) {
              moves.playCard();
            } else if (moves.askForCards) {
              // Quick mock payload for Go Fish testing
              moves.askForCards({ targetPlayerID: playerID === '0' ? '1' : '0', rank: 'A' });
            } else {
              console.log("No recognized move method found on this game object layout.");
            }
          }}
          disabled={!isMyTurn || !!winner}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: isMyTurn ? '#4caf50' : '#555',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isMyTurn ? 'pointer' : 'not-allowed',
          }}
        >
          Execute Game Move Action
        </button>
      </div>

      {/* Raw State Inspection — Crucial for diagnosing data structure issues */}
      <div style={{ marginTop: '35px' }}>
        <h3>[ Live State Data Tree (G) ]</h3>
        <pre style={{
          background: '#000',
          padding: '15px',
          borderRadius: '4px',
          overflowX: 'auto',
          fontSize: '12px',
          color: '#00ff00'
        }}>
          {JSON.stringify(G, null, 2)}
        </pre>
      </div>
    </div>
  );
}