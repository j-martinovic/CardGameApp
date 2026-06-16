// zoneLayoutDefaults.js — builds the zero-config zone layout (and placeholder
// card data) that ZoneLayout renders when a boardConfig defines no zones of
// its own. This is what makes "GenericBoard with no game-specific config"
// produce a working, interactive board.

const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];
const SUITS = ['♠', '♥', '♦', '♣'];

function sampleCards(count, prefix) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    cards.push({ id: `${prefix}-${i}`, rank: RANKS[i % RANKS.length], suit: SUITS[i % SUITS.length] });
  }
  return cards;
}

// Builds a seat layout: local player's hand + play zones on the bottom,
// every other seat's hand + play zone on top. Scales to 2-4 players.
export function buildDefaultInteractiveZones(numPlayers = 2, localPlayerID = '0') {
  const seatCount = Math.max(numPlayers, 2);
  const seatIDs = Array.from({ length: seatCount }, (_, i) => String(i));
  const opponentIDs = seatIDs.filter((id) => id !== localPlayerID);

  const top = [];
  opponentIDs.forEach((oid) => {
    top.push({ id: `hand-${oid}`, type: 'Hand', owner: Number(oid), position: { area: 'top' }, faceUp: false, label: `Player ${oid}` });
    top.push({ id: `play-${oid}`, type: 'PlayZone', owner: Number(oid), position: { area: 'top' }, isDropTarget: false, label: `Player ${oid}'s Play` });
  });

  const center = [
    { id: 'draw-pile', type: 'DrawPile', owner: 'shared', position: { area: 'center' }, label: 'Draw Pile' },
    { id: 'center-pile', type: 'Pile', owner: 'shared', position: { area: 'center' }, faceUp: true, isDropTarget: true, label: 'Center' },
  ];

  const bottom = [
    { id: `play-${localPlayerID}-a`, type: 'PlayZone', owner: Number(localPlayerID), position: { area: 'bottom' }, isDropTarget: true, label: 'Play Zone' },
    { id: `play-${localPlayerID}-b`, type: 'PlayZone', owner: Number(localPlayerID), position: { area: 'bottom' }, isDropTarget: true, label: 'Play Zone' },
    { id: `hand-${localPlayerID}`, type: 'Hand', owner: Number(localPlayerID), position: { area: 'bottom' }, faceUp: true, label: 'Your Hand', maxCards: null },
  ];

  return { top, center, bottom, all: [...top, ...center, ...bottom] };
}

// Fills in placeholder card data for any zone whose id isn't present in G yet,
// so the board is interactive even with G = {} (sandbox / fresh game).
export function withPlaceholderData(G, zones) {
  const filled = { ...(G || {}) };
  zones.forEach((zone) => {
    if (filled[zone.id] !== undefined) return;
    if (zone.type === 'Hand') filled[zone.id] = sampleCards(5, zone.id);
    else if (zone.type === 'Deck' || zone.type === 'DrawPile') filled[zone.id] = sampleCards(24, zone.id);
    else if (zone.type === 'Pile') filled[zone.id] = sampleCards(1, zone.id);
    else if (zone.type === 'PlayZone') filled[zone.id] = [];
    else if (zone.type === 'CardSlot') filled[zone.id] = null;
  });
  return filled;
}
