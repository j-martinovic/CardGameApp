// import { addCard, removeCard, shuffle, createDeck } from './BoardResources_test.js'
import { INVALID_MOVE } from 'boardgame.io/dist/cjs/core.js'

// function TransferCard({pile1, pile2, index=0}) {
//     const res = removeCard(pile1)
//     return ({
//         pile1: res.pile,
//         pile2: addCard(pile2, res.removed),
//     })
// }

// function DrawCard({ G, playerID }) {
//     const res = TransferCard({
//         pile1: G.deck,
//         pile2: G.players[playerID].hand.cards,
//     })
//     G.deck = res.pile1
//     G.players[playerID].hand.cards = res.pile2
// }


// function Shuffle({ G, random }) {
//     G.deck.cards = random.shuffle(G.deck.cards)
// }

// function PlayCard({ G, playerID }) {
//     const res = TransferCard({
//         pile1: G.players[playerID].hand.cards,
//         pile2: G.trick.cards,
//     })
//     G.players[playerID].hand.cards = res.pile1
//     G.trick.cards = res.pile2
// }

// function Discard({ G, playerID }) {
//     const discardPile = G.players[playerID].pile
//     const res = TransferCard({
//         pile1: G.players[playerID].hand.cards,
//         pile2: discardPile.cards,
//     })
//     G.players[playerID].hand.cards = res.pile1
//     G.players[playerID].pile.cards = res.pile2
// }


// function MakeBid({ G, }) {

// }

// import { useState } from 'react';





export const Mighty = {
  name: 'Mighty',
  debug: true,
  setup: ({ ctx }) => {
    // const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K']
    // const SUITS = ["C","H","S","D"]
    // const EXTRAS = ['WN']
    // const deck = createDeck(RANKS,SUITS,EXTRAS)
    // const hands = Array(ctx.numPlayers).fill([])
    // const piles = Array(ctx.numPlayers).fill([])

    return ({
      // secret: {
      //   deck: deck,
      // },
      // players: {
      //   ctx.playOrder.map((p) => {
      //     return (
      //       {p: {
      //         hand: [],
      //         pile: []
      //       }}
      //     )
      //   })
      // }
      playerNames: [],
      deck: [],
      hands: Array.from({ length: ctx.numPlayers }, () => []),
      piles: Array.from({ length: ctx.numPlayers }, () => []),
      trick: [],
      declarer: null,
      partnerCard: null,
      dealer: null,
      previousPartner: null,
      bids: [],
      contract: "00C",
      scores: Array.from({ length: ctx.numPlayers }, () => 0),
      JokerKiller: "3C",
      Mighty: "AS",
      Joker: "WN",
      killJoker: false,
      winnerOfPreviousTrick: null,
    })
  },
  phases: {
    bidding: {
      start: true,
      minPlayers: 5,
      maxPlayers: 5,
      onBegin: ({G, ctx, random, events}) => {
        // reset variables
        const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K']
        const SUITS = ["C","H","S","D"]
        const EXTRAS = ['WN']
        const deck = createDeck(RANKS,SUITS,EXTRAS)
        G.deck = deck
        G.hands = Array.from({ length: ctx.numPlayers }, () => [])
        G.piles = Array.from({ length: ctx.numPlayers }, () => [])
        G.trick = []
        G.partnerCard = null
        G.bids = [],
        G.contract = "00C"

        if (G.dealer === null) {
          G.dealer = ctx.playOrder[random.Die(5) - 1]
        } else {
          G.dealer = G.declarer
        }
        G.declarer = null
        if (G.previousPartner === null) {
          G.previousPartner = G.dealer
        }

        // Deal cards to players
        const HANDSIZE = 10
        const cardsToDeal = HANDSIZE*ctx.numPlayers
        G.deck = random.Shuffle(G.deck)
        for (let i = 0; i < cardsToDeal ; i++) { 
          const p = i%ctx.numPlayers
          G.hands[p].push(G.deck[i])
        } 
        G.deck.splice(0, cardsToDeal)
        // console.log(G.hands)
        // console.log(G.deck)

        events.endTurn({next: G.previousPartner})
      },

      turn: {
        activePlayers: { currentPlayer: 'makingBids' },
        order: {
          first: ({ G, ctx }) => ctx.playOrder.indexOf(G.previousPartner),
          // next: ({ G, ctx }) => {
          //   if (G.declarer !== null) {
          //     return (ctx.playOrderPos + 1) % ctx.numPlayers
          //   } else {
          //     return ctx.playOrder.indexOf(G.declarer)
          //   }
          // },
        },
        stages: {
          makingBids: {
            moves: {
              MakeBid, 
              CallRedeal: {
                move: CallRedeal,
                undoable: false,
              }
            },
            // next: 'takingKitty',
            // endIf: ({ G, ctx}) => {
            //   G.declarer
            // }
          },
          
        },  
      },
      next: 'preparing'
    },

    preparing: {
      // onBegin: ({G, ctx, events}) => {
      //   console.log("BEGINNING PREPARING PHASE")
      //   events.endTurn({next: G.declarer})
      // },
      minPlayers: 5,
      maxPlayers: 5,
      turn: {
        activePlayers: {currentPlayer: "takingKitty"},
        order: {
          first: ({ G, ctx }) => ctx.playOrder.indexOf(G.declarer),
          next: ({G, ctx}) => ctx.playOrder.indexOf(G.declarer),
        },
        stages: {
          takingKitty: {
            // order: {
            //   first: ({G}) => G.declarer
            // },
            moves: {
              UseKitty
            },
            next: 'changingContract'
          },
          changingContract: {
            moves: {
              ChangeContract, KeepContract
            },
            next: 'discardingKitty'
          },
          discardingKitty: {
            moves: {
              DiscardKitty
            },
            next: 'choosingPartner'
          },
          choosingPartner: {
            moves: {
              SelectPartner
            }
          }
        }
      },
      onEnd: ({G}) => {G.winnerOfPreviousTrick = G.declarer},
      next: 'playing'
    },
    playing: {
      minPlayers: 5,
      maxPlayers: 5,
      // onBegin: (G, ctx) => {
      //   // prompt player to play a card
      // },
      // moves: { PlayCard },
      turn: {
        activePlayers: { currentPlayer: 'playingCards' },
        order: {
          first: ({ G, ctx }) => ctx.playOrder.indexOf(G.winnerOfPreviousTrick),
          next: ({ G, ctx}) => (ctx.playOrderPos + 1) % ctx.numPlayers,
        },
        // minMoves: 1,
        // maxMoves: 3,
        stages: {
          playingCards: {
            moves: {
              PlayCard
            }
          },
          choosingJokerSuit: {
            moves: {
              JokerSuit
            }
          },
          killingJoker: {
            moves: {
              KillJoker
            }
          }
        }
      },
      endIf: ({G, ctx}) => {
        return (G.trick.length === ctx.numPlayers)
      },
      onEnd: (G, ctx) => {
        TakeTrick()
        if (G.hands[0].length === 0) {
          UpdateScores()
          events.setPhase('bidding')
        } else {
          events.setPhase('playing')
        }
      },
      // next: 'bidding',
    },
  }

}


