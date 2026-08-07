# Engine Reference — every file in `frontend/src/engine/`

File-by-file reference for the board engine. For the big picture (config contract, render
paths, the move-dispatch pipeline) read [board-engine.md](board-engine.md) first — this
page is the "what does *this* file do" companion, including known quirks so nobody
rediscovers them the hard way.

How the pieces fit:

```
GenericBoard  (the shell: hooks → handler bag; picks a render path)
 ├─ interactive path:  ZoneLayout ──renders──▶ primitives/  (Hand, Deck, Pile, PlayZone, CardSlot)
 │                        │ events                │ drag/click via hooks/useCardInteraction
 │                        ▼                       ▼
 │                hooks/useBoardEventHandlers ──moveMap──▶ handler bag ──▶ moves.*
 └─ legacy path:  zones/  (10 named, config-driven components — War/Go Fish era)
                  both paths draw cards with components/Card + CardBack
```

## `components/` — the core

| File | ~Lines | What it does |
|---|---|---|
| `GenericBoard.jsx` | 359 | The shell. Calls the six `shared_handlers` hooks, flattens them into a ~40-key **handler bag** (abstract names → functions), applies `config.moveOverrides` (each wrapped as `(...args) => fn(moves, G, ...args)`), then renders either the interactive path (three `ZoneLayout` rows + StatusZone/ScoreZone/ChatZone/GameResultZone) or the legacy zones. Also implements sandbox mode (zone toggles + config JSON exporter) |
| `ZoneLayout.jsx` | 168 | Maps a row of zone descriptors (`{id, type, label, faceUp, disabled, isDropTarget…}`) to primitives, feeding each `G[zone.id]` as its card data, and normalizes every drop/click into `useBoardEventHandlers` events with abstract zone types |
| `zoneLayoutDefaults.js` | 57 | `buildDefaultInteractiveZones(numPlayers, localPlayerID)` — the zero-config seat layout — and `withPlaceholderData(G, zones)`, which fills any zone id **absent** from `G` with sample cards |
| `Card.jsx` | 93 | The **visual** card: face-up renders an `<img>` of an SVG from `frontend/src/assets/cards/cards_good/` (`AS.svg`, `KH.svg`, …); face-down renders an inline-SVG card back |
| `CardBack.jsx` | 35 | Standalone inline-SVG card back (gold-on-navy diamond pattern) |

Key gotchas in this layer:

- **`withPlaceholderData` runs for real games too**, not just the sandbox: any zone id
  your `transformG` forgets to populate silently renders *fake sample cards* instead of
  an empty zone. If a zone shows cards you didn't deal, check the field name first.
