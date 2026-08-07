# The Board Engine — `GenericBoard` (`frontend/src/engine/`)

Both game boards render through one component library — originally built in the Era 2
`game-client`, now living at
[frontend/src/engine/components/GenericBoard.jsx](../../frontend/src/engine/components/GenericBoard.jsx).

`frontend/src/board/MightyBoard.jsx` is just:

```jsx
import GenericBoard from '../engine/components/GenericBoard';
export default function MightyBoard(props) {
  return <GenericBoard {...props} config={MightyBoardConfig} />;
}
```

([board/war/WarBoard.jsx](../../frontend/src/board/war/WarBoard.jsx) is the same 7-line shape
with `WarBoardConfig`.)

## What's in the engine

Everything under `frontend/src/engine/`:

- `components/GenericBoard.jsx` (+ `.css`) — the hub
- `components/ZoneLayout.jsx` — maps zone configs to primitives, wires drag/drop
- `components/zoneLayoutDefaults.js` — default seat layout + placeholder data
- `components/zones/` — all 10 zone components + their CSS (Status, OpponentHand,
  CenterPlay, PlayerHand, DrawPile, DiscardPile, Score, Chat, Action, GameResult)
- `components/primitives/` — all 7 drag/drop widgets + `primitives.css` (Card, CardSlot,
  Deck, DrawPile, Hand, Pile, PlayZone)
- `components/Card.jsx`, `components/CardBack.jsx`, `components/Card.css` — the older card
  renderers, still imported by the zones and primitives
- `hooks/useBoardEventHandlers.js`, `hooks/useCardInteraction.js`
- `shared_handlers/`: `useCardInteractions`, `useBetting`, `useTurnRound`,
  `usePlayerActions`, `useSocial`, `useScoring`, and `config.js` (pulled in by `useSocial`)

## How GenericBoard works

Props come from the boardgame.io `Client` HOC: `G`, `ctx`, `moves`, `playerID`, `matchID`,
plus a per-game `config` object. The config contract (as used by
[MightyBoardConfig.js](../../frontend/src/board/MightyBoardConfig.js)):

| Config key | Meaning |
|---|---|
| `transformG(G, ctx, playerID)` | Reshape the raw game state into flat `G[zoneId]` arrays the layout expects (Mighty: sorts the hand trump-aware, builds `oppHand_1..4` rotated so *you* are always at the bottom) |
| `interactiveZones(ctx, playerID)` | Returns `{top, center, bottom, all}` zone descriptors (`{id, type, label, faceUp, interactive}`) |
| `zones` | Enable/disable the named overlay zones (status, score, chat, action) |
| `moveMap` | Remaps drag/drop routes to handler names — **keys must be zone-pair strings** like `'hand→play'` (see the bug below) |
| `moveOverrides` | `{abstractName: (moves, G, ...args) => ...}` — the escape hatch to call real bgio moves |
| `useDefaultInteractiveZones` | `true` = auto-build a generic seat layout instead of using `interactiveZones` |
| `actions` | Buttons for the ActionZone |

