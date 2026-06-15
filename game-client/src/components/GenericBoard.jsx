/*
 * GenericBoard.jsx — Phase 0 Audit Summary
 *
 * SHARED HANDLERS AVAILABLE (from game-client/src/shared_handlers/):
 *   useCardInteractions(moves, G) → selectCard, deselectCard, playCard, discardCard,
 *     drawCard, sortHand, revealCard, shuffleReset, snapCardBack, peekCard,
 *     cutDeck, burnCard, markCardHeld
 *   useBetting(moves, G) → placeBid, raiseBet, callBet, fold, check, passBid,
 *     setTrumpSuit, bidTimeoutAutopass, enforceMinimumRaise, postAnteBlind,
 *     activateTimeBank, resolveSplitPot, straddle, runItTwice
 *   useTurnRound(moves, G) → startGame, endTurn, startNextRound, forfeit,
 *     turnTimeoutAutoplay, undoLastAction, restoreReconnectionState, forceResync
 *   usePlayerActions(moves, G) → claimTrick, challengePlay, meldDeclare, swapCards,
 *     declareWin, splitHandBlackjack, insuranceBet, rebuyChips, sitOutNextHand
 *   useSocial(roomID) → sendChatMessage, sendEmojiReaction, sendQuickPhrase,
 *     mutePlayer, reportPlayer, blockPlayer, sendSpectatorChat  (REST, not moves)
 *   useScoring(moves, G) → updateScore, unlockAchievement, exportHandHistory, kibitzReplayStep
 *   useDebug(moves, G) → forceSpecificDeal, revealAllHands, simulateDisconnect,
 *     stepGameState, dumpGameLog  (DEV only)
 *
 * WAR ZONES NEEDED:
 *   opponentHand (stacked: bot deck pile + animated play slot)
 *   playerHand   (stacked: player deck pile + animated play slot, clickable)
 *   centerPlay   (versus: round-result badge, WAR! badge, round counter)
 *   score        (deck-count comparison)
 *   chat         (optional side panel)
 *   action       ('Flip Card' button, quit)
 *   status       (round counter, whose turn)
 *   gameResult   (win/lose/draw overlay)
 *
 * GO FISH ZONES NEEDED:
 *   opponentHand (fan: N face-down cards per opponent, click-to-select-target)
 *   playerHand   (fan: face-up hand, click-to-select-rank)
 *   centerPlay   (request: current ask status + Go Fish! banner)
 *   drawPile     (ocean, face-down stack with card count)
 *   score        (books count per player)
 *   chat         (optional)
 *   action       ('Ask for Card', 'Pass Turn', 'Sort Hand', 'Declare Win')
 *   status       (whose turn, current ask)
 *   gameResult   (winner display)
 *
 * MINIMAL SHARED ZONES (any 2-player card game):
 *   status, gameResult, action — always enabled regardless of config
 *   opponentHand, playerHand, centerPlay, score — needed for head-to-head play
 *   chat — optional but universal; drawPile and discardPile are game-specific
 */

import React, { useState } from 'react';

import { useCardInteractions } from '../shared_handlers/useCardInteractions';
import { useBetting }          from '../shared_handlers/useBetting';
import { useTurnRound }        from '../shared_handlers/useTurnRound';
import { usePlayerActions }    from '../shared_handlers/usePlayerActions';
import { useSocial }           from '../shared_handlers/useSocial';
import { useScoring }          from '../shared_handlers/useScoring';

import StatusZone       from './zones/StatusZone';
import OpponentHandZone from './zones/OpponentHandZone';
import CenterPlayZone   from './zones/CenterPlayZone';
import PlayerHandZone   from './zones/PlayerHandZone';
import DrawPileZone     from './zones/DrawPileZone';
import DiscardPileZone  from './zones/DiscardPileZone';
import ScoreZone        from './zones/ScoreZone';
import ChatZone         from './zones/ChatZone';
import ActionZone       from './zones/ActionZone';
import GameResultZone   from './zones/GameResultZone';

import './GenericBoard.css';