export function createDeck(ranks, suits, extras=["WN"]) {
  const cards = [];

  for (const rank of ranks) {
    for (const suit of suits) {
      cards.push(`${rank}${suit}`);
    }
  }

  for (const extra of extras) {
    cards.push(extra)
  }

  return cards;
}

// moves contents from kitty into winner's pile
function TakeTrick({G, ctx}) {

  const canWin = Array.from({ length: ctx.numPlayers }, () => true)
  const trump_suit = G.contract.slice(-1)
  const VALUES = ['2','3','4','5','6','7','8','9','T','J','Q','K','A']


  var winner = null
  if (G.trick.includes(G.Mighty)) {
    winner = G.trick.indexOf(G.Mighty)
  } else if (G.trick.includes(G.Joker) && (G.trick[0] !== G.JokerKiller || !G.killJoker)) {
    winner = G.trick.indexOf(G.Joker)
  } else if (G.trick.filter(c => c.slice(-1) === trump_suit).length > 0) {
    var highestValue = 0
    for (let i = 0; i < ctx.numPlayers; i++) {
      if (G.trick[i].slice(-1) === trump_suit && VALUES.indexOf(G.trick[i].slice(0,1)) > highestValue) {
        winner = i
        highestValue = VALUES.indexOf(G.trick[i].slice(0,1))
      }
    }
  } else {
    var highestValue = 0
    for (let i = 0; i < ctx.numPlayers; i++) {
      if (G.trick[i].slice(-1) === G.trick[0].slice(-1) && VALUES.indexOf(G.trick[i].slice(0,1)) > highestValue) {
        winner = i
        highestValue = VALUES.indexOf(G.trick[i].slice(0,1))
      }
    }  
  }

  G.piles[winner].push(...G.trick)
  G.winnerOfPreviousTrick = ctx.playOrder[winner]
}

