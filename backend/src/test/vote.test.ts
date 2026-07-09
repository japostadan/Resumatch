import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { GameStore } from "../store/index.js";

describe("POST /api/games/:id/vote", () => {
  let store: GameStore;
  let app: ReturnType<typeof createApp>;
  let gameId: string;
  let hostToken: string;
  let aliceToken: string;
  let aliceId: string;
  let bobId: string;
  let bobToken: string;
  let charlieId: string;
  let charlieToken: string;

  beforeEach(() => {
    store = new GameStore();
    app = createApp(store);

    const game = store.createGame("secret123");
    gameId = game.gameId;
    hostToken = game.hostToken;

    const alice = store.joinGame(gameId, "secret123", "Alice");
    aliceToken = alice.playerToken;
    aliceId = alice.playerId;

    const bob = store.joinGame(gameId, "secret123", "Bob");
    bobToken = bob.playerToken;
    bobId = bob.playerId;

    const charlie = store.joinGame(gameId, "secret123", "Charlie");
    charlieToken = charlie.playerToken;
    charlieId = charlie.playerId;

    store.submitStatement(gameId, aliceToken, "I can juggle flaming torches");
    store.submitStatement(gameId, bobToken, "I once met a celebrity");
    store.submitStatement(gameId, charlieToken, "I have a pet iguana");

    store.startGame(gameId, hostToken);
  });

  describe("Happy Path", () => {
    it("casts a vote successfully with valid token, nominee, and phase", async () => {
      const response = await request(app)
        .post(`/api/games/${gameId}/vote`)
        .set("X-Player-Token", aliceToken)
        .send({ nomineeId: bobId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    it("allows different players to vote on the same statement", async () => {
      const res1 = await request(app)
        .post(`/api/games/${gameId}/vote`)
        .set("X-Player-Token", aliceToken)
        .send({ nomineeId: bobId });
      expect(res1.status).toBe(200);
      expect(res1.body).toEqual({ ok: true });

      const res2 = await request(app)
        .post(`/api/games/${gameId}/vote`)
        .set("X-Player-Token", bobToken)
        .send({ nomineeId: charlieId });
      expect(res2.status).toBe(200);
      expect(res2.body).toEqual({ ok: true });

      const res3 = await request(app)
        .post(`/api/games/${gameId}/vote`)
        .set("X-Player-Token", charlieToken)
        .send({ nomineeId: aliceId });
      expect(res3.status).toBe(200);
      expect(res3.body).toEqual({ ok: true });
    });
  });

  describe("Duplicate Vote", () => {
    it("returns clear feedback when player tries to vote twice on the same statement", async () => {
      await request(app)
        .post(`/api/games/${gameId}/vote`)
        .set("X-Player-Token", aliceToken)
        .send({ nomineeId: bobId });

      const response = await request(app)
        .post(`/api/games/${gameId}/vote`)
        .set("X-Player-Token", aliceToken)
        .send({ nomineeId: charlieId });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("You have already voted on this statement");
    });
  });

  describe("Wrong Token", () => {
    it("returns clear feedback when token is missing", async () => {
      const response = await request(app)
        .post(`/api/games/${gameId}/vote`)
        .send({ nomineeId: bobId });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Missing or invalid token");
    });

    it("returns clear feedback when token is invalid", async () => {
      const response = await request(app)
        .post(`/api/games/${gameId}/vote`)
        .set("X-Player-Token", "not-a-real-token")
        .send({ nomineeId: bobId });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Missing or invalid token");
    });
  });

  describe("Bad Nominee", () => {
    it("returns clear feedback when nomineeId is missing", async () => {
      const response = await request(app)
        .post(`/api/games/${gameId}/vote`)
        .set("X-Player-Token", aliceToken)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("A nominee is required");
    });

    it("returns clear feedback when nomineeId is not a candidate", async () => {
      const response = await request(app)
        .post(`/api/games/${gameId}/vote`)
        .set("X-Player-Token", aliceToken)
        .send({ nomineeId: "not-a-player" });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Nominee is not a valid candidate");
    });
  });

  describe("Wrong Phase", () => {
    it("returns clear feedback when voting in LOBBY phase", async () => {
      const lobbyGame = store.createGame("secret");
      const player = store.joinGame(lobbyGame.gameId, "secret", "LobbyPlayer");

      const response = await request(app)
        .post(`/api/games/${lobbyGame.gameId}/vote`)
        .set("X-Player-Token", player.playerToken)
        .send({ nomineeId: "some-id" });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Voting is not open");
    });

    it("returns clear feedback when voting in FINISHED phase", async () => {
      // Advancing past the last statement finishes the game; votes are not required.
      store.advanceStatement(gameId, hostToken);
      store.advanceStatement(gameId, hostToken);
      store.advanceStatement(gameId, hostToken);

      const response = await request(app)
        .post(`/api/games/${gameId}/vote`)
        .set("X-Player-Token", aliceToken)
        .send({ nomineeId: bobId });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Voting is not open");
    });
  });
});

describe("GET /api/games/:id/state — Player voting view data", () => {
  let store: GameStore;
  let app: ReturnType<typeof createApp>;
  let gameId: string;
  let hostToken: string;
  let aliceToken: string;
  let aliceId: string;
  let bobId: string;

  beforeEach(() => {
    store = new GameStore();
    app = createApp(store);

    const game = store.createGame("secret123");
    gameId = game.gameId;
    hostToken = game.hostToken;

    const alice = store.joinGame(gameId, "secret123", "Alice");
    aliceToken = alice.playerToken;
    aliceId = alice.playerId;

    const bob = store.joinGame(gameId, "secret123", "Bob");
    bobId = bob.playerId;

    store.submitStatement(gameId, aliceToken, "I can juggle flaming torches");
    store.submitStatement(gameId, bob.playerToken, "I once met a celebrity");

    store.startGame(gameId, hostToken);
  });

  it("shows the current anonymous statement and candidate names with own name excluded", async () => {
    const response = await request(app)
      .get(`/api/games/${gameId}/state`)
      .query({ playerId: aliceId });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ACTIVE");
    expect(response.body.currentStatement).toBeDefined();
    expect(typeof response.body.currentStatement).toBe("string");
    expect(response.body.candidates).toBeDefined();
    expect(response.body.candidates.length).toBe(1);
    expect(response.body.candidates[0].id).toBe(bobId);
    expect(response.body.candidates[0].name).toBe("Bob");

    const candidateIds = response.body.candidates.map((c: any) => c.id);
    expect(candidateIds).not.toContain(aliceId);
  });

  it("shows hasVoted: false before voting", async () => {
    const response = await request(app)
      .get(`/api/games/${gameId}/state`)
      .query({ playerId: aliceId });

    expect(response.body.hasVoted).toBe(false);
  });

  it("shows hasVoted: true after voting", async () => {
    await request(app)
      .post(`/api/games/${gameId}/vote`)
      .set("X-Player-Token", aliceToken)
      .send({ nomineeId: bobId });

    const response = await request(app)
      .get(`/api/games/${gameId}/state`)
      .query({ playerId: aliceId });

    expect(response.body.hasVoted).toBe(true);
  });
});
