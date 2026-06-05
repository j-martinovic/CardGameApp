# Card Game — Visual Assets Guide

Everything you need to know about the visual assets in this project: what was installed, where things live, and how to use each asset in a new component.

---

## Libraries Evaluated

### 1. cards.js
**Site:** https://einaregilsson.github.io/cards.js/  
**Decision: Not installed.**

cards.js is a DOM-manipulation library (it takes a `#selector` and renders cards directly into the DOM). It conflicts with React's virtual DOM model — it would need a ref + a `useEffect` to mount, and its animation system bypasses React state entirely. For a React/Vite project this creates more complexity than it solves.

**What we use instead:** `CardFace.jsx` — a pure React + inline SVG component that renders any of the 52 cards. It's lighter, fully controlled, and trivial to animate via CSS or framer-motion. The card images in cards.js are public domain (by Nicu Buculei); our SVG approach reproduces the same data without the DOM coupling.

### 2. boardgame.io
**Site:** https://boardgame.io/  
**Decision: Not installed at this time.**

boardgame.io is a full multiplayer game framework (state machine + networking + lobby). This project already has a custom Flask backend handling game state. Installing boardgame.io would duplicate that layer and require a significant architecture decision. It does **not** provide pre-built visual components (no tokens, no board art) — it's logic-only.

**If we ever want built-in multiplayer infrastructure:** `npm install boardgame.io` and read the React client docs at https://boardgame.io/documentation/#/react. Do not modify the Flask backend until the team agrees on the migration plan.

---

## Asset Directory Structure

```
frontend/src/assets/
├── cards/
│   ├── CardFace.jsx       ← React component — renders any of 52 cards as SVG
│   ├── CardBack.svg       ← Ornate vintage card back (dark red diamond pattern)
│   └── DeckPile.svg       ← Face-down stack of cards with depth illusion
├── ui/
│   ├── DealerButton.svg   ← Round ivory "D" button for dealer position
│   ├── Trophy.svg         ← Gold trophy cup for win screen
│   ├── WinBadge.svg       ← Gold starburst "WIN" badge
│   ├── Dice.svg           ← Retro ivory D6, face showing 6
│   ├── chips/
│   │   ├── Chip1.svg      ← $1  White chip
│   │   ├── Chip5.svg      ← $5  Red chip
│   │   ├── Chip25.svg     ← $25 Green chip
│   │   └── Chip100.svg    ← $100 Black/gold chip
│   └── avatars/
│       ├── Avatar1.svg    ← Cowboy hat, friendly smile
│       ├── Avatar2.svg    ← Top hat + monocle, distinguished gentleman
│       ├── Avatar3.svg    ← Pirate bandana + eyepatch
│       ├── Avatar4.svg    ← Wild curly hair, big grin
│       ├── Avatar5.svg    ← Glasses + bob haircut, bookish
│       └── Avatar6.svg    ← Spiky hair + sunglasses, cool
├── table/
│   └── TableFelt.svg      ← Green felt table surface (SVG pattern, no raster)
└── animations/
    └── cardAnimations.css ← CSS keyframe animations (deal, flip, shuffle, win, chip, glow)
```

---

## How to Use Each Asset

### Card Faces (all 52 cards)

```jsx
import CardFace from './assets/cards/CardFace';

// Basic usage
<CardFace rank="A" suit="spades" />

// Custom size
<CardFace rank="K" suit="hearts" width={80} height={112} />

// All valid ranks: "A" "2"–"10" "J" "Q" "K"
// All valid suits: "spades" "hearts" "diamonds" "clubs"
```

### Card Back

```jsx
import CardBackSrc from './assets/cards/CardBack.svg';

<img src={CardBackSrc} alt="Card back" width={100} height={140} />
```

### Deck Pile

```jsx
import DeckPileSrc from './assets/cards/DeckPile.svg';

<img src={DeckPileSrc} alt="Deck" width={110} height={155} />
```

### Dealer Button

```jsx
import DealerBtnSrc from './assets/ui/DealerButton.svg';

<img src={DealerBtnSrc} alt="Dealer" width={50} height={50} />
```

### Player Avatars

```jsx
import Avatar1Src from './assets/ui/avatars/Avatar1.svg';
// ...Avatar2Src through Avatar6Src

<img src={Avatar1Src} alt="Player 1" width={80} height={80} />
```

To map avatars to players dynamically:

