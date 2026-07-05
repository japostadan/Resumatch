import express, { type NextFunction, type Request, type Response } from "express";
import type { CreateGameBody, JoinGameBody } from "@resumatch/shared";
import { isGameError } from "./errors/index.js";
import { createGame, joinGame } from "./store/index.js";

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

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
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

// ── Routes ──────────────────────────────────────────────────────────────────
// Mount game routes here. Keep this file clean — one line per feature.

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/games", (req, res) => {
  const { password } = (req.body ?? {}) as CreateGameBody;
  res.status(201).json(createGame(password));
});

app.post("/api/games/:id/join", (req, res) => {
  const { playerName, password } = (req.body ?? {}) as JoinGameBody;

  const result = joinGame(req.params.id, password, playerName);

  res.json(result);
});

// ── Error handler (must be last) ────────────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
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
});

export { app };