// adjusts the game scores based on the current pile arrangements
function UpdateScore({G, ctx}) {
  const MINBID = 13
  var gameScore = 0
  const VALUES = ['2','3','4','5','6','7','8','9','T','J','Q','K','A']

  const cont_num = parseInt(G.contract.slice(0,2))
  const cont_suit = G.contract.slice(-1)

  const collectedPoints = G.piles[ctx.playOrder.indexOf(G.declarer)].filter(c => VALUES.indexOf(c.slice(0)) >= 8).length + G.piles[ctx.playOrder.indexOf(G.previousPartner)].filter(c => VALUES.indexOf(c.slice(0)) >= 8).length

  // assign initial gamescore
  if (collectedPoints >= cont_num) {
    gameScore = (collectedPoints - cont_num) * 2 + (cont_num - MINBID)
  } else {
    gameScore = -1 * (cont_num - collectedPoints)
  }

  // Add multipliers
  if (collectedPoints === 20) {
    gameScore = gameScore * 2
  }
  if (cont_num === 20) {
    gameScore = gameScore * 2
  }
  if (G.previousPartner === null) {
    G.previousPartner = G.declarer
    gameScore = gameScore * 2
  }
  if (collectedPoints < 10) {
    gameScore * 2
  }

  // assign scores to players using gamescore
  if (G.previousPartner === null || G.previousPartner === G.declarer) {
    declarerScore = 4 * gameScore
    opponentScore = -1 * gameScore
    partnerScore = 0
  } else {
    declarerScore = 2 * gameScore
    opponentScore = -1 * gameScore
    partnerScore = gameScore
  }

  for (let i = 0; i < ctx.numPlayers; i++) {
    if (G.declarer === G.playOrder[i]) {
      G.scores[i] = G.scores[i] + declarerScore
    } else if (G.previousPartner === G.playOrder[i]) {
      G.scores[i] = G.scores[i] + partnerScore
    } else {
      G.scores[i] = G.scores[i] + opponentScore
    }
  }

}

function PlayCard({G, ctx, events}, card) {
  const HANDSIZE = 10

  const trump_suit = G.contract.slice(-1)

  if (true !== G.hands[ctx.playOrderPos].includes(card)) { // card must be in player's hand
    return INVALID_MOVE
  } else if (G.trick.length === 0) { // initial lead cannot be trump
    if (G.hands[0].length === HANDSIZE) {
      if (trump_suit === 'N') {
        // valid move
      } else if (card.slice(-1) === trump_suit) {
        return INVALID_MOVE
      }
    }
  } else if (card === G.Mighty || card === G.Joker) {
    // mighty can always be played
  } else if (G.trick[0] === G.JokerKiller && G.killJoker) { // make sure player who has joker plays it if it is killed
    if (G.hands[ctx.playOrderPos].includes(G.Joker) && (card !== "WN" || card !== G.Mighty)) {
      return INVALID_MOVE
    }
  } else if (G.hands[ctx.playOrderPos].filter(p => p.slice(-1) === G.trick[0].slice(-1)) > 0) { // check if player followed suit
    if (card.slice(-1) !== G.trick[0].slice(-1)) {
      return INVALID_MOVE
    }
  }

  G.hands[ctx.playOrderPos] = G.hands[ctx.playOrderPos].filter(c => c !== card)
  G.trick.push(card)

  if (G.trick.length === 1) {
    if (card === G.JokerKiller && G.hands[ctx.playOrderPos].length < HANDSIZE - 1) {
      var jokerPlayed = true
      for (i = 0; i < ctx.numPlayers; i++) {
        if (G.hands[i].includes(G.Joker)) {
          jokerPlayed = false
        }
      }

      if (!jokerPlayed) {
        events.setStage('killingJoker')
      }

    } else if (card === G.Joker) {
      events.setStage('choosingJokerSuit')
    }
  }
  events.endTurn()
}

function JokerSuit({G, ctx}, suit) {
  G.trick[0] = "W" + suit
}

function KillJoker({G, ctx}, kill) {
  if (G.hands[ctx.playOrderPos].includes(G.Joker) === false) {
    G.killJoker = kill
  }
}