```jsx
const AVATAR_SRCS = [Avatar1Src, Avatar2Src, Avatar3Src, Avatar4Src, Avatar5Src, Avatar6Src];

// In render:
<img src={AVATAR_SRCS[player.avatarIndex]} alt={player.name} width={80} height={80} />
```

### Table Felt

```jsx
import TableFeltSrc from './assets/table/TableFelt.svg';

// As a full-width background image
<img src={TableFeltSrc} alt="Table" style={{ width: '100%', height: 'auto' }} />

// Or as a CSS background (SVG works as url())
// background-image: url('/src/assets/table/TableFelt.svg');
```

**To change to burgundy felt:** Open `TableFelt.svg` and replace:
- `#1a5c2a` → `#5c1a2a`
- `#1d6630` → `#6e2030`
- `#2e7a42` → `#7a2e40`
- `#4a9a5e` → `#9a4a5e`
- `#0a2e10` → `#2e0a14`

### Chips

```jsx
import Chip1Src   from './assets/ui/chips/Chip1.svg';
import Chip5Src   from './assets/ui/chips/Chip5.svg';
import Chip25Src  from './assets/ui/chips/Chip25.svg';
import Chip100Src from './assets/ui/chips/Chip100.svg';

<img src={Chip25Src} alt="$25 chip" width={60} height={60} />
```

### Dice

```jsx
import DiceSrc from './assets/ui/Dice.svg';

<img src={DiceSrc} alt="Dice" width={70} height={70} />
```

> Note: The dice SVG always shows face 6. If you need dynamic faces, convert
> `Dice.svg` into a `Dice.jsx` component and map each face value to its dot layout
> (similar to how `CardFace.jsx` handles pip layouts).

### Win / Score Indicators

```jsx
import TrophySrc   from './assets/ui/Trophy.svg';
import WinBadgeSrc from './assets/ui/WinBadge.svg';

<img src={TrophySrc}   alt="Trophy"   width={80} height={90} />
<img src={WinBadgeSrc} alt="Win badge" width={80} height={80} />
```

Pair with the win animation — see Animations section below.

### Animations

```jsx
import '../assets/animations/cardAnimations.css';

// Card dealing (slides in from top-left)
<div className="card-deal-from-deck" style={{ '--deal-delay': '0.15s' }}>
  <CardFace rank="A" suit="spades" />
</div>

// Shuffle fan (deck fans out then snaps back)
<img src={DeckPileSrc} className="card-shuffle-fan" alt="Shuffling" />

// Win celebration bounce
<img src={WinBadgeSrc} className="card-win-bounce" alt="You win!" />

// Chip toss onto table
<img src={Chip25Src} className="chip-toss" style={{ '--chip-delay': '0.05s' }} alt="Chip" />

// Active player glow pulse (continuous)
<div className="player-active-glow">
  <img src={Avatar1Src} alt="Active player" />
</div>
```

**Staggering deal animations** across multiple cards:

```jsx
{hand.map((card, index) => (
  <div
    key={index}
    className="card-deal-from-deck"
    style={{ '--deal-delay': `${index * 0.08}s` }}
  >
    <CardFace rank={card.rank} suit={card.suit} />
  </div>
))}
```

---

## Preview Gallery

To view all assets in the browser, temporarily add `AssetPreview` to `App.jsx`:

```jsx
import AssetPreview from './components/AssetPreview';
// Replace <HomeScreen ... /> with <AssetPreview />
```

The gallery is at `frontend/src/components/AssetPreview.jsx`.

---

## Assets Still Needed / TODO

| Category | Status | Notes |
|---|---|---|
| Card deal animation (CSS) | ✅ Done | `card-deal-from-deck` class |
| Card flip animation | ✅ Done | `card-flip` class |
| Shuffle animation | ✅ Done | `card-shuffle-fan` class |
| Dice (all 6 faces) | ⚠️ Partial | Only face-6 SVG exists. Need `Dice.jsx` component with dynamic face values |
| Avatar illustrations | ⚠️ Basic | SVG cartoon placeholders. Consider commissioning illustrated PNG/SVG art |
| Sound effects | ❌ Missing | Card deal, chip click, shuffle, win sounds — suggest Howler.js for audio |
| Animated card flip (front→back) | ⚠️ Basic | CSS `card-flip` class does a Y-axis rotation but requires manual class swap via JS to swap face/back at 90° midpoint |
| Joker cards | ❌ Missing | `CardFace.jsx` does not support rank "Joker" — add if the game uses jokers |
| Table: burgundy variant | ⚠️ Easy | See color swap instructions above |
