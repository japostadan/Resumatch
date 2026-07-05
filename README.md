# CV Matching Game

A classroom web game for [CodeYourFuture](https://codeyourfuture.io) trainees. A volunteer creates a game, trainees submit their CV personal statements, then vote anonymously on whose statement each entry belongs to. Results show whether each statement is **Personal** (distinctive) or **Too Generic** (interchangeable).

Built as a MigraCode fullstack final project.

## Project status

Early development. The architecture below describes the **target design**; not all of it is built yet.

- 🟢 **Done** — monorepo scaffold (Vite + TanStack Router frontend, Express 5 backend), `@resumatch/shared` types package, typed error classes, CORS + error middleware, `/api/health`, CI, Dev Container
- 🟡 **In progress** — Game Store (#2), API routes
- ⚪ **Not started** — frontend screens / feature slices A–D (#3–#6), error states + accessibility (#7), deployment

## Tech stack

- **Frontend:** React 19 + TypeScript + Vite + TanStack Router + Tailwind CSS v4
- **Backend:** Node.js + Express 5 + TypeScript
- **Shared:** TypeScript types workspace package (`@resumatch/shared`)
- **Storage:** In-memory (no database — games are short-lived classroom sessions)
- **Testing:** Vitest + React Testing Library (frontend), Vitest + Supertest (backend)
- **Linting:** oxlint · **Formatting:** Prettier · **CI:** GitHub Actions

## Project structure

```
/
├── frontend/               ← React app
│   └── src/
│       ├── routes/         ← one file per screen (TanStack Router file-based)
│       ├── components/     ← reusable UI
│       ├── hooks/          ← useGameState (polling), useGameSession (tokens)
│       └── test/
├── backend/                ← Express API
│   └── src/
│       ├── routes/         ← HTTP layer only (parse req → call store → send res)
│       ├── store/          ← GameStore: all game state and rules
│       ├── errors/         ← typed error classes
│       └── test/
└── shared/                 ← TypeScript types only (GameView, API shapes)
```

## Getting started

### Option A — Dev Container (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) and the [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

1. Open the repo in VS Code
2. When prompted "Reopen in Container", click it (or run **Dev Containers: Reopen in Container** from the command palette)
3. Wait for the container to build and `npm install` to finish
4. Run `npm run dev`

The container pre-installs all recommended extensions and forwards ports automatically. Works identically on Windows, macOS, and Linux.

**GitHub Codespaces:** open the repo on GitHub and click **Code → Codespaces → Create codespace**. Zero local setup required.

### Option B — Local setup

Requires Node 24 ([mise](https://mise.jdx.dev) or [Volta](https://volta.sh) will pin the version automatically).

```bash
npm install       # install all workspaces
npm run dev       # start frontend + backend in parallel
```

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3000 |

No database setup needed — state is held in server memory.

## How the game works

### Roles

- **Host** (volunteer) — creates the game, controls pacing, does not submit a statement or vote
- **Player** (trainee) — joins with a Game ID + password, submits their CV personal statement, votes

### Game flow

```
LOBBY → ACTIVE → FINISHED
```

1. Host creates a game and shares the Game ID + password with the class
2. Players join and submit their personal statements
3. Host starts the game (players without a statement are excluded; minimum 2 required)
4. Statements are shown one at a time in random order — players vote on whose it is
5. Host controls when to advance to the next statement (for classroom discussion)
6. Results show each statement, its author, vote score, and a **Personal** / **Too Generic** verdict

### Verdicts

- **Personal** — ≥ 50% of voters correctly identified the author
- **Too Generic** — < 50% identified the author

## Architecture

### Game Store

All game state lives in a single in-memory `Map<string, Game>` owned by the `GameStore` module. The store is the sole enforcer of game rules — routes are thin (parse, call store, map typed error to HTTP status). Game data expires 24 hours after creation and is lazily deleted on the next request.

### API

| Method | Path                       | Auth             | Description                                  |
| ------ | -------------------------- | ---------------- | -------------------------------------------- |
| POST   | `/api/games`               | —                | Create game → `{ gameId, hostToken }`        |
| POST   | `/api/games/:id/join`      | —                | Join game → `{ playerId, playerToken }`      |
| GET    | `/api/games/:id/state`     | —                | Poll state (`?playerId=xxx` for player view) |
| POST   | `/api/games/:id/statement` | `X-Player-Token` | Submit statement                             |
| POST   | `/api/games/:id/start`     | `X-Host-Token`   | Start game                                   |
| POST   | `/api/games/:id/vote`      | `X-Player-Token` | Cast vote                                    |
| POST   | `/api/games/:id/next`      | `X-Host-Token`   | Advance to next statement                    |

### Shared types

`shared/` is a types-only workspace package. It exports `GameView` (a discriminated union of `LobbyView | ActiveView | FinishedView`), API body shapes, and `GameStatus`. No logic lives there — scoring is in the store, display formatting is in the frontend.

### Token persistence

Tokens are stored in the URL hash (`/game/:id#token=xxx`). The hash fragment is never sent to the server and survives page refresh. `localStorage` is not used.

## Testing

```bash
npm run test              # run all tests
cd frontend && npm run test:watch   # frontend watch mode
cd backend  && npm run test         # backend only
```

**Backend:** unit tests for GameStore state machine transitions; Supertest integration tests for each API endpoint covering happy paths, auth failures, invalid state transitions.

**Frontend:** component tests render each screen with mock `useGameState` output and assert on what the user sees and can interact with.

## Scripts

| Command             | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start frontend + backend in parallel |
| `npm run build`     | Build both apps for production       |
| `npm run test`      | Run all tests                        |
| `npm run typecheck` | Type-check all packages              |
| `npm run lint`      | Lint all source files                |
| `npm run format`    | Format all files                     |

## Deployment

Target: **Railway** — supports monorepo deployments, no cold starts, low maintenance burden for CYF volunteers.

**Backend environment variables:**

```
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com
```

No database addon required — the backend is stateless between deploys (in-memory only). A server restart during an active game will lose that game's state; players should start a new game.

## CI

GitHub Actions runs on every push and pull request to `main`:

- Lint → format check → type-check → test → build
