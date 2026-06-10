// CustomBoard.jsx — generic board component that renders a custom game built from CustomGameTemplate.
// Receives G, ctx, moves from the boardgame.io Client HOC.

import React, { useState } from 'react';
import Card from '../components/Card';
import CardBack from '../components/CardBack';
import GameResult from '../components/GameResult';

const containerStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse at center, #1a2a1a 0%, #0d0f0d 100%)',
  color: '#e8d5a3',
  fontFamily: 'Georgia, serif',
  padding: 16,
  boxSizing: 'border-box',
};

const panelStyle = {
  background: 'rgba(0,0,0,0.4)',
  borderRadius: 10,
  border: '1px solid #c9a84c33',
  padding: 12,
  marginBottom: 10,
};

const btnStyle = (active, disabled) => ({
  background: disabled ? '#222' : active ? '#c9a84c' : '#1a3a2a',
  color: disabled ? '#555' : active ? '#000' : '#e8d5a3',
  border: `1px solid ${disabled ? '#333' : '#c9a84c55'}`,
  borderRadius: 6,
  padding: '8px 18px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: active ? 700 : 400,
  fontFamily: 'Georgia, serif',
  fontSize: 14,
});

export default function CustomBoard({ G, ctx, moves, playerID, onQuit, playerName }) {
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [chosenSuit, setChosenSuit] = useState('♠');

  if (!G || !ctx) return <div style={containerStyle}>Connecting…</div>;

  const myID = playerID || '0';
  const isMyTurn = ctx.currentPlayer === myID;
  const gameover = ctx.gameover;
  const rules = G.rules || {};
  const layout = rules.tableLayout || {};
  const apt = rules.actionsPerTurn || {};
  const me = G.players?.[myID] || { hand: [], score: 0, chips: 0, sets: [], tricksWon: 0 };
  const opponentIDs = Object.keys(G.players || {}).filter(id => id !== myID);

  if (gameover) {
    const didWin = gameover.winner === myID;
    return (
      <div style={containerStyle}>
        <GameResult
          result={didWin ? 'win' : 'lose'}
          playerScore={me.score}
          opponentScore={G.players?.[opponentIDs[0]]?.score ?? 0}
          onQuit={onQuit}
        />
      </div>
    );
  }

  function handleDraw() { moves.drawCard('draw_pile'); }
  function handleDrawDiscard() { moves.drawCard('discard_pile'); }
  function handleDiscard() {
    if (selectedCardIndex === null) return;
    moves.discardCard(selectedCardIndex, apt.discardTo || 'discard_pile');
    setSelectedCardIndex(null);
  }
  function handlePlay() {
    if (selectedCardIndex === null) return;
    moves.playCard(selectedCardIndex, null);
    setSelectedCardIndex(null);
  }
  function handlePass() { moves.passTurn(); }
  function handleRoll() { moves.rollDice(); }
  function handleChooseWild() { moves.chooseWild(chosenSuit, null); }

  const showDraw = layout.drawPilePosition !== 'none';
  const showDiscard = layout.discardPilePosition !== 'none';
  const topDiscard = G.discardPile?.length > 0 ? G.discardPile[G.discardPile.length - 1] : null;

  return (
    <div style={containerStyle}>
      {/* Special effect banner */}
      {G.lastSpecialEffect && G.lastSpecialEffect !== null && (
        <div style={{ textAlign: 'center', padding: '8px 16px', marginBottom: 10, background: '#c9a84c22', border: '1px solid #c9a84c', borderRadius: 8, fontSize: 16, color: '#c9a84c' }}>
          {G.lastSpecialEffect.replace(/_/g, ' ')}
        </div>
      )}

      {/* Wild suit chooser */}
      {G.lastSpecialEffect === 'wild_suit' && isMyTurn && (
        <div style={{ ...panelStyle, textAlign: 'center' }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Choose a suit:</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {['♠','♥','♦','♣'].map(s => (
              <button key={s} onClick={() => setChosenSuit(s)}
                style={{ ...btnStyle(chosenSuit === s, false), fontSize: 22, padding: '6px 14px' }}>{s}</button>
            ))}
          </div>
          <button onClick={handleChooseWild} style={{ ...btnStyle(true, false), marginTop: 10 }}>Confirm</button>
        </div>
      )}

      {/* Opponents */}
      {opponentIDs.map(oid => {
        const opp = G.players[oid];
        return (
          <div key={oid} style={{ ...panelStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong style={{ minWidth: 50, fontSize: 13 }}>P{oid}</strong>
            <div style={{ display: 'flex', gap: 3, flex: 1, flexWrap: 'wrap' }}>
              {layout.handVisible === 'face_up_to_all'
                ? opp.hand.map((c, i) => <Card key={i} rank={c.rank} suit={c.suit} faceUp width={38} height={54} />)
                : Array.from({ length: opp.hand.length }).map((_, i) => <CardBack key={i} width={38} height={54} />)
              }
            </div>
            {layout.showCardCount !== false && (
              <span style={{ fontSize: 12, opacity: 0.6 }}>{opp.hand.length} cards</span>
            )}
            {rules.scoring?.enabled && (
              <span style={{ fontSize: 12, color: '#c9a84c' }}>Score: {opp.score}</span>
            )}
          </div>
        );
      })}

      {/* Center area: draw + discard piles */}
      <div style={{ ...panelStyle, display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'center' }}>
        {showDraw && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Draw Pile</div>
            {G.drawPile?.length > 0
              ? <CardBack width={60} height={84} />
              : <div style={{ width: 60, height: 84, border: '2px dashed #333', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, opacity: 0.4 }}>Empty</div>
            }
            <div style={{ fontSize: 11, marginTop: 4 }}>{G.drawPile?.length ?? 0} left</div>
          </div>
        )}

        {showDiscard && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Discard</div>
            {topDiscard
              ? <Card rank={topDiscard.rank} suit={topDiscard.suit} faceUp width={60} height={84} />
              : <div style={{ width: 60, height: 84, border: '2px dashed #333', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, opacity: 0.4 }}>Empty</div>
            }
            <div style={{ fontSize: 11, marginTop: 4 }}>{G.discardPile?.length ?? 0} cards</div>
          </div>
        )}

        {/* Community cards */}
        {rules.accessories?.communityCards?.enabled && G.communityCards?.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Community</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {G.communityCards.map((c, i) => (
                c.faceUp
                  ? <Card key={i} rank={c.rank} suit={c.suit} faceUp width={44} height={62} />
                  : <CardBack key={i} width={44} height={62} />
              ))}
            </div>
          </div>
        )}

        {/* Dice */}
        {rules.accessories?.dice?.enabled && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Dice</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(G.diceValues || []).map((v, i) => (
                <div key={i} style={{ width: 36, height: 36, background: '#e8d5a3', color: '#000', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>{v}</div>
              ))}
            </div>
          </div>
        )}

        {/* Chip pot */}
        {rules.accessories?.chips?.enabled && G.pot > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Pot</div>
            <div style={{ fontSize: 20, color: '#c9a84c', fontWeight: 700 }}>{G.pot}</div>
          </div>
        )}
      </div>

      {/* Table piles */}
      {G.tablePiles?.length > 0 && (
        <div style={{ ...panelStyle }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>Table Piles</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {G.tablePiles.map((pile, pi) => (
              <div key={pi} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{pile.id}</div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {pile.cards.slice(-4).map((c, i) => (
                    c.faceUp
                      ? <Card key={i} rank={c.rank} suit={c.suit} faceUp width={40} height={56} />
                      : <CardBack key={i} width={40} height={56} />
                  ))}
                  {pile.cards.length === 0 && (
                    <div style={{ width: 40, height: 56, border: '2px dashed #333', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, opacity: 0.4 }}>
                      {pile.acceptRule?.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My hand */}
      <div style={panelStyle}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
          Your Hand ({me.hand.length} cards)
          {rules.scoring?.enabled && <span style={{ marginLeft: 10, color: '#c9a84c' }}>Score: {me.score}</span>}
          {rules.accessories?.chips?.enabled && <span style={{ marginLeft: 10, color: '#f0c' }}>Chips: {me.chips}</span>}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {me.hand.map((card, i) => (
            <button key={i} onClick={() => isMyTurn && setSelectedCardIndex(i === selectedCardIndex ? null : i)}
              style={{
                background: 'none', border: 'none', cursor: isMyTurn ? 'pointer' : 'default', padding: 2, borderRadius: 6,
                outline: selectedCardIndex === i ? '2px solid #c9a84c' : 'none',
              }}>
              <Card rank={card.rank} suit={card.suit} faceUp width={60} height={84} />
            </button>
          ))}
          {me.hand.length === 0 && <span style={{ opacity: 0.5 }}>No cards in hand</span>}
        </div>
      </div>

      {/* Action buttons */}
      {isMyTurn && (
        <div style={{ ...panelStyle, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(apt.mayDraw || apt.mustDraw) && (
            <button style={btnStyle(false, G.drawPile?.length === 0)} disabled={G.drawPile?.length === 0} onClick={handleDraw}>Draw</button>
          )}
          {apt.drawFrom === 'discard_pile' || apt.drawFrom === 'either' ? (
            <button style={btnStyle(false, G.discardPile?.length === 0)} disabled={G.discardPile?.length === 0} onClick={handleDrawDiscard}>Draw Discard</button>
          ) : null}
          {(apt.mayDiscard || apt.mustDiscard) && (
            <button style={btnStyle(false, selectedCardIndex === null)} disabled={selectedCardIndex === null} onClick={handleDiscard}>Discard</button>
          )}
          {(apt.mayPlayToTable || apt.mustPlayCard) && (
            <button style={btnStyle(false, selectedCardIndex === null)} disabled={selectedCardIndex === null} onClick={handlePlay}>Play Card</button>
          )}
          {apt.mayPickUpDiscardPile && (
            <button style={btnStyle(false, G.discardPile?.length === 0)} disabled={G.discardPile?.length === 0} onClick={() => moves.pickUpDiscardPile()}>Pick Up Pile</button>
          )}
          {rules.accessories?.dice?.enabled && rules.accessories?.dice?.rollWhen === 'on_demand' && (
            <button style={btnStyle(false, false)} onClick={handleRoll}>Roll Dice</button>
          )}
          <button style={btnStyle(false, false)} onClick={handlePass}>Pass</button>
        </div>
      )}
      {!isMyTurn && <div style={{ textAlign: 'center', opacity: 0.5, fontSize: 13, marginBottom: 10 }}>Waiting for Player {ctx.currentPlayer}…</div>}

      {/* Quit */}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button onClick={onQuit}
          style={{ background: 'none', border: '1px solid #5a2a2a', color: '#c88', borderRadius: 6, padding: '6px 18px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13 }}>
          Quit
        </button>
      </div>
    </div>
  );
}
