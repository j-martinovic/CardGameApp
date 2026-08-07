# CardGameApp Docs

Documentation of the codebase — originally an audit of three stacked generations of the
app, updated 2026-08-06 after the big cleanup executed on branch `refactor-cleanup`.

**TL;DR (current state)**: Two processes run everything — `frontend/` (React, :5173) and
`backend/card_server/` (one Node server on :8000: boardgame.io games + lobby REST + auth
with SQLite/scrypt). Game rules live once in `shared/games/` (Mighty + War) and are
imported by both sides. **War is fully playable from the lobby**; Mighty deals and runs
its bidding logic, with card-play wiring and a list of verified rule bugs as the next
work. All the dead code from earlier generations (and ~15,000 committed `node_modules`
files, and the Flask server) is gone — recoverable from git history.

| Doc | What's in it |
|---|---|
| [01-overview.md](01-overview.md) | Architecture diagram, **how to run**, directory map, the three-era history, current game status |
| [02-frontend.md](02-frontend.md) | Screen-by-screen walkthrough, the lobby→game handshake, open quirks |
| [03-mighty-game-logic.md](03-mighty-game-logic.md) | Deep dive on `shared/games/Mighty.js`: state, phases, moves — and the **verified bug list** |
| [04-generic-board.md](04-generic-board.md) | The board engine (`frontend/src/engine/`): config contract, and **the card-play wiring fix** (Mighty's next step) |
| [05-backend.md](05-backend.md) | The merged Node backend: routes, the user store, what happened to Flask |
| [06-dead-code.md](06-dead-code.md) | ✅ Executed record of the deletion phases, with evidence and deviations |
| [07-refactor-plan.md](07-refactor-plan.md) | ✅ Steps 1–3 done + decisions made; **steps 4–8 = the live roadmap** |
| [history/](history/) | Archived Era 2 docs (`ARCHITECTURE.md`, `README_BOARDGAMEIO.md`, …) — historical reference only |
