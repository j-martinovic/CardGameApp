/**
 * @file AssetPreview.jsx
 * @description Gallery component that displays every visual asset sourced for
 * the card game. Intended for internal developer reference — not linked in
 * App.jsx yet. Open it manually by temporarily swapping it into App.jsx:
 *
 *   import AssetPreview from './components/AssetPreview';
 *   // Replace <HomeScreen ... /> with <AssetPreview />
 *
 * Each section shows: what the asset looks like, where it lives, and a quick
 * import code snippet so the other developer can drop it into any component.
 *
 * Assets are all SVG (except Logo1.png which is pre-existing).
 * Animations are pure CSS from assets/animations/cardAnimations.css.
 *
 * TODO: Replace placeholder SVG avatars with illustrated PNGs/SVGs when
 * final character art is decided on.
 * TODO: Decide on table color — currently green felt; burgundy variant
 * is a 1-line swap in TableFelt.svg (#1a5c2a → #5c1a2a and related tones).
 */

import { useState } from 'react';
import './AssetPreview.css';
import '../assets/animations/cardAnimations.css';
import CardFace from '../assets/cards/CardFace';

// ─── Static SVG imports ───────────────────────────────────────────────────────
import CardBackSrc    from '../assets/cards/CardBack.svg';
import DeckPileSrc    from '../assets/cards/DeckPile.svg';
import TableFeltSrc   from '../assets/table/TableFelt.svg';
import DealerBtnSrc   from '../assets/ui/DealerButton.svg';
import TrophySrc      from '../assets/ui/Trophy.svg';
import WinBadgeSrc    from '../assets/ui/WinBadge.svg';
import DiceSrc        from '../assets/ui/Dice.svg';
import Chip1Src       from '../assets/ui/chips/Chip1.svg';
import Chip5Src       from '../assets/ui/chips/Chip5.svg';
import Chip25Src      from '../assets/ui/chips/Chip25.svg';
import Chip100Src     from '../assets/ui/chips/Chip100.svg';
import Avatar1Src     from '../assets/ui/avatars/Avatar1.svg';
import Avatar2Src     from '../assets/ui/avatars/Avatar2.svg';
import Avatar3Src     from '../assets/ui/avatars/Avatar3.svg';
import Avatar4Src     from '../assets/ui/avatars/Avatar4.svg';
import Avatar5Src     from '../assets/ui/avatars/Avatar5.svg';
import Avatar6Src     from '../assets/ui/avatars/Avatar6.svg';

// ─── Data: all 52 card combinations ──────────────────────────────────────────

const SUITS  = ['S', 'H', 'D', 'C'];
const RANKS  = ['A','2','3','4','5','6','7','8','9','T','J','Q','K'];

// ─── Sub-components ────────────────────────────────────────────────────────────

/**
 * A single labeled asset item for the gallery grid.
 */
function AssetItem({ src, label, width = 70, height = 70 }) {
  return (
    <div className="asset-item">
      <img src={src} alt={label} width={width} height={height}/>
      <span className="asset-item__label">{label}</span>
    </div>
  );
}

/**
 * Reusable section wrapper with heading, description, and usage code snippet.
 */
function AssetSection({ id, heading, desc, code, children }) {
  return (
    <section className="asset-section" id={id}>
      <h2 className="asset-section__heading">{heading}</h2>
      <p  className="asset-section__desc">{desc}</p>
      {code && <code className="asset-section__code">{code}</code>}
      {children}
    </section>
  );
}

// ─── Animation demo state helper ─────────────────────────────────────────────

/**
 * Renders a button that triggers the given CSS animation class on a card.
 * Re-triggers by toggling state so the animation replays each click.
 */
function AnimationDemo({ label, animClass, children }) {
  const [active, setActive] = useState(false);

  const handleClick = () => {
    setActive(false);
    // Force reflow so the animation restarts when re-added
    requestAnimationFrame(() => setActive(true));
  };

  return (
    <div className="animation-demo">
      <button className="animation-demo__btn" onClick={handleClick}>
        ▶ {label}
      </button>
      <div className={active ? animClass : ''} onAnimationEnd={() => setActive(false)}>
        {children}
      </div>
    </div>
  );
}

