import React from 'react';
import Card from '../primitives/Card';
import './PartnerSelectPanel.css';

const RANK_ORDER = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUIT_ORDER = ['♠', '♥', '♦', '♣'];
const RED_SUITS  = new Set(['♥', '♦']);

function groupBySuit(deck) {
  const groups = {};
  SUIT_ORDER.forEach(s => { groups[s] = []; });
  deck.forEach(card => {
    if (groups[card.suit] !== undefined) {
      groups[card.suit].push(card);
    }
  });
  SUIT_ORDER.forEach(s => {
    groups[s].sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank));
  });
  return groups;
}

export default function PartnerSelectPanel({
  visible,
  deck = [],
  playerHand = [],
  onSelect,
  onGoAlone,
}) {
  if (!visible) return null;

  const handIds = new Set(playerHand.map(c => c.id));
  const groups  = groupBySuit(deck);

  return (
    <div className="psp-overlay">
      <div className="psp-panel">
        <h2 className="psp-title">Select Your Partner</h2>

        <div className="psp-suits">
          {SUIT_ORDER.map(suit => (
            <div key={suit} className="psp-suit-row">
              <span className={['psp-suit-label', RED_SUITS.has(suit) ? 'psp-label--red' : 'psp-label--black'].join(' ')}>
                {suit}
              </span>
              <div className="psp-cards">
                {groups[suit]?.map(card => {
                  const inHand = handIds.has(card.id);
                  return (
                    <div
                      key={card.id}
                      className={['psp-card-wrap', inHand ? 'psp-card-wrap--in-hand' : ''].filter(Boolean).join(' ')}
                    >
                      <Card
                        cardData={{ ...card, faceUp: true }}
                        onClick={inHand ? undefined : () => onSelect?.(card)}
                        disabled={inHand}
                        width={56}
                        height={78}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="psp-footer">
          <button className="psp-go-alone-btn" onClick={() => onGoAlone?.()}>
            Go Alone
          </button>
        </div>
      </div>
    </div>
  );
}
