# CardGameApp Docs

Documentation of the codebase as of 2026-08-06 — what's live, what's dead, how the live
parts work, and how to clean it up without losing the game.

**TL;DR**: The live app is `frontend/` (React, :5173) + `backend/card_server/`
(boardgame.io running Mighty, :8000/:8080) + `backend/main_server/` (Flask accounts,
:5000). About half the source files — `game-server/`, `card-resources/`, most of
`game-client/`, Flask's `shared_handlers/`, and assorted duplicates — are unreachable code
from two earlier iterations. The one twist: the live Mighty board renders through
`game-client/src/components/GenericBoard`, so that slice of the "old" tree is actually the
current UI engine and must be moved, not deleted.

Read in order, or jump to what you need:

| Doc | What's in it |
|---|---|
| [01-overview.md](01-overview.md) | The three eras of the repo, architecture diagram, ports, **how to run it**, directory verdict map |
| [02-frontend.md](02-frontend.md) | Screen-by-screen walkthrough of `frontend/`, the lobby→game handshake, quirks, dead files |
| [03-mighty-game-logic.md](03-mighty-game-logic.md) | Deep dive on `Mighty.js`: state shape, phases, every move — and the **verified bug list** (incl. the trick-completion crash) |
| [04-generic-board.md](04-generic-board.md) | The board engine living in `game-client/`: config contract, and **why clicking a card currently does nothing** (with the fix) |
| [05-backend.md](05-backend.md) | `card_server` + Flask: route-by-route caller audit, the unregistered `shared_handlers` story, security notes |
| [06-dead-code.md](06-dead-code.md) | **The deletion guide**: phased removal list with evidence, exact import-lines to edit, and the do-NOT-delete list |
| [07-refactor-plan.md](07-refactor-plan.md) | Target structure and step-by-step refactor that keeps the original author productive |
