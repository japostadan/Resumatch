import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { GameStore } from "../store/index.js";

// The health check holds no game state, so a single app around an empty store
// is enough for these read-only checks.
const app = createApp(new GameStore());

describe("GET /api/health", () => {
  it("returns 200 with status ok and a valid timestamp", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.timestamp).toBe("string");
    expect(new Date(res.body.timestamp).toString()).not.toBe("Invalid Date");
  });

  it("marks the response uncacheable so pollers never read stale state", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["cache-control"]).toBe("no-store");
  });
});
