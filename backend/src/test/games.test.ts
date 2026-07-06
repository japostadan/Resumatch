import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../app.js";
import { GameStore } from "../store/index.js";

let store: GameStore;
let app: Express;

beforeEach(() => {
  store = new GameStore();
  app = createApp(store);
});

describe("POST /api/games", () => {
  it("creates a game and returns a Game ID and Host Token", async () => {
    const res = await request(app).post("/api/games").send({ password: "secret" });

    expect(res.status).toBe(201);
    expect(typeof res.body.gameId).toBe("string");
    expect(res.body.gameId).toBeTruthy();
    expect(typeof res.body.hostToken).toBe("string");
    expect(res.body.hostToken).toBeTruthy();
  });

  it("rejects a missing password with a 400 and a clear error", async () => {
    const res = await request(app).post("/api/games").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("A password is required");
  });

  it("rejects an empty password with a 400", async () => {
    const res = await request(app).post("/api/games").send({ password: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("A password is required");
  });

  it("rejects a whitespace-only password with a 400", async () => {
    const res = await request(app).post("/api/games").send({ password: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("A password is required");
  });

  it("rejects a non-string password with a 400", async () => {
    const res = await request(app).post("/api/games").send({ password: 123 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("A password is required");
  });

  it("rejects a malformed JSON body with a 400 rather than a 500", async () => {
    const res = await request(app)
      .post("/api/games")
      .set("Content-Type", "application/json")
      .send("{ not valid json");

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe("string");
  });
});

describe("POST /api/games/:id/join", () => {
  it("joins a game with the correct password", async () => {
    const createRes = await request(app).post("/api/games").send({ password: "secret" });

    const gameId = createRes.body.gameId;

    const joinRes = await request(app).post(`/api/games/${gameId}/join`).send({
      playerName: "Alice",
      password: "secret",
    });

    expect(joinRes.status).toBe(200);
    expect(typeof joinRes.body.playerId).toBe("string");
    expect(joinRes.body.playerId).toBeTruthy();
    expect(typeof joinRes.body.playerToken).toBe("string");
    expect(joinRes.body.playerToken).toBeTruthy();
  });

  it("rejects an incorrect password", async () => {
    const createRes = await request(app).post("/api/games").send({ password: "secret" });

    const gameId = createRes.body.gameId;

    const joinRes = await request(app).post(`/api/games/${gameId}/join`).send({
      playerName: "Alice",
      password: "wrong-password",
    });

    expect(joinRes.status).toBe(403);
    expect(joinRes.body.error).toBe("Wrong password");
  });

  it("rejects a missing player name with a 400", async () => {
    const createRes = await request(app).post("/api/games").send({ password: "secret" });

    const joinRes = await request(app)
      .post(`/api/games/${createRes.body.gameId}/join`)
      .send({ password: "secret" });

    expect(joinRes.status).toBe(400);
    expect(joinRes.body.error).toBe("A player name is required");
  });

  it("rejects a missing password with a 400", async () => {
    const createRes = await request(app).post("/api/games").send({ password: "secret" });

    const joinRes = await request(app)
      .post(`/api/games/${createRes.body.gameId}/join`)
      .send({ playerName: "Alice" });

    expect(joinRes.status).toBe(400);
    expect(joinRes.body.error).toBe("A password is required");
  });

  it("rejects joining an ACTIVE game", async () => {
    const createRes = await request(app).post("/api/games").send({ password: "secret" });
    const { gameId, hostToken } = createRes.body;

    const alice = await request(app)
      .post(`/api/games/${gameId}/join`)
      .send({ playerName: "Alice", password: "secret" });

    const bob = await request(app)
      .post(`/api/games/${gameId}/join`)
      .send({ playerName: "Bob", password: "secret" });

    store.submitStatement(gameId, alice.body.playerToken, "I like cats");
    store.submitStatement(gameId, bob.body.playerToken, "I like dogs");

    store.startGame(gameId, hostToken);

    const joinRes = await request(app)
      .post(`/api/games/${gameId}/join`)
      .send({ playerName: "Charlie", password: "secret" });

    expect(joinRes.status).toBe(409);
    expect(joinRes.body.error).toBe("Game has already started");
  });
});

describe("POST /api/games/:id/statement", () => {
  async function joinedPlayer(password = "secret") {
    const createRes = await request(app).post("/api/games").send({ password });
    const gameId = createRes.body.gameId;
    const joinRes = await request(app)
      .post(`/api/games/${gameId}/join`)
      .send({ playerName: "Alice", password });
    return { gameId, playerToken: joinRes.body.playerToken };
  }

  it("accepts a statement from a joined player", async () => {
    const { gameId, playerToken } = await joinedPlayer();

    const res = await request(app)
      .post(`/api/games/${gameId}/statement`)
      .set("X-Player-Token", playerToken)
      .send({ statement: "I once shipped on a Friday" });

    expect(res.status).toBe(200);
  });

  it("rejects a second submission from the same player with a clear message", async () => {
    const { gameId, playerToken } = await joinedPlayer();

    await request(app)
      .post(`/api/games/${gameId}/statement`)
      .set("X-Player-Token", playerToken)
      .send({ statement: "first" });

    const res = await request(app)
      .post(`/api/games/${gameId}/statement`)
      .set("X-Player-Token", playerToken)
      .send({ statement: "second" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("You have already submitted a statement");
  });

  it("rejects an empty statement with a 400", async () => {
    const { gameId, playerToken } = await joinedPlayer();

    const res = await request(app)
      .post(`/api/games/${gameId}/statement`)
      .set("X-Player-Token", playerToken)
      .send({ statement: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("A statement is required");
  });

  it("rejects a submission with a missing or invalid token", async () => {
    const { gameId } = await joinedPlayer();

    const res = await request(app)
      .post(`/api/games/${gameId}/statement`)
      .send({ statement: "no token" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Missing or invalid token");
  });
});
