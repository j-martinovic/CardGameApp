// GoFishBoard.jsx — React board for Go Fish following the WarBoard pattern.

import React, { useState } from 'react';
import Card from '../../components/Card';
import CardBack from '../../components/CardBack';
import GameResult from '../../components/GameResult';

const containerStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse at center, #1a3a1a 0%, #0d1f0d 100%)',
  color: '#e8d5a3',
  fontFamily: 'Georgia, serif',
  padding: 16,
  boxSizing: 'border-box',
};

const sectionStyle = {
  background: 'rgba(0,0,0,0.4)',
  borderRadius: 12,
  border: '1px solid #c9a84c44',
  padding: 12,
  marginBottom: 12,
};

export default function GoFishBoard({ G, ctx, moves, playerID, onQuit, playerName }) {
  const [selectedRank, setSelectedRank] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);

  if (!G || !ctx) return <div style={containerStyle}>Connecting…</div>;

  const myID = playerID || '0';
  const myHand = G.players?.[myID]?.hand || [];
  const myBooks = G.players?.[myID]?.books || [];
  const isMyTurn = ctx.currentPlayer === myID;
  const gameover = ctx.gameover;

  const opponentIDs = Object.keys(G.players || {}).filter(id => id !== myID);

  function handleAsk() {
    if (!selectedTarget || !selectedRank) return;
    moves.askForCards(selectedTarget, selectedRank);
    setSelectedRank(null);
    setSelectedTarget(null);
  }

  function handlePass() {
    moves.passTurn();
    setSelectedRank(null);
    setSelectedTarget(null);
  }

  if (gameover) {
    const didWin = gameover.winner === myID;
    return (
      <div style={containerStyle}>
        <GameResult
          result={didWin ? 'win' : 'lose'}
          playerScore={myBooks.length}
          opponentScore={G.players?.[opponentIDs[0]]?.books?.length ?? 0}
          onQuit={onQuit}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Go Fish banner */}
      {G.currentAsk?.result === 'go_fish' && G.currentAsk?.askerID === myID && (
        <div style={{
          textAlign: 'center', padding: '8px 16px', marginBottom: 12,
          background: '#c9a84c22', border: '1px solid #c9a84c',
          borderRadius: 8, fontSize: 20, color: '#c9a84c',
        }}>
          🐟 Go Fish! {G.currentAsk.drawnCard
            ? `Drew ${G.currentAsk.drawnCard.rank}${G.currentAsk.drawnCard.suit}${G.currentAsk.drawnMatchesAsk ? ' — matched! Ask again.' : '.'}`
            : ''}
        </div>
      )}

      {/* Opponents */}
      {opponentIDs.map(oid => {
        const opp = G.players[oid];
        return (
          <div key={oid} style={{ ...sectionStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSelectedTarget(oid === selectedTarget ? null : oid)}
              style={{
                background: selectedTarget === oid ? '#c9a84c' : '#1a3a5c',
                color: selectedTarget === oid ? '#000' : '#e8d5a3',
                border: `2px solid ${selectedTarget === oid ? '#c9a84c' : '#2a4a6c'}`,
                borderRadius: 8, padding: '6px 14px', cursor: isMyTurn ? 'pointer' : 'default',
                fontWeight: 600, fontFamily: 'Georgia, serif', fontSize: 14,
              }}
              disabled={!isMyTurn}
            >
              P{oid} {selectedTarget === oid ? '✓' : ''}
            </button>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {Array.from({ length: opp.hand.length }).map((_, i) => (
                <CardBack key={i} width={36} height={50} />
              ))}
              {opp.hand.length === 0 && <span style={{ opacity: 0.5, fontSize: 12 }}>Empty hand</span>}
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>
              {opp.hand.length} cards &bull; {opp.books.length} books
            </span>
          </div>
        );
      })}

      {/* Ocean / Draw pile */}
      <div style={{ ...sectionStyle, textAlign: 'center' }}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Ocean (Draw Pile)</div>
        <div style={{ display: 'inline-block' }}>
          <CardBack width={54} height={76} />
        </div>
        <div style={{ fontSize: 13, marginTop: 4 }}>{G.drawPile?.length ?? 0} cards remaining</div>
      </div>

      {/* Books display */}
      <div style={{ ...sectionStyle }}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Your Books ({myBooks.length})</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {myBooks.map((book, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: '#c9a84c22', borderRadius: 6, padding: '4px 8px',
              border: '1px solid #c9a84c55',
            }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{book.rank}</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>book of 4</span>
            </div>
          ))}
          {myBooks.length === 0 && <span style={{ opacity: 0.5, fontSize: 13 }}>No books yet</span>}
        </div>
      </div>

      {/* My hand */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
          Your Hand ({myHand.length} cards)
          {!isMyTurn && <span style={{ marginLeft: 8, color: '#c9a84c' }}>— Waiting for your turn…</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {myHand.map((card, i) => (
            <button key={i} onClick={() => isMyTurn && setSelectedRank(card.rank === selectedRank ? null : card.rank)}
              style={{
                background: 'none', border: 'none', cursor: isMyTurn ? 'pointer' : 'default',
                padding: 2, borderRadius: 6,
                outline: selectedRank === card.rank ? '2px solid #c9a84c' : 'none',
              }}>
              <Card rank={card.rank} suit={card.suit} faceUp width={60} height={84} />
            </button>
          ))}
          {myHand.length === 0 && <span style={{ opacity: 0.5 }}>No cards in hand</span>}
        </div>
      </div>

      {/* Action area */}
      {isMyTurn && (
        <div style={{ ...sectionStyle, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14 }}>
            {selectedTarget && selectedRank
              ? `Ask P${selectedTarget} for ${selectedRank}s`
              : selectedTarget ? 'Now click a rank in your hand'
              : 'Click an opponent, then a rank in your hand'}
          </div>
          <button
            onClick={handleAsk}
            disabled={!selectedTarget || !selectedRank}
            style={{
              background: selectedTarget && selectedRank ? '#c9a84c' : '#333',
              color: selectedTarget && selectedRank ? '#000' : '#666',
              border: 'none', borderRadius: 6, padding: '8px 20px',
              cursor: selectedTarget && selectedRank ? 'pointer' : 'not-allowed',
              fontWeight: 700, fontFamily: 'Georgia, serif',
            }}>
            Ask
          </button>
          <button onClick={handlePass}
            style={{
              background: '#333', color: '#e8d5a3', border: '1px solid #555',
              borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Georgia, serif',
            }}>
            Pass
          </button>
        </div>
      )}

      {/* Action log */}
      <div style={{ ...sectionStyle, maxHeight: 120, overflowY: 'auto' }}>
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Action Log</div>
        {(G.actionLog || []).slice(0, 5).map((entry, i) => (
          <div key={i} style={{ fontSize: 13, padding: '2px 0', borderBottom: '1px solid #333', opacity: i === 0 ? 1 : 0.6 }}>
            {entry}
          </div>
        ))}
        {(!G.actionLog || G.actionLog.length === 0) && (
          <div style={{ opacity: 0.4, fontSize: 13 }}>No actions yet</div>
        )}
      </div>

      {/* Quit */}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button onClick={onQuit}
          style={{
            background: 'none', border: '1px solid #5a2a2a', color: '#c88', borderRadius: 6,
            padding: '6px 18px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13,
          }}>
          Quit Game
        </button>
      </div>
    </div>
  );
}
