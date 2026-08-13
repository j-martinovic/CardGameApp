import React, { useState } from 'react';
import BiddingPanel from './BiddingPanel';
import JokerSuitPanel from './JokerSuitPanel';
import DiceRoller from './DiceRoller';
import PartnerSelectPanel from './PartnerSelectPanel';
import MessagePanel from './MessagePanel';
import './PanelsDemo.css';

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_UNBIDDABLE = [
  { level: 1, suit: '♣' }, { level: 1, suit: '♦' }, { level: 1, suit: '♥' },
];

const MOCK_DECK = ['♠', '♥', '♦', '♣'].flatMap(suit =>
  ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'].map(rank => ({
    rank,
    suit,
    id: `${rank}${suit}`,
    faceUp: true,
  }))
);

const MOCK_HAND = [
  { rank: 'A', suit: '♠',  id: 'A♠',  faceUp: true },
  { rank: 'K', suit: '♥',  id: 'K♥',  faceUp: true },
  { rank: 'Q', suit: '♦',  id: 'Q♦',  faceUp: true },
  { rank: 'J', suit: '♣',  id: 'J♣',  faceUp: true },
  { rank: '10', suit: '♠', id: '10♠', faceUp: true },
];

// ── Demo shell ─────────────────────────────────────────────────────────────

export default function PanelsDemo() {
  const [active, setActive] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [diceValues, setDiceValues] = useState([3, 5]);

  function show(name) { setActive(name); }
  function hide()     { setActive(null); }

  function handleRoll() {
    setRolling(true);
    show('dice');
  }

  function handleRollComplete() {
    setRolling(false);
    // Randomize new values after roll completes
    setDiceValues([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
  }

  return (
    <div className="pd-root">
      <h1 className="pd-heading">Panel Components — Visual Demo</h1>
      <p className="pd-sub">Click a button to preview each panel. Panels close on action or X.</p>

      <div className="pd-buttons">
        <button className="pd-btn" onClick={() => show('bidding')}>Bidding Panel</button>
        <button className="pd-btn" onClick={() => show('joker')}>Joker Suit Panel</button>
        <button className="pd-btn" onClick={handleRoll}>Dice Roller</button>
        <button className="pd-btn" onClick={() => show('partner')}>Partner Select</button>
        <button className="pd-btn" onClick={() => show('message')}>Message Panel</button>
      </div>

      {/* ── Bidding Panel ── */}
      <BiddingPanel
        visible={active === 'bidding'}
        levelMin={1}
        levelMax={7}
        suits={['♣', '♦', '♥', '♠']}
        includeNT={true}
        unbiddableBids={MOCK_UNBIDDABLE}
        wildCards={[{ label: 'X', disabled: false }, { label: 'XX', disabled: true }]}
        onBid={(level, suit) => { alert(`Bid: ${level}${suit}`); hide(); }}
        onPass={() => { alert('Pass'); hide(); }}
        onWildCard={(label) => { alert(`Wild card: ${label}`); hide(); }}
      />

      {/* ── Joker Suit Panel ── */}
      <JokerSuitPanel
        visible={active === 'joker'}
        onSelect={(suit) => { alert(`Joker suit: ${suit}`); hide(); }}
      />

      {/* ── Dice Roller ── */}
      <DiceRoller
        visible={active === 'dice'}
        numDice={2}
        values={diceValues}
        rolling={rolling}
        onRollComplete={handleRollComplete}
      />

      {/* ── Partner Select Panel ── */}
      <PartnerSelectPanel
        visible={active === 'partner'}
        deck={MOCK_DECK}
        playerHand={MOCK_HAND}
        onSelect={(card) => { alert(`Partner: ${card.rank}${card.suit}`); hide(); }}
        onGoAlone={() => { alert('Going alone!'); hide(); }}
      />

      {/* ── Message Panel ── */}
      <MessagePanel
        visible={active === 'message'}
        title="Do you accept opponent's claim?"
        body="Your opponent is claiming all remaining tricks. Accept to end the hand, or challenge to continue play."
        buttons={[
          { label: 'Accept',    variant: 'primary',   onClick: () => { alert('Accepted');   hide(); } },
          { label: 'Challenge', variant: 'danger',    onClick: () => { alert('Challenged'); hide(); } },
          { label: 'Cancel',    variant: 'secondary', onClick: () => hide() },
        ]}
        onDismiss={hide}
      />
    </div>
  );
}