- The placeholder cards use Unicode suits (`♠♥♦♣`) and ranks A–7 only.
- `Card.jsx` builds the SVG filename as `${rank}${suit}` — Mighty's letter suits
  (`AS` → `AS.svg`) match the assets; **War's Unicode suit objects don't** (`A♠.svg`
  doesn't exist), so War card faces 404 and only Mighty's resolve. The commented-out
  glyph→letter map inside `Card.jsx` is the intended fix. (The asset *path* itself was
  also broken by the engine move — fixed in this PR.)
- `CardBack.jsx` uses a hardcoded SVG `<pattern id="diamondPat">` — every card back on
  the page shares the first instance's pattern. Works by accident; breaks if the first
  unmounts.
- `GenericBoard.jsx` still logs the whole transformed `G` twice per render
  (lines 219/223).

## `components/zones/` — the legacy named zones (10)

Config-driven, mostly display-only components from the War/Go Fish era. Each reads
specific `config.zones.<name>` fields and `G[config.<field>]` values; each imports its
own CSS. On the interactive path only **StatusZone, ScoreZone, ChatZone, GameResultZone**
still render; the rest appear only via sandbox mode.

| Zone | What it renders | Notable quirks |
|---|---|---|
| `StatusZone` | Top bar: current player, phase, round — hosts End Turn/Quit on the interactive path | Reads `config.timer.*`, but GenericBoard never passes the top-level `timer` config in, so the timer chip can't render |
| `ScoreZone` | Deck-count comparison (`dataSource: 'decks'`) or per-player books (`'players'`) | `MightyBoardConfig` sets `dataSource: 'custom'`, which falls into the deck branch and shows `0 · 0` — Mighty's score zone is effectively unimplemented |
| `ChatZone` | Collapsible chat + quick phrases via the `useSocial` handlers | **Local echo only** — it never reads incoming messages from anywhere, and the POSTs target a dead URL; purely decorative today |
| `ActionZone` | Buttons from `config.actions` (`{label, handler, phase, argsFrom, disabledWhen, lockMs}`) dispatched into the handler bag | The natural home for Mighty's bidding UI. In sandbox mode it renders all 33 handler keys as buttons |
| `GameResultZone` | Win/lose/draw overlay once `ctx.gameover` exists | Ignores its config entirely; sniffs `G` for War/Go-Fish shapes to build score lines |
| `CenterPlayZone` | War-style versus badges (`roundResultField`, `warField`) or Go-Fish ask feed | Result copy hardcoded to `'player'`/`'bot'` strings |
| `PlayerHandZone` | Stacked deck + flip slot (War) or face-up selectable fan (Go Fish); `deckClickAction` config | Flip animation re-triggers only when `roundCount` changes |
| `OpponentHandZone` | Mirror of PlayerHandZone for opponents (`layout: 'stacked' \| 'fan'`) | Fan caps at 10 visible cards |
| `DrawPileZone` | Clickable face-down stack with count | Click dispatches `drawCard` even when empty |
| `DiscardPileZone` | Top card + count of a pile | Display-only, fixed 54×76 card size |

## `components/primitives/` — the interactive card widgets (7)

The building blocks `ZoneLayout` assembles. All wire drag/drop through
`hooks/useCardInteraction`; all but `DrawPile` import `primitives.css`.

| Primitive | Role | Notable behavior/quirks |
|---|---|---|
| `Card.jsx` | Interactive wrapper: drag source, hover, click, selected/disabled states around the visual `components/Card` | Draws no pixels itself — delegates to `CardFace`/`CardBack`. Cards rendered inside PlayZone/Pile are `disabled` → can't be dragged back out |
| `Hand.jsx` | The fanned hand — the primary drag source and tap-to-select surface; builds the `hand-<playerId>` zone id that drag payloads carry | `faceUp` is slaved to `isOwner` (can't show a face-up hand you don't control). Live `console.log("CARD CLICKED")` |
| `PlayZone.jsx` | The main drop target; also tap-to-play (click zone while a card is selected); `maxCards` support | Has `role="button"` but no keyboard handler |
| `Pile.jsx` | Accumulating stack showing its top card; optional drop target | No `disabled` prop; top card stays draggable (no guard against dragging out of a discard) |
| `CardSlot.jsx` | Single-card position; accepts a drop only while empty | No keyboard handler |
| `Deck.jsx` | Face-down clickable stack (replaces "Draw" buttons); calls `onDraw()` | Not a drop target, can't be dragged from — click-only by design |
| `DrawPile.jsx` | 8-line alias of `Deck` for config readability | Both map to abstract type `'deck'` — the distinction has no behavioral weight |

## `hooks/`

### `useCardInteraction.js` (~79 lines)
The single source of truth for HTML5 drag/drop wiring. Drag start serializes
`{ cardId, sourceZoneId }` as JSON under the `application/json` dataTransfer type; drop
parses it (silently ignoring malformed payloads) and calls
`onDrop({ cardId, sourceZoneId, targetZoneId })` where `targetZoneId` is the receiving
component's own zone id. Also exposes hover state. Its `clickHandlers` return value is
currently dead code — `primitives/Card` defines its own click handling.

### `useBoardEventHandlers.js` (~107 lines)
The routing layer: owns `selectedCardId` (tap-to-select), and `dispatchMove` builds the
key `` `${sourceZoneType}→${targetZoneType}` `` (literal `→` U+2192), looks it up in
`{...DEFAULT_MOVE_MAP, ...config.moveMap}`, resolves the resulting **name against the
handler bag**, and calls `fn(playerID, cardId, sourceZoneId, targetZoneId)` — that
4-argument tail is the contract `moveOverrides` functions receive after their
`(moves, G, …)` prefix. The zone-type abstraction (from `ZoneLayout`):

| `zone.type` | abstract | | `zone.type` | abstract |
|---|---|---|---|---|
| `Hand` | `hand` | | `Pile` | `pile` |
| `Deck` | `deck` | | `PlayZone` | `play` |
| `DrawPile` | `deck` | | `CardSlot` | `slot` |

Known issues (the full story is in
[board-engine.md](board-engine.md#the-move-dispatch-pipeline--and-why-playing-a-card-does-nothing)):
`DEFAULT_MOVE_MAP`'s `'hand→play': 'PlayCard'` and `'hand→discard': 'DiscardKitty'` name
handler-bag keys that don't exist (bag uses `playCard`/`discardCard`) — the silent no-op
behind Mighty's unplayable cards. Also: the click path always synthesizes
`hand-${playerID}` as the source (tap-to-play from any non-hand zone is impossible), and
cross-row drags rely on a `hand-` prefix heuristic to type their source zone —
non-hand cross-row drags resolve to `'unknown'` and can't match any moveMap key.

## `shared_handlers/` — the abstract handler bags (7 files)

Thin adapters (~40-60 lines each; plain functions, not real hooks) that map camelCase
abstract names to **snake_case** boardgame.io moves with optional chaining
(`moves.play_card?.(...)`) — so any move a game doesn't define is a silent no-op. Neither
Mighty nor War defines snake_case moves, which is why the whole layer is inert here and
scheduled for deletion in [refactor step 6](../project/refactor-plan.md#step-6--collapse-the-engines-dispatch-layering).

| File | Bag contents | Notes |
|---|---|---|
| `useCardInteractions.js` | `playCard`, `discardCard`, `drawCard`, `sortHand`, + 9 more | Signatures take a card *index*, but the dispatch layer passes a card *id* string — one more reason `moveOverrides` is currently mandatory |
| `useBetting.js` | `placeBid`, `raiseBet`, `fold`, `check`, + 10 more | Only 5 of 13 are wired into the bag |
| `useTurnRound.js` | `startGame`, `endTurn`, `forfeit`, `undoLastAction`, … | `undoLastAction` calls `moves.undo` — undo is a client *event* in boardgame.io, not a move, so it never fires |
| `usePlayerActions.js` | `claimTrick`, `declareWin`, `swapCards`, … | |
| `useScoring.js` | `updateScore`, `unlockAchievement`, `exportHandHistory` | The only one that reads `G` (`G.action_log`) |
| `useSocial.js` | `sendChatMessage`, `sendEmojiReaction`, moderation calls | The odd one out: takes `(roomID)`, POSTs REST to `SHARED_API_BASE` — a server that no longer exists |
| `config.js` | `API_BASE_URL`, `SHARED_API_BASE` | Hardcoded `localhost:5000` fallback; only `useSocial` imports it |
