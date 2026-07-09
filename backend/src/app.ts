import express, { type NextFunction, type Request, type Response } from "express";
import type { CreateGameBody, JoinGameBody, SubmitStatementBody } from "@resumatch/shared";
import { isGameError } from "./errors/index.js";
import { GameStore } from "./store/index.js";

// Middleware such as express.json() tags client errors (e.g. a malformed body)
// with a 4xx status; read it so those are not reported as 500s.
function errorStatus(err: unknown): number {
  if (err && typeof err === "object") {
    const candidate = err as { status?: unknown; statusCode?: unknown };
    if (typeof candidate.status === "number") return candidate.status;
    if (typeof candidate.statusCode === "number") return candidate.statusCode;
  }
  return 500;
}

// Error handler (must be mounted last). Exported so tests exercise the shipped
// handler directly rather than a copy that can silently drift from it.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (isGameError(err)) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  const status = errorStatus(err);
  if (status >= 400 && status < 500) {
    res.status(status).json({ error: err instanceof Error ? err.message : "Invalid request" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

// Build an Express app wired to a specific GameStore. Production constructs
// one store and one app (see index.ts); tests construct a fresh store per
// case so no game state leaks between them.
export function createApp(store: GameStore) {
  const app = express();

  // ── Middleware ────────────────────────────────────────────────────────────
  app.use(express.json());

  app.use((_req, res, next) => {
    const origin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Host-Token, X-Player-Token");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    next();
  });

  app.options(/.*/, (_req, res) => {
    res.sendStatus(204);
  });

  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  // ── Routes ──────────────────────────────────────────────────────────────
  // Mount game routes here. Keep this file clean — one line per feature.

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/games", (req, res) => {
    const { password } = (req.body ?? {}) as CreateGameBody;
    res.status(201).json(store.createGame(password));
  });

  app.post("/api/games/:id/join", (req, res) => {
    const { playerName, password } = (req.body ?? {}) as JoinGameBody;

    const result = store.joinGame(req.params.id, password, playerName);

    res.json(result);
  });

  app.post("/api/games/:id/statement", (req, res) => {
    const { statement } = (req.body ?? {}) as SubmitStatementBody;
    const playerToken = req.header("X-Player-Token") ?? "";

    store.submitStatement(req.params.id, playerToken, statement);

    res.json({ ok: true });
  });

  app.post("/api/games/:id/start", (req, res) => {
    const hostToken = req.header("X-Host-Token") ?? "";

    store.startGame(req.params.id, hostToken);

    res.json({ ok: true });
  });

  app.get("/api/games/:id/state", (req, res) => {
    const playerId = typeof req.query.playerId === "string" ? req.query.playerId : undefined;

    res.json(store.getState(req.params.id, playerId));
  });

  app.post("/api/games/:id/vote", (req, res) => {
    const playerToken = req.header("X-Player-Token") ?? "";
    const nomineeId = typeof req.body?.nomineeId === "string" ? req.body.nomineeId : "";

    store.castVote(req.params.id, playerToken, nomineeId);

    res.json({ ok: true });
  });

  app.post("/api/games/:id/next", (req, res) => {
    const hostToken = req.header("X-Host-Token") ?? "";

    store.advanceStatement(req.params.id, hostToken);

    res.json({ ok: true });
  });

  // ── Error handler (must be last) ──────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
