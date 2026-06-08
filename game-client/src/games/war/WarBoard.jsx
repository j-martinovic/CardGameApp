// WarBoard.jsx — boardgame.io board component for the War game.
//
// boardgame.io injects these props automatically via the Client HOC:
//   G          — game state (playerDeck, botDeck, lastPlayerCard, etc.)
//   ctx        — framework context (gameover, currentPlayer, phase, etc.)
//   moves      — { playCard } — triggers the playCard move on the server
//   playerID   — '0' (always, single-player)
//   isActive   — bool — whether the local player can move right now
//
// This component owns all animation timing via local state and useEffect.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import BotArea from '../../components/BotArea';
import PlayerArea from '../../components/PlayerArea';
import GameResult from '../../components/GameResult';
import { BOT_DELAY_MS, RESULT_DELAY_MS, BOT_DISPLAY_NAME } from './WarAI';
import './WarBoard.css';

export default function WarBoard({ G, ctx, moves, playerID, isActive, onQuit, playerName }) {
  // ── Animation state ─────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('idle'); // idle | animating | done
  const [playerFlipped, setPlayerFlipped] = useState(false);
  const [botFlipped, setBotFlipped] = useState(false);
  const [displayPlayerCard, setDisplayPlayerCard] = useState(null);
  const [displayBotCard, setDisplayBotCard] = useState(null);
  const [roundKey, setRoundKey] = useState(0); // forces remount of FlipCard

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // ── Handle play card (animation timeline) ───────────────────────────────────

  const handlePlayCard = useCallback(() => {
    if (phase !== 'idle' || !isActive || G.playerDeck.length === 0) return;
    setPhase('animating');
    setPlayerFlipped(false);
    setBotFlipped(false);

    // T+0: show player's card face-down (new round key resets flip CSS)
    setRoundKey((k) => k + 1);

    // Trigger the boardgame.io move — server resolves the round immediately.
    moves.playCard();

    // T+80ms: flip player's card
    setTimeout(() => {
      if (!mountedRef.current) return;
      setPlayerFlipped(true);
    }, 80);

    // T+BOT_DELAY_MS: show bot's card
    setTimeout(() => {
      if (!mountedRef.current) return;
      setBotFlipped(false); // reset bot flip
    }, BOT_DELAY_MS);

    // T+BOT_DELAY_MS+80ms: flip bot's card
    setTimeout(() => {
      if (!mountedRef.current) return;
      setBotFlipped(true);
    }, BOT_DELAY_MS + 80);

    // T+RESULT_DELAY_MS: allow next play
    setTimeout(() => {
      if (!mountedRef.current) return;
      setPhase('idle');
    }, RESULT_DELAY_MS);
  }, [phase, isActive, G, moves]);

  // Sync displayed cards from G after the server responds.
  // G.lastPlayerCard / G.lastBotCard update when the server processes the move.
  useEffect(() => {
    if (G.lastPlayerCard) setDisplayPlayerCard(G.lastPlayerCard);
    if (G.lastBotCard)    setDisplayBotCard(G.lastBotCard);
  }, [G.lastPlayerCard, G.lastBotCard, G.roundCount]);

  // Spacebar shortcut
  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space' && phase === 'idle' && !ctx.gameover) {
        e.preventDefault();
        handlePlayCard();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, ctx.gameover, handlePlayCard]);

  // ── Round result label ──────────────────────────────────────────────────────
  const roundResult = G.roundResult; // 'player' | 'bot' | 'draw' | null

  // Detect war round
  const isWarRound = G.warSequences && G.warSequences.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="war-board">
      {/* ── Bot's side ─────────────────────────────────────────────────────── */}
      <BotArea
        deckCount={G.botDeck.length}
        playedCard={displayBotCard}
        flipped={botFlipped}
        roundResult={phase === 'idle' ? roundResult : null}
        botName={BOT_DISPLAY_NAME}
      />

      {/* ── Table center ───────────────────────────────────────────────────── */}
      <div className="war-table-center">
        {isWarRound && phase === 'idle' && roundResult && (
          <div className="war-badge" role="status" aria-live="polite">
            WAR!
          </div>
        )}
        {!isWarRound && phase === 'idle' && roundResult && (
          <div className={`round-result-badge result-${roundResult}`} role="status" aria-live="polite">
            {roundResult === 'player' ? 'You win the round' : roundResult === 'bot' ? 'House wins' : 'Draw'}
          </div>
        )}
        <div className="round-counter" aria-label={`Round ${G.roundCount}`}>
          Round {G.roundCount}
        </div>
      </div>

      {/* ── Player's side ──────────────────────────────────────────────────── */}
      <PlayerArea
        deckCount={G.playerDeck.length}
        playedCard={displayPlayerCard}
        flipped={playerFlipped}
        roundResult={phase === 'idle' ? roundResult : null}
        playerName={playerName || `Player ${playerID}`}
        onPlayCard={handlePlayCard}
        canPlay={phase === 'idle' && isActive && !ctx.gameover}
        key={roundKey}
      />

      {/* ── Controls bar ───────────────────────────────────────────────────── */}
      <div className="war-controls">
        {!ctx.gameover && (
          <p className="war-hint">
            Click your deck or press <kbd>Space</kbd> to play a card.
          </p>
        )}
        <button className="war-quit-btn" onClick={onQuit} type="button">
          Quit
        </button>
      </div>

      {/* ── Game over overlay ──────────────────────────────────────────────── */}
      {ctx.gameover && (
        <GameResult
          result={ctx.gameover}
          roundCount={G.roundCount}
          playerName={playerName || 'Player'}
          onQuit={onQuit}
        />
      )}
    </div>
  );
}