function MakeBid({G, ctx, events}, bid) {
  console.log("MAKING A BID...")

  if (bid !== "P") {
    const MAXBID = 20
    const MINBID = 13

    const number = parseInt(bid.slice(0,2))
    const suit = bid.slice(2,3)

    const cont_num = parseInt(G.contract.slice(0,2))
    const cont_suit = G.contract.slice(2,3)

    // check if the bid is valid
    if (number < cont_num || (number === cont_num && (suit !== "N" || cont_suit === 'N')) || number > MAXBID || number < MINBID) {
      console.log(bid)
      return INVALID_MOVE
    }
  }

  // Record the bid and update contract if necessary
  G.bids.push(bid)
  if (bid !== "P") {
    G.contract = bid
  }

  // Determine who has already passed to figure out who comes next
  const passed = Array.from({ length: ctx.numPlayers }, () => false)
  for (let i = 0; i < G.bids.length; i++) {
    if (G.bids[i] === "P") {
      passed[(ctx.playOrder.indexOf(G.previousPartner) + i)%ctx.numPlayers] = true
    }
  }
  console.log(passed)
  if (bid === "20N") {
    G.declarer = ctx.currentPlayer
    events.endPhase()
    // events.setActivePlayers({currentPlayer: 'takingKitty'})
    // events.endTurn()
  }  else if (G.bids.length >= ctx.numPlayers) {   // Check if every player has bid at least once
    // If everyone passed, trigger redeal; if all but one have passed, begin kitty stage; otherwise continue bidding
    if (passed.every(value => value === true)) {
      console.log(passed)
      events.setPhase('bidding') // SHOULD END CURRENT "BIDDING" PHASE, THEN RESET IT (MAYBE REPLACE WITH A "SCOREKEEPING" STAGE AT SOME POINT)
    } else if (passed.filter(x => x === false).length === 1){
      console.log("ENDING AUCTION")
      G.declarer = ctx.playOrder[passed.indexOf(false)]
      events.endPhase()
      // console.log(G.declarer)
      // events.setActivePlayers({all: 'takingKitty'})
      // events.endTurn({ next: G.declarer})
    } else {
      // console.log(passed)
      var nextBidder = (ctx.playOrderPos + 1) % ctx.numPlayers
      var skippedTurns = 0
      for (let j = 1; j < ctx.numPlayers; j++) {
        var index = (ctx.playOrderPos + j) % ctx.numPlayers
        if (!passed[index]) {
          nextBidder = ctx.playOrder[index]
          break
        }
        skippedTurns++
      }
      // const skippedTurns = ctx.playOrder.indexOf(nextBidder) - ctx.playOrderPos - 1
      for (let k = 0; k < skippedTurns; k++) {
        G.bids.push("P")
      }
      events.endTurn({next: nextBidder})
    }  
  }  else {
    const index = (ctx.playOrderPos + 1) % ctx.numPlayers
    const nextBidder = ctx.playOrder[index]
    events.endTurn({next: nextBidder})
  }
   
}


function CallRedeal({G, ctx, events}) {
  // events.endPhase()
  console.log("CALLING REDEAL...")
  if (G.bids.length >= 5) {
    return INVALID_MOVE
  }
  events.setPhase('bidding') // SHOULD END CURRENT "BIDDING" PHASE, THEN RESET IT (MAYBE REPLACE WITH A "SCOREKEEPING" STAGE AT SOME POINT)
  G.previousPartner = ctx.currentPlayer
}


// null = alone, any other card used to determine partner later
function SelectPartner({G, ctx, events}, partnerCard) {

  G.partnerCard = partnerCard

  // assign alone if applicable
  if (partnerCard === null) {
    G.previousPartner = G.declarer
  } else {
    // chack player hands for partner
    for (let h = 0; h < G.hands.length; h++) {
      if (G.hands[h].filter(c => partnerCard === c).length === 1) {
        G.previousPartner = ctx.playOrder[h]
        break
      }
    }

    // check kitty for card
    if (G.piles[ctx.currentPlayer].filter(c => partnerCard === c).lenth === 1) {
      G.previousPartner = G.declarer
    }
  }

  events.endPhase()
}


function UseKitty({G, ctx, events}) {
  G.hands[ctx.currentPlayer].push(...G.deck)
  G.deck = []
  events.endStage()
}

function ChangeContract({G, ctx, events}, bid) {
  if (bid === null) {
    events.endStage()
  } else {
    const MAXBID = 20
    const MINBID = 13

    const number = parseInt(bid.slice(0,2))
    const suit = bid.slice(2,3)

    const cont_num = parseInt(G.contract.slice(0,2))
    const cont_suit = G.contract.slice(2,3)

    // check if the bid is valid
    if (true !== (bid === '20N' || number >= cont_num + 2 || (number === cont_num + 1 && (cont_num === 19 || (cont_suit !== 'N' && suit === 'N'))) || (number > cont_num && suit === cont_suit))) {
      return INVALID_MOVE
    }
    // if (number < cont_num || (number === cont_num && ((number < 20 && cont_num === 19) || suit !== 'N')) || (number === cont_num + 1 && ((suit !== "N" && suit !== cont_suit) || number === 20)) || number > MAXBID || number < MINBID) {
    //   return INVALID_MOVE
    // }
    G.contract = bid
    events.endStage()
  }

}

function KeepContract({events}) {
  events.endStage()
}

function DiscardKitty({G, ctx, events}, cards) {
  for (const card of cards) {
    const length = G.hands[ctx.playOrderPos].length
    G.hands[ctx.playOrderPos] = G.hands[ctx.playOrderPos].filter(c => c !== card)
    if (G.hands[ctx.playOrderPos].length === length) {
      return INVALID_MOVE
    }
    G.piles[ctx.playOrderPos].push(card)
  }
  events.endStage()
}

