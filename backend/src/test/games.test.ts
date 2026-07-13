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

  it("rejects a submission after the game has started with a 409", async () => {
    const createRes = await request(app).post("/api/games").send({ password: "secret" });
    const { gameId, hostToken } = createRes.body;
    const players = [];
    for (const playerName of ["Alice", "Bea", "Cy"]) {
      const joinRes = await request(app)
        .post(`/api/games/${gameId}/join`)
        .send({ playerName, password: "secret" });
      players.push(joinRes.body.playerToken);
    }
    for (const playerToken of players.slice(0, 2)) {
      await request(app)
        .post(`/api/games/${gameId}/statement`)
        .set("X-Player-Token", playerToken)
        .send({ statement: "in time" });
    }
    await request(app).post(`/api/games/${gameId}/start`).set("X-Host-Token", hostToken);

    const res = await request(app)
      .post(`/api/games/${gameId}/statement`)
      .set("X-Player-Token", players[2])
      .send({ statement: "too late" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Game has already started");
  });
});

describe("GET /api/games/:id/state", () => {
  it("returns the LOBBY view with each joined player's submission status", async () => {
    const createRes = await request(app).post("/api/games").send({ password: "secret" });
    const gameId = createRes.body.gameId;

    const alice = await request(app)
      .post(`/api/games/${gameId}/join`)
      .send({ playerName: "Alice", password: "secret" });
    await request(app)
      .post(`/api/games/${gameId}/join`)
      .send({ playerName: "Bob", password: "secret" });

    await request(app)
      .post(`/api/games/${gameId}/statement`)
      .set("X-Player-Token", alice.body.playerToken)
      .send({ statement: "I once shipped on a Friday" });

    const res = await request(app).get(`/api/games/${gameId}/state`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("LOBBY");
    expect(res.body.gameId).toBe(gameId);
    expect(res.body.players).toEqual([
      { id: alice.body.playerId, name: "Alice", hasSubmitted: true },
      expect.objectContaining({ name: "Bob", hasSubmitted: false }),
    ]);
  });

  it("returns a 404 for an unknown game", async () => {
    const res = await request(app).get("/api/games/nope/state");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Game not found");
  });

  describe("FINISHED phase", () => {
    async function finishedGame() {
      const createRes = await request(app).post("/api/games").send({ password: "secret" });
      const { gameId, hostToken } = createRes.body;

      const alice = await request(app)
        .post(`/api/games/${gameId}/join`)
        .send({ playerName: "Alice", password: "secret" });
      const bob = await request(app)
        .post(`/api/games/${gameId}/join`)
        .send({ playerName: "Bob", password: "secret" });

      await request(app)
        .post(`/api/games/${gameId}/statement`)
        .set("X-Player-Token", alice.body.playerToken)
        .send({ statement: "Alice statement" });
      await request(app)
        .post(`/api/games/${gameId}/statement`)
        .set("X-Player-Token", bob.body.playerToken)
        .send({ statement: "Bob statement" });

      await request(app).post(`/api/games/${gameId}/start`).set("X-Host-Token", hostToken);
      await request(app).post(`/api/games/${gameId}/next`).set("X-Host-Token", hostToken);
      await request(app).post(`/api/games/${gameId}/next`).set("X-Host-Token", hostToken);

      return { gameId, hostToken, alice: alice.body, bob: bob.body };
    }

    it("returns the full reveal for the Host Token", async () => {
      const { gameId, hostToken } = await finishedGame();

      const res = await request(app)
        .get(`/api/games/${gameId}/state`)
        .set("X-Host-Token", hostToken);

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(2);
    });

    it("returns only the caller's own result for a Player Token", async () => {
      const { gameId, alice } = await finishedGame();

      const res = await request(app)
        .get(`/api/games/${gameId}/state`)
        .set("X-Player-Token", alice.playerToken);

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].playerId).toBe(alice.playerId);
    });

    it("rejects a request with no credentials", async () => {
      const { gameId } = await finishedGame();

      const res = await request(app).get(`/api/games/${gameId}/state`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Missing or invalid token");
    });
  });
});

describe("POST /api/games/:id/start", () => {
  // A game with `submitters` players who submitted and `stragglers` who did not.
  async function stagedGame({ submitters = 2, stragglers = 0 } = {}) {
    const createRes = await request(app).post("/api/games").send({ password: "secret" });
    const { gameId, hostToken } = createRes.body;

    for (let i = 0; i < submitters; i++) {
      const join = await request(app)
        .post(`/api/games/${gameId}/join`)
        .send({ playerName: `Submitter ${i}`, password: "secret" });
      await request(app)
        .post(`/api/games/${gameId}/statement`)
        .set("X-Player-Token", join.body.playerToken)
        .send({ statement: `statement ${i}` });
    }
    for (let i = 0; i < stragglers; i++) {
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .send({ playerName: `Straggler ${i}`, password: "secret" });
    }

    return { gameId, hostToken };
  }

  it("starts the game and moves it to ACTIVE", async () => {
    const { gameId, hostToken } = await stagedGame({ submitters: 2 });

    const res = await request(app)
      .post(`/api/games/${gameId}/start`)
      .set("X-Host-Token", hostToken);

    expect(res.status).toBe(200);

    const state = await request(app).get(`/api/games/${gameId}/state`);
    expect(state.body.status).toBe("ACTIVE");
  });

  it("rejects starting with fewer than two submitted statements", async () => {
    const { gameId, hostToken } = await stagedGame({ submitters: 1, stragglers: 1 });

    const res = await request(app)
      .post(`/api/games/${gameId}/start`)
      .set("X-Host-Token", hostToken);

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("At least 2 players must have submitted a statement");
  });

  it("rejects a start from a request without the host token", async () => {
    const { gameId } = await stagedGame({ submitters: 2 });

    const res = await request(app).post(`/api/games/${gameId}/start`).set("X-Host-Token", "nope");

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Missing or invalid token");
  });
});