Two render paths ([GenericBoard.jsx:288-352](../../frontend/src/engine/components/GenericBoard.jsx#L288-L352)):

1. **Interactive path** (used by both Mighty and War): `ZoneLayout` renders rows of
   primitives (Hand/Pile/PlayZone/Deck) and wires clicks + HTML5 drag/drop through
   `useBoardEventHandlers`.
2. **Legacy named-zone path**: the 10 zone components driven by config field names — now
   only reachable via sandbox mode, a candidate for deletion in the engine-simplification
   step.

There is also a **sandbox mode** (zone toggles + "Copy Config" JSON exporter) that was used
by the deleted playground — harmless, deletable later.

## The move-dispatch pipeline — and why playing a card does nothing

This is the most important thing in this document. When you click/drag a card onto the
trick area, the chain is:

```
primitive (Hand/PlayZone)
  → useBoardEventHandlers.handleCardClick / handleCardDrop
    → moveMap lookup:      'hand→play'  →  'PlayCard'
      → handler bag lookup: handlers['PlayCard']   ← ✗ bag key is 'playCard' → undefined → silent return
        → (if it matched)   cardActions.playCard(playerID, cardId)
          → moves.play_card?.(...)                 ← ✗ Mighty's move is 'PlayCard', not 'play_card' → no-op
```

**Three different naming conventions collide**:

1. [useBoardEventHandlers.js:16-22](../../frontend/src/engine/hooks/useBoardEventHandlers.js#L16-L22)
   `DEFAULT_MOVE_MAP` maps `'hand→play'` to `'PlayCard'` (capitalized — recently edited).
2. GenericBoard's handler bag ([GenericBoard.jsx:123-164](../../frontend/src/engine/components/GenericBoard.jsx#L123-L164))
   uses camelCase keys (`playCard`), so `handlers['PlayCard']` is `undefined` and
   `dispatchMove` returns without doing anything
   ([useBoardEventHandlers.js:36-38](../../frontend/src/engine/hooks/useBoardEventHandlers.js#L36-L38)).
3. Even the camelCase handlers only call **snake_case** boardgame.io moves optionally —
   `moves.play_card?.(...)` ([useCardInteractions.js:20](../../frontend/src/engine/shared_handlers/useCardInteractions.js#L20)) —
   and Mighty's actual moves are `PlayCard`, `MakeBid`, etc. So the entire
   `shared_handlers` layer is a stack of no-ops for Mighty.

On top of that, `MightyBoardConfig.moveMap` is
`{ playCard: 'PlayCard', discardCard: 'DiscardToKitty' }` — those keys aren't zone-pair
strings, so they merge into the map as inert entries, and `DiscardToKitty` isn't even the
move's name (`DiscardKitty`).

**The minimal working fix** (until the refactor simplifies this layering away) is to use
`moveOverrides` + a correctly-keyed `moveMap` in `MightyBoardConfig`:

```js
moveMap: {
  'hand→play': 'playCard',      // route drop-on-PlayZone to the abstract handler
  'hand→discard': 'discardCard',
},
moveOverrides: {
  // abstract handler → real boardgame.io move. Signature: (moves, G, playerID, cardId, ...)
  playCard:    (moves, G, playerID, cardId) => moves.PlayCard(cardId),
  discardCard: (moves, G, playerID, cardId) => moves.DiscardKitty([cardId]),
},
```

`moveOverrides` entries replace bag entries by key and receive `(moves, G, ...args)`
([GenericBoard.jsx:167-175](../../frontend/src/engine/components/GenericBoard.jsx#L167-L175)), so
this is the supported hook for exactly this purpose. The War config
([board/war/WarBoardConfig.js](../../frontend/src/board/war/WarBoardConfig.js)) already does
exactly this — which is why War is playable and Mighty isn't yet.

Recommendation for the refactor: delete the abstract-handler indirection entirely and have
`useBoardEventHandlers` dispatch straight from a per-game `moveMap` to `moves[...]`. One
layer instead of three.

## Other engine gotchas

- **"End Turn" button is also a no-op for Mighty**: `handleEndTurn` tries `ctx.events.endTurn`
  (boardgame.io 0.50 passes `events` as a separate board prop, not on `ctx`, and GenericBoard
  never receives/forwards it), then falls back to `handlers.endTurn` →
  `moves.end_turn?.()` — which Mighty doesn't define.
- **Chat goes nowhere**: `useSocial` POSTs to `:5000/shared/chat/*`
  ([engine/shared_handlers/config.js](../../frontend/src/engine/shared_handlers/config.js)) —
  an endpoint that never existed and whose server (Flask) is now gone entirely, so chat
  actions fail with a connection error in the console. Strip `useSocial` in the
  engine-simplification step; chat done right would ride boardgame.io, not REST.
- Debug `console.log`s left in the hot path: `GenericBoard.jsx:219,223`,
  `useBoardEventHandlers.js:34,54-56`, `ZoneLayout.jsx:73`, `primitives/Hand.jsx:22` — one
  logs the entire transformed `G` on every render.
- `useBetting`, `useTurnRound`, `usePlayerActions`, `useScoring` are wired into the bag but,
  like `useCardInteractions`, only call snake_case moves no game defines — pure dead weight
  for Mighty. (The 5 hooks nothing imported at all were deleted in the cleanup.)
