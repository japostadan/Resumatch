import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { GameStore } from "../store/index.js";

describe("POST /api/games/:id/next", () => {
  let store: GameStore;
  let app: ReturnType<typeof createApp>;
  let gameId: string;
  let hostToken: string;

  beforeEach(() => {
    store = new GameStore();
    app = createApp(store);

    const game = store.createGame("secret123");
    gameId = game.gameId;
    hostToken = game.hostToken;

    const alice = store.joinGame(gameId, "secret123", "Alice");
    const bob = store.joinGame(gameId, "secret123", "Bob");

    store.submitStatement(gameId, alice.playerToken, "I can juggle flaming torches");
    store.submitStatement(gameId, bob.playerToken, "I once met a celebrity");

    store.startGame(gameId, hostToken);
  });

  describe("Happy Path", () => {
    it("advances to the next statement with a valid host token", async () => {
      const response = await request(app)
        .post(`/api/games/${gameId}/next`)
        .set("X-Host-Token", hostToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });

      const state = await request(app).get(`/api/games/${gameId}/state`);
      expect(state.body.status).toBe("ACTIVE");
      expect(state.body.currentStatementIndex).toBe(1);
    });
  });

  describe("Past the Final Statement", () => {
    it("transitions the game to FINISHED after the last statement", async () => {
      // Two statements: index 0 -> 1 stays ACTIVE, then past the last -> FINISHED.
      await request(app).post(`/api/games/${gameId}/next`).set("X-Host-Token", hostToken);

      const response = await request(app)
        .post(`/api/games/${gameId}/next`)
        .set("X-Host-Token", hostToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });

      const state = await request(app).get(`/api/games/${gameId}/state`);
      expect(state.body.status).toBe("FINISHED");
    });

    it("returns clear feedback when advancing a FINISHED game", async () => {
      await request(app).post(`/api/games/${gameId}/next`).set("X-Host-Token", hostToken);
      await request(app).post(`/api/games/${gameId}/next`).set("X-Host-Token", hostToken);

      const response = await request(app)
        .post(`/api/games/${gameId}/next`)
        .set("X-Host-Token", hostToken);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Game is not in progress");
    });
  });

  describe("Wrong Token", () => {
    it("returns clear feedback when token is missing", async () => {
      const response = await request(app).post(`/api/games/${gameId}/next`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Missing or invalid token");
    });

    it("returns clear feedback when token is invalid", async () => {
      const response = await request(app)
        .post(`/api/games/${gameId}/next`)
        .set("X-Host-Token", "not-the-host");

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Missing or invalid token");
    });
  });

  describe("Wrong Phase", () => {
    it("returns clear feedback when advancing in LOBBY phase", async () => {
      const lobbyGame = store.createGame("secret");

      const response = await request(app)
        .post(`/api/games/${lobbyGame.gameId}/next`)
        .set("X-Host-Token", lobbyGame.hostToken);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Game is not in progress");
    });
  });
});
