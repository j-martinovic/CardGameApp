export const MightyBoardConfig = {
  gameName: 'Mighty',
  layout: 'table', // Uses your defined CSS layout
  theme: 'retro-poker',   // Matches your CSS theme class
  
  // 1. Flatten G into the structure your layout expects
  transformG: (G, ctx, playerID) => {
    console.log("EXTRACTING GAME INFO")
    const localID = playerID || '0';
    const totalPlayers = ctx.numPlayers || 5; 
    var SUITS = null
    if (G.contract.slice(-1) === "S" || G.contract.slice(-1) === "N") {
      SUITS = ['D','C','H','S','N']
    } else if (G.contract.slice(-1) === "H") {
      SUITS = ['C','D','S','H','N']
    } else if (G.contract.slice(-1) === "C") {
      SUITS = ['D','S','H','C','N']
    } else if (G.contract.slice(-1) === "D") {
      SUITS = ['C','H','S','D','N']
    }
    const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A','W']
    const hand = [...G.hands[localID]]
    hand.sort((a,b) => {
      const suit = SUITS.indexOf(a.slice(-1)) - SUITS.indexOf(b.slice(-1))
      const rank = RANKS.indexOf(a.slice(0,1)) - RANKS.indexOf(b.slice(0,1))
      return suit || rank
    })
    const transformed = {
      ...G,
      playerHand: hand.map((c) => {return {id: c, rank: c.slice(0,1), suit: c.slice(-1)}}), //|| [],
      playerDiscard: G.piles[localID].map((c) => {return {id: c, rank: c.slice(0,1), suit: c.slice(-1)}})  //|| [],
    };
    // console.log(ctx.playOrder[localID])
    // console.log(localID)

    // console.log(G.hands[localID])

    // Sequentially assign the 4 opponents relative to the local player
    for (let i = 1; i < totalPlayers; i++) {
      const oppIdx = (parseInt(localID, 10) + i) % totalPlayers;
      transformed[`oppHand_${i}`] = G.hands[oppIdx].map((c) => {return {id: c, rank: c.slice(0,1), suit: c.slice(-1)}}) //|| [];
      transformed[`oppDiscard_${i}`] = G.piles[oppIdx].map((c) => {return {id: c, rank: c.slice(0,1), suit: c.slice(-1)}}) //|| [];
    }

    return transformed;
  },

  // 2. Map items cleanly into the top, center, and bottom CSS flex rows
  interactiveZones: (ctx, playerID) => {
    const localID = playerID || '0';
    const totalPlayers = ctx.numPlayers || 5;
    const getOpponentID = (offset) => ((parseInt(localID, 10) + offset) % totalPlayers).toString();

    return {
      // Top row houses 2 opponents directly across from you
      top: [
        { id: `oppHand_2`, type: 'Hand', label: `P${getOpponentID(2)}`, faceUp: false},
        { id: `oppHand_3`, type: 'Hand', label: `P${getOpponentID(3)}`, faceUp: false},
      ],

      // Center row handles the left/right flanks flanking the central trick space
      center: [
        // Left Flank opponent
        { id: `oppHand_1`, type: 'Hand', label: `P${getOpponentID(1)}`, faceUp: false},
        
        // The core game play area
        { id: 'centerPlay', type: 'PlayZone', label: 'Current Trick', faceUp: true},
        { id: 'kitty', type: 'Pile', label: 'Kitty', faceUp: false }, 

        // Right Flank opponent
        { id: `oppHand_4`, type: 'Hand', label: `P${getOpponentID(4)}`, faceUp: false},
      ],

      // Bottom row hooks your active hands into .zone-row-bottom
      bottom: [
        { id: 'playerDiscard', type: 'Pile', label: 'Tricks Won', faceUp: false },
        { id: 'playerHand', type: 'Hand', label: 'Your Hand', interactive: true },
      ],
      
      all: [
        'playerHand', 'playerDiscard', 'centerPlay', 'kitty',
        'oppHand_1', 'oppHand_2', 'oppHand_3', 'oppHand_4'
      ]
    };
  },

  zones: {
    status: { enabled: true },
    score: { enabled: true, label: 'Scores', dataSource: 'custom' },
    chat: { enabled: true },
    action: { enabled: true }
  },

  moveMap: {
    playCard: 'PlayCard',
    discardCard: 'DiscardToKitty',
  },

  actions: [
    { label: 'End Turn', handler: 'endTurn', phase: 'any' },
  ],

  useDefaultInteractiveZones: false 
};