export const defaultSandboxConfig = {
  gameName: 'Sandbox',
  layout: 'versus',
  theme: 'retro-poker',
  zones: {
    opponentHand: { enabled: true, layout: 'stacked', opponentName: 'Opponent', deckField: 'botDeck', playedCardField: 'lastBotCard', roundResultField: 'roundResult', roundCountField: 'roundCount', flipPreDelayMs: 700, flipDelayMs: 80 },
    playerHand:   { enabled: true, layout: 'stacked', deckField: 'playerDeck', playedCardField: 'lastPlayerCard', roundResultField: 'roundResult', roundCountField: 'roundCount', flipDelayMs: 80, flipPreDelayMs: 0 },
    centerPlay:   { enabled: true, style: 'versus', roundResultField: 'roundResult', roundCountField: 'roundCount', warField: 'warSequences' },
    discardPile:  { enabled: true, pileField: 'discardPile', label: 'Discard' },
    drawPile:     { enabled: true, drawable: true, pileField: 'drawPile', label: 'Draw Pile' },
    score:        { enabled: true, label: 'Score', dataSource: 'decks', playerDeckField: 'playerDeck', opponentDeckField: 'botDeck', playerLabel: 'Player', opponentLabel: 'Opponent' },
    chat:         { enabled: true },
    action:       { enabled: true },
  },
  actions: [
    { label: 'Play Card',   handler: 'playCard',   phase: 'any' },
    { label: 'Draw Card',   handler: 'drawCard',   phase: 'any' },
    { label: 'End Turn',    handler: 'endTurn',    phase: 'any' },
    { label: 'Sort Hand',   handler: 'sortHand',   phase: 'any' },
    { label: 'Declare Win', handler: 'declareWin', phase: 'any' },
  ],
  timer: { enabled: false },
  moveOverrides: {},
};

