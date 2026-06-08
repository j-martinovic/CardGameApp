import { useEffect, useState } from 'react'
import { PlayingCard, Pile, createDeck, PileView, shuffle, removeCard, addCard } from "./BoardResources_test.jsx"
import "./Card.css"
import './App.css'

function App() {
  const ranks = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"]
  const suits = ["C","H","S","D"]
  const extras = ["WN"]

  // Initialize deck state cleanly on load
  const [deck, setDeck] = useState(() => {
    const deck_list = createDeck(ranks, suits, extras);
    shuffle(deck_list)
    return new Pile({ cards: deck_list });
  });   
  
  const [hand, setHand] = useState(new Pile([]));  



function drawCard({ top = true }) {
  if (deck.cards.length === 0) return;

  // 1. Completely clean array clones to prevent state mutation
  const currentDeckCards = [...deck.cards];
  const currentHandCards = [...hand.cards];

  // 2. Pop off the absolute end of the array (Top of the deck)
  const poppedCard = (top ? currentDeckCards.pop() : currentDeckCards.shift()); 

  if (poppedCard) {
    // Force it face up in your hand
    poppedCard.face_up = true; 
    currentHandCards.push(poppedCard);
    
    // 3. Set state using fresh Pile instances
    setDeck(new Pile({ cards: currentDeckCards }));
    setHand(new Pile({ cards: currentHandCards }));
  }
}

  return (
    <>
      <h2>Welcome to the Card Game App!</h2>
      <p>Cards in Hand: {hand.cards.length}</p>
      
      <div style={{ display: "flex", gap: "50px", marginTop: "20px" }}>
        <div>
          <h3>Deck</h3>
          <PileView pile={deck} onDraw={drawCard} />
        </div>

        <div>
          <h3>Your Hand</h3>
          <PileView pile={hand} onDraw={() => {}} type="HAND"/>
        </div>
      </div>
    </>
  )
}

export default App