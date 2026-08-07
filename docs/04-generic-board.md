# The Board Engine — `GenericBoard` (lives in `game-client/`, used by `frontend/`)

The Mighty table UI is not rendered by code in `frontend/`. It's rendered by an Era 2
component library that survived the pivot:
[game-client/src/components/GenericBoard.jsx](../game-client/src/components/GenericBoard.jsx).

`frontend/src/board/MightyBoard.jsx` is just:

```jsx
import GenericBoard from '../../../game-client/src/components/GenericBoard';
export default function MightyBoard(props) {
  return <GenericBoard {...props} config={MightyBoardConfig} />;
}
```

This is the **only** reason `game-client/` must stay in the repo today. The refactor plan
([07-refactor-plan.md](07-refactor-plan.md)) moves this engine into `frontend/` and deletes
the rest of `game-client/`.

## Exactly which `game-client` files are live

Computed by following every import from the frontend entry point:

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

Everything else in `game-client/` is dead — see [06-dead-code.md](06-dead-code.md).

## How GenericBoard works

Props come from the boardgame.io `Client` HOC: `G`, `ctx`, `moves`, `playerID`, `matchID`,
plus a per-game `config` object. The config contract (as used by
[MightyBoardConfig.js](../frontend/src/board/MightyBoardConfig.js)):

| Config key | Meaning |
|---|---|
| `transformG(G, ctx, playerID)` | Reshape the raw game state into flat `G[zoneId]` arrays the layout expects (Mighty: sorts the hand trump-aware, builds `oppHand_1..4` rotated so *you* are always at the bottom) |
| `interactiveZones(ctx, playerID)` | Returns `{top, center, bottom, all}` zone descriptors (`{id, type, label, faceUp, interactive}`) |
| `zones` | Enable/disable the named overlay zones (status, score, chat, action) |
| `moveMap` | Remaps drag/drop routes to handler names — **keys must be zone-pair strings** like `'hand→play'` (see the bug below) |
| `moveOverrides` | `{abstractName: (moves, G, ...args) => ...}` — the escape hatch to call real bgio moves |
| `useDefaultInteractiveZones` | `true` = auto-build a generic seat layout instead of using `interactiveZones` |
| `actions` | Buttons for the ActionZone |

Two render paths ([GenericBoard.jsx:288-352](../game-client/src/components/GenericBoard.jsx#L288-L352)):

1. **Interactive path** (used by Mighty): `ZoneLayout` renders rows of primitives
   (Hand/Pile/PlayZone/Deck) and wires clicks + HTML5 drag/drop through
   `useBoardEventHandlers`.
2. **Legacy named-zone path** (used by Era 2 War/Go Fish): the 10 zone components driven by
   config field names.

There is also a **sandbox mode** (zone toggles + "Copy Config" JSON exporter) used by the
dead playground — harmless, deletable later.

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

1. [useBoardEventHandlers.js:16-22](../game-client/src/hooks/useBoardEventHandlers.js#L16-L22)
   `DEFAULT_MOVE_MAP` maps `'hand→play'` to `'PlayCard'` (capitalized — recently edited).
2. GenericBoard's handler bag ([GenericBoard.jsx:123-164](../game-client/src/components/GenericBoard.jsx#L123-L164))
   uses camelCase keys (`playCard`), so `handlers['PlayCard']` is `undefined` and
   `dispatchMove` returns without doing anything
   ([useBoardEventHandlers.js:36-38](../game-client/src/hooks/useBoardEventHandlers.js#L36-L38)).
3. Even the camelCase handlers only call **snake_case** boardgame.io moves optionally —
   `moves.play_card?.(...)` ([useCardInteractions.js:20](../game-client/src/shared_handlers/useCardInteractions.js#L20)) —
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
([GenericBoard.jsx:167-175](../game-client/src/components/GenericBoard.jsx#L167-L175)), so
this is the supported hook for exactly this purpose. Era 2's War config did the same thing.

Recommendation for the refactor: delete the abstract-handler indirection entirely and have
`useBoardEventHandlers` dispatch straight from a per-game `moveMap` to `moves[...]`. One
layer instead of three.

## Other engine gotchas

- **"End Turn" button is also a no-op for Mighty**: `handleEndTurn` tries `ctx.events.endTurn`
  (boardgame.io 0.50 passes `events` as a separate board prop, not on `ctx`, and GenericBoard
  never receives/forwards it), then falls back to `handlers.endTurn` →
  `moves.end_turn?.()` — which Mighty doesn't define.
- **Chat 404s**: `useSocial` is live and POSTs to Flask
  `:5000/shared/chat/*` — but the `shared_handlers` blueprint was never registered in Flask
  ([05-backend.md](05-backend.md)), so every chat message, emoji, and mute/report/block call
  returns 404. Either register the blueprint or (simpler) strip `useSocial` wiring when
  extracting the engine.
- Debug `console.log`s left in the hot path: `GenericBoard.jsx:219,223`,
  `useBoardEventHandlers.js:34,54-56`, `ZoneLayout.jsx:73`, `primitives/Hand.jsx:22` — one
  logs the entire transformed `G` on every render.
- `useBetting`, `useTurnRound`, `usePlayerActions`, `useScoring` are wired into the bag but,
  like `useCardInteractions`, only call snake_case moves no game defines — pure dead weight
  for Mighty. The remaining 5 shared_handlers hooks (`useLobby`, `useDebug`,
  `useBridgeSpecific`, `useEuchreSpecific`, `usePokerSpecific`) plus the `index.js` barrel
  are imported by nothing at all.