export default function GenericBoard({
  G = {},
  ctx = {},
  moves = {},
  playerID,
  config,
  sandboxMode = false,
  onQuit,
  onPlayAgain,
  playerName,
  matchID,
}) {
  const effectiveConfig = config || defaultSandboxConfig;

  // ── Shared hooks ──────────────────────────────────────────────────────────
  const cardActions   = useCardInteractions(moves, G);
  const betting       = useBetting(moves, G);
  const turnRound     = useTurnRound(moves, G);
  const playerActions = usePlayerActions(moves, G);
  const social        = useSocial(matchID || '');
  const scoring       = useScoring(moves, G);

  // ── Base handlers assembled from all hooks ────────────────────────────────
  const baseHandlers = {
    selectCard:        cardActions.selectCard,
    deselectCard:      cardActions.deselectCard,
    playCard:          cardActions.playCard,
    discardCard:       cardActions.discardCard,
    drawCard:          cardActions.drawCard,
    sortHand:          cardActions.sortHand,
    revealCard:        cardActions.revealCard,
    shuffleReset:      cardActions.shuffleReset,
    snapCardBack:      cardActions.snapCardBack,
    peekCard:          cardActions.peekCard,
    cutDeck:           cardActions.cutDeck,
    burnCard:          cardActions.burnCard,
    markCardHeld:      cardActions.markCardHeld,
    placeBid:          betting.placeBid,
    raiseBet:          betting.raiseBet,
    callBet:           betting.callBet,
    fold:              betting.fold,
    check:             betting.check,
    startGame:         turnRound.startGame,
    endTurn:           turnRound.endTurn,
    startNextRound:    turnRound.startNextRound,
    forfeit:           turnRound.forfeit,
    undoLastAction:    turnRound.undoLastAction,
    forceResync:       turnRound.forceResync,
    claimTrick:        playerActions.claimTrick,
    challengePlay:     playerActions.challengePlay,
    meldDeclare:       playerActions.meldDeclare,
    swapCards:         playerActions.swapCards,
    declareWin:        playerActions.declareWin,
    rebuyChips:        playerActions.rebuyChips,
    sitOutNextHand:    playerActions.sitOutNextHand,
    updateScore:       scoring.updateScore,
    unlockAchievement: scoring.unlockAchievement,
    exportHandHistory: scoring.exportHandHistory,
    sendChatMessage:   social.sendChatMessage,
    sendEmojiReaction: social.sendEmojiReaction,
    sendQuickPhrase:   social.sendQuickPhrase,
    mutePlayer:        social.mutePlayer,
    reportPlayer:      social.reportPlayer,
    blockPlayer:       social.blockPlayer,
  };

  // Apply per-game move overrides (maps abstract names to actual bgio moves)
  const overrides = effectiveConfig.moveOverrides || {};
  const handlers = Object.keys(overrides).length > 0
    ? {
        ...baseHandlers,
        ...Object.fromEntries(
          Object.entries(overrides).map(([key, fn]) => [key, (...args) => fn(moves, G, ...args)])
        ),
      }
    : baseHandlers;

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isAnimating, setIsAnimating] = useState(false);
  const [selection, setSelection] = useState({ cardIndex: null, rank: null, target: null });

  // ── Sandbox zone override state ───────────────────────────────────────────
  const [sandboxOverrides, setSandboxOverrides] = useState({});
  const [sandboxPreview, setSandboxPreview] = useState(false);

  const zoneEnabled = (name) => {
    if (sandboxMode && !sandboxPreview) return true;
    const override = sandboxOverrides[name];
    if (override !== undefined) return override;
    return effectiveConfig.zones?.[name]?.enabled ?? false;
  };

  const zoneConfig = (name) => ({
    ...(effectiveConfig.zones?.[name] || {}),
    enabled: zoneEnabled(name),
  });

  // Props shared by every zone
  const zp = { G, ctx, handlers, playerID, isAnimating, setAnimating: setIsAnimating, selection, setSelection, sandboxMode: sandboxMode && !sandboxPreview };

  // ── Sidebar live JSON for sandbox ─────────────────────────────────────────
  function buildSandboxExport() {
    const zones = {};
    Object.keys(effectiveConfig.zones || {}).forEach(name => {
      zones[name] = { ...effectiveConfig.zones[name], enabled: zoneEnabled(name) };
    });
    return JSON.stringify({ ...effectiveConfig, zones }, null, 2);
  }

  function copySandboxConfig() {
    const exported = `export const MyBoardConfig = ${buildSandboxExport()};`;
    navigator.clipboard?.writeText(exported).catch(() => null);
  }

  return (
    <div className={`generic-board layout-${effectiveConfig.layout || 'versus'} theme-${effectiveConfig.theme || 'retro-poker'}`}>

      {/* ── Sandbox sidebar ──────────────────────────────────────────────── */}
      {sandboxMode && (
        <div className="sandbox-sidebar">
          <div className="sandbox-sidebar-title">Board Sandbox</div>
          <div className="sandbox-zone-toggles">
            {Object.keys(effectiveConfig.zones || {}).map(name => (
              <label key={name} className="sandbox-toggle-row">
                <input
                  type="checkbox"
                  checked={sandboxOverrides[name] ?? effectiveConfig.zones[name]?.enabled ?? false}
                  onChange={e => setSandboxOverrides(prev => ({ ...prev, [name]: e.target.checked }))}
                />
                <span>{name}</span>
              </label>
            ))}
          </div>
          <pre className="sandbox-json">{buildSandboxExport()}</pre>
          <div className="sandbox-sidebar-actions">
            <button className="sandbox-btn" onClick={copySandboxConfig}>Copy Config</button>
            <button className="sandbox-btn sandbox-btn-preview" onClick={() => setSandboxPreview(p => !p)}>
              {sandboxPreview ? 'Back to Sandbox' : 'Preview Mode'}
            </button>
          </div>
        </div>
      )}

      {/* ── Board content ────────────────────────────────────────────────── */}
      <div className="board-content">
        {/* Status bar — always rendered */}
        <StatusZone {...zp} config={{ ...zoneConfig('status'), roundCountField: effectiveConfig.zones?.centerPlay?.roundCountField || effectiveConfig.zones?.playerHand?.roundCountField }} sandboxLabel="StatusZone" />

        {/* Opponent hand zone */}
        {zoneEnabled('opponentHand') && (
          <OpponentHandZone {...zp} config={zoneConfig('opponentHand')} sandboxLabel="OpponentHandZone" />
        )}

        {/* Center row: draw pile · center play · discard pile */}
        <div className="board-center-row">
          {zoneEnabled('drawPile') && (
            <DrawPileZone {...zp} config={zoneConfig('drawPile')} sandboxLabel="DrawPileZone" />
          )}

          {zoneEnabled('centerPlay') && (
            <CenterPlayZone {...zp} config={zoneConfig('centerPlay')} sandboxLabel="CenterPlayZone" />
          )}

          {zoneEnabled('discardPile') && (
            <DiscardPileZone {...zp} config={zoneConfig('discardPile')} sandboxLabel="DiscardPileZone" />
          )}
        </div>

        {/* Score zone */}
        {zoneEnabled('score') && (
          <ScoreZone {...zp} config={zoneConfig('score')} sandboxLabel="ScoreZone" />
        )}

        {/* Player hand zone */}
        {zoneEnabled('playerHand') && (
          <PlayerHandZone {...zp} config={zoneConfig('playerHand')} sandboxLabel="PlayerHandZone" />
        )}

        {/* Action bar */}
        {zoneEnabled('action') && (
          <ActionZone {...zp} config={effectiveConfig} onQuit={onQuit} sandboxLabel="ActionZone" />
        )}

        {/* Chat — positioned fixed, always check config */}
        {zoneEnabled('chat') && (
          <ChatZone {...zp} config={zoneConfig('chat')} sandboxLabel="ChatZone" />
        )}

        {/* Game result overlay — always rendered, visible only when gameover */}
        <GameResultZone {...zp} config={zoneConfig('gameResult')} onQuit={onQuit} onPlayAgain={onPlayAgain} playerName={playerName} />
      </div>
    </div>
  );
}
