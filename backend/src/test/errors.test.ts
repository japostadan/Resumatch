import { describe, it, expect } from "vitest";
import request from "supertest";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  GameNotFoundError,
  GameExpiredError,
  WrongPasswordError,
  MissingPasswordError,
  MissingNameError,
  BadTokenError,
  WrongStatusError,
  AlreadyVotedError,
  AlreadySubmittedError,
  NotEnoughPlayersError,
  isGameError,
} from "../errors/index.js";

function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (isGameError(err)) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
}

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
  for (const [name, thrower, expectedStatus] of cases) {
    it(`maps ${name} to HTTP ${expectedStatus}`, async () => {
      const res = await request(makeApp(thrower)).get("/test");
      expect(res.status).toBe(expectedStatus);
      expect(typeof res.body.error).toBe("string");
    });
  }

  it("maps unknown errors to 500", async () => {
    const app = makeApp(() => {
      throw new Error("boom");
    });
    const res = await request(app).get("/test");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal server error");
  });
});
