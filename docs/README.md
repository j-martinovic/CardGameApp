# CardGameApp Docs

Documentation of the whole codebase, organized by the part of the project each doc
covers. Updated 2026-08-06 (post-cleanup: branch `refactor-cleanup` / the stacked PRs).

**TL;DR**: Two processes run everything — `frontend/` (React, :5173) and
`backend/card_server/` (one Node server on :8000: boardgame.io games + lobby REST + auth
with SQLite/scrypt). Game rules live once in `shared/games/` and are imported by both
sides. **War is fully playable**; Mighty deals and runs its bidding logic, with card-play
wiring and a verified rule-bug list as the next work.

## Start here

| Doc | What's in it |
|---|---|
| [overview.md](overview.md) | Architecture diagram, **how to run**, directory map, project history, current status |
| [boardgame-io.md](boardgame-io.md) | **The framework primer**: every boardgame.io concept we use, with links to the official docs and to where each concept lives in this repo |

## frontend/ (the React app)

| Doc | What's in it |
|---|---|
| [frontend/screens.md](frontend/screens.md) | Screen-by-screen walkthrough: Home, Login, the lobby, per-file roles and network calls |
| [frontend/lobby-and-clients.md](frontend/lobby-and-clients.md) | How a match starts/runs/ends (sequence diagram), connection tokens & credentials, **checklist for adding a new game** |
| [frontend/board-engine.md](frontend/board-engine.md) | GenericBoard: the config contract, the two render paths, and **the card-play wiring fix Mighty needs** |
| [frontend/engine-reference.md](frontend/engine-reference.md) | File-by-file reference for `src/engine/`: every zone, primitive, and hook — what it renders, what config it reads |

## backend/ (the Node server)

| Doc | What's in it |
|---|---|
| [backend/architecture.md](backend/architecture.md) | The one-port server: games + lobby REST + auth on :8000, route inventory, what happened to Flask |
| [backend/auth-and-users.md](backend/auth-and-users.md) | `users.js` in depth: the SQLite store, how scrypt password hashing works, each route's request/response, honest limitations |

## shared/ (the game definitions)

| Doc | What's in it |
|---|---|
| [shared/mighty.md](shared/mighty.md) | Mighty rules deep-dive: state shape, phases/stages, every move — and the **verified bug list** with line references |
| [shared/war.md](shared/war.md) | War walkthrough: the one-move design, war resolution, and how its board config is the model for wiring Mighty |

## project/ (meta: history and plans)

| Doc | What's in it |
|---|---|
| [project/dead-code.md](project/dead-code.md) | ✅ Executed record of the dead-code removal, with evidence and deviations |
| [project/refactor-plan.md](project/refactor-plan.md) | ✅ Steps 1–3 done + decisions; **steps 4–8 = the live roadmap** |
| [project/history/](project/history/) | Archived Era 2 docs (`ARCHITECTURE.md`, `README_BOARDGAMEIO.md`, …) — historical reference only, they describe deleted architecture |

## Suggested reading order

New to the project: [overview.md](overview.md) → [boardgame-io.md](boardgame-io.md) →
[shared/war.md](shared/war.md) (small, complete example) →
[frontend/lobby-and-clients.md](frontend/lobby-and-clients.md) →
[shared/mighty.md](shared/mighty.md) →
[frontend/board-engine.md](frontend/board-engine.md) — then
[project/refactor-plan.md](project/refactor-plan.md) for what to build next.
