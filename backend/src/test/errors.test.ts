import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import { errorHandler } from "../app.js";
import {
  GameNotFoundError,
  GameExpiredError,
  WrongPasswordError,
  MissingPasswordError,
  MissingNameError,
  MissingStatementError,
  BadTokenError,
  WrongStatusError,
  AlreadyVotedError,
  AlreadySubmittedError,
  NotEnoughPlayersError,
} from "../errors/index.js";

// Exercise the real error-handler middleware shipped in app.ts by mounting it
// behind a route that throws. This avoids re-implementing (and drifting from)
// the handler while still reaching every branch, including ones no current
// route can trigger (the generic 4xx pass-through and the 500 fallback).
function makeApp(thrower: () => never) {
  const app = express();
  app.get("/test", () => {
    thrower();
  });
  app.use(errorHandler);
  return app;
}

const cases: [string, () => never, number][] = [
  [
    "GameNotFoundError",
    () => {
      throw new GameNotFoundError();
    },
    404,
  ],
  [
    "GameExpiredError",
    () => {
      throw new GameExpiredError();
    },
    404,
  ],
  [
    "WrongPasswordError",
    () => {
      throw new WrongPasswordError();
    },
    403,
  ],
  [
    "MissingPasswordError",
    () => {
      throw new MissingPasswordError();
    },
    400,
  ],
  [
    "MissingNameError",
    () => {
      throw new MissingNameError();
    },
    400,
  ],
  [
    "MissingStatementError",
    () => {
      throw new MissingStatementError();
    },
    400,
  ],
  [
    "BadTokenError",
    () => {
      throw new BadTokenError();
    },
    403,
  ],
  [
    "WrongStatusError",
    () => {
      throw new WrongStatusError("Wrong phase");
    },
    409,
  ],
  [
    "AlreadyVotedError",
    () => {
      throw new AlreadyVotedError();
    },
    409,
  ],
  [
    "AlreadySubmittedError",
    () => {
      throw new AlreadySubmittedError();
    },
    409,
  ],
  [
    "NotEnoughPlayersError",
    () => {
      throw new NotEnoughPlayersError();
    },
    422,
  ],
];

describe("error handler middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const [name, thrower, expectedStatus] of cases) {
    it(`maps ${name} to HTTP ${expectedStatus}`, async () => {
      const res = await request(makeApp(thrower)).get("/test");
      expect(res.status).toBe(expectedStatus);
      expect(typeof res.body.error).toBe("string");
    });
  }

  it("passes through a non-game error carrying a 4xx status", async () => {
    const res = await request(
      makeApp(() => {
        throw Object.assign(new Error("Malformed body"), { status: 400 });
      }),
    ).get("/test");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Malformed body");
  });

  it("maps unknown errors to 500 and logs them", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(
      makeApp(() => {
        throw new Error("boom");
      }),
    ).get("/test");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal server error");
    expect(consoleError).toHaveBeenCalledOnce();
  });
});
