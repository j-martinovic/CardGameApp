import { useState } from "react"

export function CardView({ card, onDraw }) {
  const [faceUp, setFaceUp] = useState(card.face_up);

  return (
    <div className="CARD-CONTAINER">
      <img
        src={faceUp ? card.img_source : card.cardback_img_source}
        className="CARD"
        // Execute the handler immediately on click
        onClick={onDraw} 
      />
    </div>
  );
}


export function PileView({ pile, onDraw, type="DECK" }) {
  
  var left_shift = 0
  var down_shift = 0
  if (type === "DECK") { // handles draw piles and discard piles
    left_shift = 0.2
    down_shift = 0.3
  } else if (type === "HAND") { // handles player's hand
    left_shift = 36
    down_shift = 0
  } else if (type === "OPPONENT-HAND") { // handles opponent hands
    left_shift = 1
    down_shift = 0
  } else if (type == "COLLECTED") { // handles piles of collected cards in trick taking games
    left_shift = 0.2
    down_shift = 0.3   
  }

  return (
    <div 
      className="PILE" 
      onClick={onDraw} /* Clicking ANYWHERE on the pile triggers the draw */
      style={{ 
        position: "relative", 
        cursor: "pointer",
        width: "2.5in",   /* Give the pile container a solid clickable boundary */
        height: "3.5in"
      }}
    >
      {pile.cards.map((card, i) => {
        return (
          <div
            key={card.id || i} 
            style={{
              position: "absolute",
              left: `${i * left_shift}px`,
              top: `${i * down_shift}px`,
              zIndex: i,
              pointerEvents: "none" /* PREVENTS the bottom cards from stealing clicks! */
            }}
          >
            <CardView card={card} onDraw={null} />
          </div>
        );
      })}
    </div>
  );
}



export class PlayingCard {
    constructor({id, rank, suit, value=0,face_up=true}) {
        if (id === undefined) {
          this.rank = rank
          this.suit = suit
          this.id = rank + suit
        } else {
          this.rank = id[0]
          this.suit = id[1]
          this.id = id
        }

        this.value = value
        this.img_source = "src/cards_good/" + this.id + ".svg"
        this.face_up = face_up
        this.cardback_img_source = "src/cards_good/1B.svg"
    }

    // render() {

    //   if (this.face_up) {
    //     return (
    //       <div className="CARD-CONTAINER">
    //         <img src = { this.img_source } className = "CARD" onClick={this.flip()}/>
    //       </div>
    //     )
    //   } else {
    //     return (
    //       <div className="CARD-CONTAINER">
    //         <img src = { this.cardback_img_source } className = "CARD" onClick={this.flip()}/>
    //       </div> 
    //     )
    //   }
        
    // }

    flip() {
      this.face_up = !this.face_up
    }

    to_string() {
      const names = {
        A: "ace",
        K: "king",
        Q: "queen",
        J: "jack",
        T: "10",
        9: "9",
        8: "8",
        7: "7",
        6: "6",
        5: "5",
        4: "4",
        3: "3",
        2: "2",
        W: "joker",
      }

      const symbols = {
        S: "♠", 
        H: "♥",
        D: "♦",
        C: "♣",
        N: ""
      }

      if (this.rank === "W") {
        return names[this.rank]
      } else {
        return (
          names[this.rank] + " of " + symbols[this.suit]
        )
      }

    }

    to_json() {
      return (
        {
          "rank": this.rank,
          "suit": this.suit,
          "id": this.id,
          "value": this.value,
          "img": this.img_source,
          "face_up": this.face_up,
        }
      )
    }
}



export class Pile {
  constructor({cards = []}) {
    if (cards.length === 0) {
      this.cards = []
    } else {
      this.cards = cards.map(card => {
        if (card instanceof PlayingCard) {
          return card;
        }

        if (typeof card === "string") {
          return new PlayingCard({
            id: card,
            face_up: false
          });
        }

        throw new Error(
          `Pile expected Card objects or card ID strings, got ${typeof card}`
        );
      });
    } 
    // console.log(this)
  }
  
  // add(card) {
  //   if (card instanceof PlayingCard) {
  //     this.cards.push(card);
  //   } else if (typeof card === "string") {
  //     this.cards.push(new PlayingCard(card));
  //   } else {
  //     throw new Error("add() requires a Card object or card ID string");
  //   }
  // }

  // remove({cardId,index}) {
  //   var ind = 0
  //   var removed = null
  //   if (cardId !== undefined) {
  //      ind = this.cards.findIndex(
  //       card => card.id === cardId
  //     )
  //     removed = this.cards[ind]
  //   } else {
  //      ind = index
  //     removed = this.cards[ind]
  //   }
  //   // console.log(ind)
  //   if (ind !== -1) {
  //     this.cards.splice(ind, 1)[0];
  //     return removed
  //   }

  //   return [];
  // }

  // shuffle() {
  //   for (let i = this.cards.length - 1; i > 0; i--) {
  //     const j = Math.floor(Math.random() * (i + 1));

  //     [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
  //   }
  // }


  size() {
    return this.cards.length;
  }

  to_json() {
    return this.cards.map(card => {
       card.to_json()
    }
    )
  }

  // render() {
    
  //   return (

  //     <div className="PILE">
  //       {this.cards.map((card, i) => {
  //         return(
  //           <div
  //             style={{
  //               position: "absolute",
  //               left: `${i * 0.2}px`,
  //               top: `${i * 0.3}px`,
  //               zIndex: i
  //             }}
  //           >
  //             {console.log(this.cards.length)}
  //             {card.render()}
  //           </div>
  //         )
  //       })}
  //     </div>
  //   )
  // }
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

// NEEDS TO BE FIXED
export function shuffle(deck) {
    var cards = deck
    // console.log(deck)
    // console.log(deck.cards)

    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards
  }


export function addCard({pile, card}) {
  var cards = pile.cards
  // console.log(cards)
    if (card instanceof PlayingCard) {
      cards.push(card);
      return new Pile(cards)
    } else if (typeof card === "string") {
      cards.push(new PlayingCard(card));
      return new Pile(cards)
    } else {
      throw new Error("add() requires a Card object or card ID string");
    }
  }


export function removeCard({pile, cardId, index}) {
    var ind = index
    var removed = null
    var cards = pile.cards
    if (cardId !== undefined) {
      ind = cards.findIndex(
        card => card.id === cardId
      )
      removed = cards[ind]
    } 
    
    removed = cards[ind]
    // console.log(ind)
    if (ind !== -1) {
      cards.splice(ind, 1)[0];
      return {pile: new Pile(cards), removed: removed}
    }

    return {pile: pile, removed: null};
  }