// ─── Main gallery component ───────────────────────────────────────────────────

function AssetPreview() {
  return (
    <div className="asset-preview">
      <h1 className="asset-preview__title">Card Game Asset Gallery</h1>
      <p className="asset-preview__subtitle">
        All visual assets — sourced, generated, and ready to use
      </p>

      {/* ── 1. Card Faces ─────────────────────────────────────────────────── */}
      <AssetSection
        id="card-faces"
        heading="🃏 Card Faces — Full 52-Card Deck"
        desc="Pure SVG React component. Pass rank + suit as props. No external library needed."
        code={`import CardFace from './assets/cards/CardFace';\n<CardFace rank="A" suit="spades" width={100} height={140} />`}
      >
        {SUITS.map((suit) => (
          <div key={suit} style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#c8a96e', textTransform: 'capitalize' }}>
              {suit}
            </p>
            <div className="card-row">
              {RANKS.map((rank) => (
                <div key={rank} title={`${rank} of ${suit}`}>
                  <CardFace rank={rank} suit={suit} width={55} height={77} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </AssetSection>

      {/* ── 2. Card Back ──────────────────────────────────────────────────── */}
      <AssetSection
        id="card-back"
        heading="🎴 Card Back — Vintage Ornate"
        desc="SVG file. Retro diamond pattern with gold ornamental border and spade medallion."
        code={`import CardBackSrc from './assets/cards/CardBack.svg';\n<img src={CardBackSrc} alt="Card back" width={100} height={140} />`}
      >
        <div className="asset-grid">
          <AssetItem src={CardBackSrc} label="Card Back" width={100} height={140}/>
        </div>
      </AssetSection>

      {/* ── 3. Deck Pile ──────────────────────────────────────────────────── */}
      <AssetSection
        id="deck-pile"
        heading="🗃️ Deck Pile — Face-Down Stack"
        desc="SVG file showing stacked depth with drop shadow illusion."
        code={`import DeckPileSrc from './assets/cards/DeckPile.svg';\n<img src={DeckPileSrc} alt="Deck" width={110} height={155} />`}
      >
        <div className="asset-grid">
          <AssetItem src={DeckPileSrc} label="Deck Pile" width={110} height={155}/>
        </div>
      </AssetSection>

      {/* ── 4. Animations ─────────────────────────────────────────────────── */}
      <AssetSection
        id="animations"
        heading="🔀 Animations — Deal, Shuffle, Win"
        desc="Pure CSS keyframe animations in assets/animations/cardAnimations.css. Apply class names to any element."
        code={`import '../assets/animations/cardAnimations.css';\n// Deal:    <div className="card-deal-from-deck" style={{'--deal-delay':'0.1s'}}>\n// Shuffle: <div className="card-shuffle-fan">\n// Win:     <div className="card-win-bounce">\n// Chip:    <div className="chip-toss" style={{'--chip-delay':'0.05s'}}>\n// Glow:    <div className="player-active-glow">`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AnimationDemo label="Deal from deck" animClass="card-deal-from-deck">
            <CardFace rank="A" suit="spades" width={70} height={98} />
          </AnimationDemo>
          <AnimationDemo label="Shuffle fan" animClass="card-shuffle-fan">
            <img src={DeckPileSrc} alt="Deck" width={80} height={112}/>
          </AnimationDemo>
          <AnimationDemo label="Win bounce" animClass="card-win-bounce">
            <img src={WinBadgeSrc} alt="Win badge" width={80} height={80}/>
          </AnimationDemo>
          <AnimationDemo label="Chip toss" animClass="chip-toss">
            <img src={Chip25Src} alt="Chip" width={60} height={60}/>
          </AnimationDemo>
        </div>
      </AssetSection>

      {/* ── 5. Dealer Button ──────────────────────────────────────────────── */}
      <AssetSection
        id="dealer"
        heading="🤝 Dealer Button"
        desc="SVG. Ivory button with 'D' glyph and gold accent ring. Place near active dealer's seat."
        code={`import DealerBtnSrc from './assets/ui/DealerButton.svg';\n<img src={DealerBtnSrc} alt="Dealer" width={50} height={50} />`}
      >
        <div className="asset-grid">
          <AssetItem src={DealerBtnSrc} label="Dealer" width={60} height={60}/>
        </div>
      </AssetSection>

      {/* ── 6. Player Avatars ─────────────────────────────────────────────── */}
      <AssetSection
        id="avatars"
        heading="👤 Player Avatars — 6 Variants"
        desc="SVG cartoons. Cowboy, monocle gentleman, pirate, wild-hair, bookish, cool sunglasses."
        code={`import Avatar1Src from './assets/ui/avatars/Avatar1.svg';\n<img src={Avatar1Src} alt="Player 1" width={80} height={80} />\n// Avatar1–Avatar6 available`}
      >
        <div className="asset-grid">
          {[Avatar1Src,Avatar2Src,Avatar3Src,Avatar4Src,Avatar5Src,Avatar6Src].map((src, i) => (
            <AssetItem key={i} src={src} label={`Avatar ${i + 1}`} width={80} height={80}/>
          ))}
        </div>
      </AssetSection>

      {/* ── 7. Table Felt ─────────────────────────────────────────────────── */}
      <AssetSection
        id="table"
        heading="🟢 Game Table Felt"
        desc="SVG pattern. Classic green felt with crosshatch weave texture and oval outline. No raster images."
        code={`import TableFeltSrc from './assets/table/TableFelt.svg';\n<img src={TableFeltSrc} alt="Table" style={{ width:'100%', height:'auto' }} />`}
      >
        <div className="felt-preview">
          <img src={TableFeltSrc} alt="Table felt" />
        </div>
      </AssetSection>

      {/* ── 8. Chips ──────────────────────────────────────────────────────── */}
      <AssetSection
        id="chips"
        heading="🪙 Poker Chips — 4 Denominations"
        desc="SVG. White $1, Red $5, Green $25, Black $100. All with notch marks and face glyph."
        code={`import Chip1Src   from './assets/ui/chips/Chip1.svg';\nimport Chip5Src   from './assets/ui/chips/Chip5.svg';\nimport Chip25Src  from './assets/ui/chips/Chip25.svg';\nimport Chip100Src from './assets/ui/chips/Chip100.svg';\n<img src={Chip25Src} alt="$25 chip" width={60} height={60} />`}
      >
        <div className="asset-grid">
          <AssetItem src={Chip1Src}   label="$1 White"  width={60} height={60}/>
          <AssetItem src={Chip5Src}   label="$5 Red"    width={60} height={60}/>
          <AssetItem src={Chip25Src}  label="$25 Green" width={60} height={60}/>
          <AssetItem src={Chip100Src} label="$100 Black"width={60} height={60}/>
        </div>
      </AssetSection>

      {/* ── 9. Dice ───────────────────────────────────────────────────────── */}
      <AssetSection
        id="dice"
        heading="🎲 Dice — Standard D6"
        desc="SVG. Retro ivory die showing face 6 with faint 3D tilt illusion."
        code={`import DiceSrc from './assets/ui/Dice.svg';\n<img src={DiceSrc} alt="Dice" width={70} height={70} />`}
      >
        <div className="asset-grid">
          <AssetItem src={DiceSrc} label="D6 (face 6)" width={80} height={80}/>
        </div>
      </AssetSection>

      {/* ── 10. Win Indicators ────────────────────────────────────────────── */}
      <AssetSection
        id="win"
        heading="🏆 Win / Score Indicators"
        desc="SVG. Gold trophy cup and starburst WIN badge. Apply card-win-bounce class for celebration animation."
        code={`import TrophySrc  from './assets/ui/Trophy.svg';\nimport WinBadgeSrc from './assets/ui/WinBadge.svg';\n<img src={TrophySrc} alt="Trophy" width={80} height={90} className="card-win-bounce" />`}
      >
        <div className="asset-grid">
          <AssetItem src={TrophySrc}  label="Trophy"   width={80} height={90}/>
          <AssetItem src={WinBadgeSrc} label="Win Badge" width={80} height={80}/>
        </div>
      </AssetSection>
    </div>
  );
}

export default AssetPreview;
