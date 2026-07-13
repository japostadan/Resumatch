import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GameStore } from "../store/index.js";
import {
  GameNotFoundError,
  GameExpiredError,
  WrongPasswordError,
  WrongStatusError,
  BadTokenError,
  AlreadySubmittedError,
  AlreadyVotedError,
  NotEnoughPlayersError,
  MissingPasswordError,
  MissingNameError,
  MissingStatementError,
} from "../errors/index.js";

let store: GameStore;

// A started 2-player game (Ada and Bea, both submitted), ready for voting.
function startedGame() {
  const { gameId, hostToken } = store.createGame("secret");
  const ada = store.joinGame(gameId, "secret", "Ada");
  const bea = store.joinGame(gameId, "secret", "Bea");
  store.submitStatement(gameId, ada.playerToken, "ada statement");
  store.submitStatement(gameId, bea.playerToken, "bea statement");
  store.startGame(gameId, hostToken);
  return { gameId, hostToken, ada, bea };
}

// A started 3-player game; statement text is `${name} statement` so tests
// can map the anonymous currentStatement back to its author.
function threePlayerGame() {
  const { gameId, hostToken } = store.createGame("secret");
  const players = ["Ada", "Bea", "Cy"].map((name) => ({
    name,
    ...store.joinGame(gameId, "secret", name),
  }));
  players.forEach((p) => store.submitStatement(gameId, p.playerToken, `${p.name} statement`));
  store.startGame(gameId, hostToken);
  return { gameId, hostToken, players };
}

type StartedPlayer = { name: string; playerId: string; playerToken: string };

// Author of whichever statement is currently displayed.
function currentAuthor(gameId: string, players: StartedPlayer[]): StartedPlayer {
  const view = store.getState(gameId);
  if (view.status !== "ACTIVE") throw new Error("expected ACTIVE");
  const author = players.find((p) => `${p.name} statement` === view.currentStatement);
  if (!author) throw new Error("no author for current statement");
  return author;
}

beforeEach(() => {
  store = new GameStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createGame", () => {
  it("creates a game and returns a Game ID and Host Token", () => {
    const { gameId, hostToken } = store.createGame("secret");

    expect(gameId).toBeTruthy();
    expect(hostToken).toBeTruthy();
    expect(gameId).not.toBe(hostToken);
  });

  it("produces a LobbyView with no players for a freshly created game", () => {
    const { gameId } = store.createGame("secret");

    const view = store.getState(gameId);

    expect(view).toEqual({ status: "LOBBY", gameId, players: [] });
  });

  it("generates a short alphanumeric Game ID", () => {
    const { gameId } = store.createGame("secret");

    expect(gameId).toMatch(/^[a-z0-9]+$/);
    expect(gameId.length).toBeLessThanOrEqual(6);
  });

  it("rejects an empty password", () => {
    expect(() => store.createGame("")).toThrow(MissingPasswordError);
  });

  it("rejects a whitespace-only password", () => {
    expect(() => store.createGame("   ")).toThrow(MissingPasswordError);
  });

  it("rejects a non-string password", () => {
    expect(() => store.createGame(123 as unknown as string)).toThrow(MissingPasswordError);
  });
});

describe("joinGame", () => {
  it("adds a player with the correct password and lists them as not yet submitted", () => {
    const { gameId } = store.createGame("secret");

    const { playerId, playerToken } = store.joinGame(gameId, "secret", "Ada");

    expect(playerId).toBeTruthy();
    expect(playerToken).toBeTruthy();

    const view = store.getState(gameId);
    expect(view.status).toBe("LOBBY");
    if (view.status !== "LOBBY") throw new Error("expected LOBBY");
    expect(view.players).toEqual([{ id: playerId, name: "Ada", hasSubmitted: false }]);
  });

  it("rejects a wrong password", () => {
    const { gameId } = store.createGame("secret");

    expect(() => store.joinGame(gameId, "wrong", "Ada")).toThrow(WrongPasswordError);
  });

  it("rejects a missing password", () => {
    const { gameId } = store.createGame("secret");

    expect(() => store.joinGame(gameId, "", "Ada")).toThrow(MissingPasswordError);
  });

  it("rejects a missing player name", () => {
    const { gameId } = store.createGame("secret");

    expect(() => store.joinGame(gameId, "secret", "   ")).toThrow(MissingNameError);
  });

  it("rejects an unknown game", () => {
    expect(() => store.joinGame("nope", "secret", "Ada")).toThrow(GameNotFoundError);
  });

  it("rejects joining once the game has finished", () => {
    const { gameId, hostToken } = store.createGame("secret");
    const ada = store.joinGame(gameId, "secret", "Ada");
    const bea = store.joinGame(gameId, "secret", "Bea");
    store.submitStatement(gameId, ada.playerToken, "a");
    store.submitStatement(gameId, bea.playerToken, "b");
    store.startGame(gameId, hostToken);
    store.advanceStatement(gameId, hostToken);
    store.advanceStatement(gameId, hostToken);

    const view = store.getState(gameId);
    if (view.status !== "FINISHED") throw new Error("expected FINISHED");
    expect(() => store.joinGame(gameId, "secret", "Cy")).toThrow(WrongStatusError);
  });
});

describe("submitStatement", () => {
  it("marks the player as submitted", () => {
    const { gameId } = store.createGame("secret");
    const { playerId, playerToken } = store.joinGame(gameId, "secret", "Ada");

    store.submitStatement(gameId, playerToken, "my statement");

    const view = store.getState(gameId);
    if (view.status !== "LOBBY") throw new Error("expected LOBBY");
    expect(view.players).toContainEqual({ id: playerId, name: "Ada", hasSubmitted: true });
  });

  it("rejects an empty statement", () => {
    const { gameId } = store.createGame("secret");
    const { playerToken } = store.joinGame(gameId, "secret", "Ada");

    expect(() => store.submitStatement(gameId, playerToken, "   ")).toThrow(MissingStatementError);
  });

  it("rejects an empty statement before checking the token", () => {
    const { gameId } = store.createGame("secret");
    store.joinGame(gameId, "secret", "Ada");

    expect(() => store.submitStatement(gameId, "not-a-token", "")).toThrow(MissingStatementError);
  });

  it("rejects an unknown token", () => {
    const { gameId } = store.createGame("secret");
    store.joinGame(gameId, "secret", "Ada");

    expect(() => store.submitStatement(gameId, "not-a-token", "x")).toThrow(BadTokenError);
  });

  it("rejects a second submission from the same player", () => {
    const { gameId } = store.createGame("secret");
    const { playerToken } = store.joinGame(gameId, "secret", "Ada");
    store.submitStatement(gameId, playerToken, "first");

    expect(() => store.submitStatement(gameId, playerToken, "second")).toThrow(
      AlreadySubmittedError,
    );
  });

  it("rejects a submission after the game has started", () => {
    const { gameId, hostToken } = store.createGame("secret");
    const ada = store.joinGame(gameId, "secret", "Ada");
    const bea = store.joinGame(gameId, "secret", "Bea");
    const cy = store.joinGame(gameId, "secret", "Cy");
    store.submitStatement(gameId, ada.playerToken, "ada statement");
    store.submitStatement(gameId, bea.playerToken, "bea statement");
    store.startGame(gameId, hostToken);

    expect(() => store.submitStatement(gameId, cy.playerToken, "too late")).toThrow(
      WrongStatusError,
    );
  });

  it("rejects a submission after the game has finished", () => {
    const { gameId, hostToken } = store.createGame("secret");
    const ada = store.joinGame(gameId, "secret", "Ada");
    const bea = store.joinGame(gameId, "secret", "Bea");
    const cy = store.joinGame(gameId, "secret", "Cy");
    store.submitStatement(gameId, ada.playerToken, "ada statement");
    store.submitStatement(gameId, bea.playerToken, "bea statement");
    store.startGame(gameId, hostToken);
    store.advanceStatement(gameId, hostToken);
    store.advanceStatement(gameId, hostToken);

    expect(() => store.submitStatement(gameId, cy.playerToken, "too late")).toThrow(
      WrongStatusError,
    );
  });
});

describe("startGame", () => {
  it("transitions to ACTIVE and shows the first statement to the host", () => {
    const { gameId, hostToken } = store.createGame("secret");
    const ada = store.joinGame(gameId, "secret", "Ada");
    const bea = store.joinGame(gameId, "secret", "Bea");
    store.submitStatement(gameId, ada.playerToken, "ada statement");
    store.submitStatement(gameId, bea.playerToken, "bea statement");

    store.startGame(gameId, hostToken);

    const view = store.getState(gameId);
    if (view.status !== "ACTIVE") throw new Error("expected ACTIVE");
    expect(view.currentStatementIndex).toBe(0);
    expect(view.totalStatements).toBe(2);
    expect(["ada statement", "bea statement"]).toContain(view.currentStatement);
    expect(view.hasVoted).toBe(false);
    expect(view.candidates).toHaveLength(2);
    expect(view.candidates.map((c) => c.name).toSorted()).toEqual(["Ada", "Bea"]);
  });

  it("excludes players who did not submit a statement", () => {
    const { gameId, hostToken } = store.createGame("secret");
    const ada = store.joinGame(gameId, "secret", "Ada");
    const bea = store.joinGame(gameId, "secret", "Bea");
    store.joinGame(gameId, "secret", "Cy"); // never submits
    store.submitStatement(gameId, ada.playerToken, "ada statement");
    store.submitStatement(gameId, bea.playerToken, "bea statement");

    store.startGame(gameId, hostToken);

    const view = store.getState(gameId);
    if (view.status !== "ACTIVE") throw new Error("expected ACTIVE");
    expect(view.totalStatements).toBe(2);
    expect(view.candidates.map((c) => c.name).toSorted()).toEqual(["Ada", "Bea"]);
  });

  it("rejects a wrong host token", () => {
    const { gameId } = store.createGame("secret");
    const ada = store.joinGame(gameId, "secret", "Ada");
    const bea = store.joinGame(gameId, "secret", "Bea");
    store.submitStatement(gameId, ada.playerToken, "a");
    store.submitStatement(gameId, bea.playerToken, "b");

    expect(() => store.startGame(gameId, "not-the-host")).toThrow(BadTokenError);
  });

  it("requires at least two submitted statements", () => {
    const { gameId, hostToken } = store.createGame("secret");
    const ada = store.joinGame(gameId, "secret", "Ada");
    store.joinGame(gameId, "secret", "Bea");
    store.submitStatement(gameId, ada.playerToken, "only one");

    expect(() => store.startGame(gameId, hostToken)).toThrow(NotEnoughPlayersError);
  });

  it("excludes the requesting player from their own candidate list", () => {
    const { gameId, hostToken } = store.createGame("secret");
    const ada = store.joinGame(gameId, "secret", "Ada");
    const bea = store.joinGame(gameId, "secret", "Bea");
    store.submitStatement(gameId, ada.playerToken, "ada statement");
    store.submitStatement(gameId, bea.playerToken, "bea statement");
    store.startGame(gameId, hostToken);

    const view = store.getState(gameId, ada.playerId);
    if (view.status !== "ACTIVE") throw new Error("expected ACTIVE");
    expect(view.candidates.map((c) => c.name)).toEqual(["Bea"]);
  });

  it("rejects joining once the game has started", () => {
    const { gameId, hostToken } = store.createGame("secret");
    const ada = store.joinGame(gameId, "secret", "Ada");
    const bea = store.joinGame(gameId, "secret", "Bea");
    store.submitStatement(gameId, ada.playerToken, "a");
    store.submitStatement(gameId, bea.playerToken, "b");
    store.startGame(gameId, hostToken);

    expect(() => store.joinGame(gameId, "secret", "Cy")).toThrow(WrongStatusError);
  });
});

describe("castVote", () => {
  it("records a vote and marks the voter as having voted", () => {
    const { gameId, ada, bea } = startedGame();

    store.castVote(gameId, ada.playerToken, bea.playerId);

    const view = store.getState(gameId, ada.playerId);
    if (view.status !== "ACTIVE") throw new Error("expected ACTIVE");
    expect(view.hasVoted).toBe(true);
  });

  it("rejects a second vote on the same statement", () => {
    const { gameId, ada, bea } = startedGame();
    store.castVote(gameId, ada.playerToken, bea.playerId);

    expect(() => store.castVote(gameId, ada.playerToken, bea.playerId)).toThrow(AlreadyVotedError);
  });

  it("rejects a vote with an unknown token", () => {
    const { gameId, bea } = startedGame();

    expect(() => store.castVote(gameId, "not-a-token", bea.playerId)).toThrow(BadTokenError);
  });

  it("rejects a self-vote", () => {
    const { gameId, ada } = startedGame();

    expect(() => store.castVote(gameId, ada.playerToken, ada.playerId)).toThrow(WrongStatusError);
  });

  it("rejects a vote for an unknown nominee", () => {
    const { gameId, ada } = startedGame();

    expect(() => store.castVote(gameId, ada.playerToken, "ghost")).toThrow(WrongStatusError);
  });

  it("rejects voting before the game has started", () => {
    const { gameId } = store.createGame("secret");
    const ada = store.joinGame(gameId, "secret", "Ada");
    const bea = store.joinGame(gameId, "secret", "Bea");

    expect(() => store.castVote(gameId, ada.playerToken, bea.playerId)).toThrow(WrongStatusError);
  });
});

describe("voting progress", () => {
  it("shows zero votes in and the full player count on a fresh statement", () => {
    const { gameId } = startedGame();

    const view = store.getState(gameId);
    if (view.status !== "ACTIVE") throw new Error("expected ACTIVE");
    expect(view.votesIn).toBe(0);
    expect(view.totalPlayers).toBe(2);
  });

  it("counts each vote cast on the current statement", () => {
    const { gameId, players } = threePlayerGame();
    const author = currentAuthor(gameId, players);
    const voters = players.filter((p) => p.playerId !== author.playerId);

    store.castVote(gameId, voters[0].playerToken, author.playerId);

    let view = store.getState(gameId);
    if (view.status !== "ACTIVE") throw new Error("expected ACTIVE");
    expect(view.votesIn).toBe(1);
    expect(view.totalPlayers).toBe(3);

    store.castVote(gameId, voters[1].playerToken, author.playerId);

    view = store.getState(gameId);
    if (view.status !== "ACTIVE") throw new Error("expected ACTIVE");
    expect(view.votesIn).toBe(2);
  });

  it("resets the votes-in count when the host advances", () => {
    const { gameId, hostToken, players } = threePlayerGame();
    const author = currentAuthor(gameId, players);
    const voter = players.find((p) => p.playerId !== author.playerId)!;
    store.castVote(gameId, voter.playerToken, author.playerId);

    store.advanceStatement(gameId, hostToken);

    const view = store.getState(gameId);
    if (view.status !== "ACTIVE") throw new Error("expected ACTIVE");
    expect(view.votesIn).toBe(0);
  });
});

describe("advanceStatement", () => {
  it("moves to the next statement while statements remain", () => {
    const { gameId, hostToken } = startedGame();

    store.advanceStatement(gameId, hostToken);

    const view = store.getState(gameId);
    if (view.status !== "ACTIVE") throw new Error("expected ACTIVE");
    expect(view.currentStatementIndex).toBe(1);
  });

  it("rejects a wrong host token", () => {
    const { gameId } = startedGame();

    expect(() => store.advanceStatement(gameId, "not-the-host")).toThrow(BadTokenError);
  });

  it("finishes the game after the last statement", () => {
    const { gameId, hostToken } = startedGame();

    store.advanceStatement(gameId, hostToken); // index 0 -> 1 (last of 2)
    store.advanceStatement(gameId, hostToken); // past the last -> FINISHED

    const view = store.getState(gameId);
    expect(view.status).toBe("FINISHED");
  });

  it("rejects advancing before the game has started", () => {
    const { gameId, hostToken } = store.createGame("secret");

    expect(() => store.advanceStatement(gameId, hostToken)).toThrow(WrongStatusError);
  });
});

describe("results", () => {
  it("marks a statement Distinctive when exactly half of the voters are correct", () => {
    const { gameId, hostToken, players } = threePlayerGame();

    for (let i = 0; i < players.length; i++) {
      const author = currentAuthor(gameId, players);
      const others = players.filter((p) => p.playerId !== author.playerId);
      // one correct, one wrong → 1 of 2 = 50%
      store.castVote(gameId, others[0].playerToken, author.playerId);
      store.castVote(gameId, others[1].playerToken, others[0].playerId);
      store.advanceStatement(gameId, hostToken);
    }

    const view = store.getState(gameId);
    if (view.status !== "FINISHED") throw new Error("expected FINISHED");
    for (const entry of view.results) {
      expect(entry.totalVotes).toBe(2);
      expect(entry.correctVotes).toBe(1);
      expect(entry.verdict).toBe("Distinctive");
    }
  });

  it("excludes the author's decoy vote from their own statement's tally", () => {
    const { gameId, hostToken, players } = threePlayerGame();

    for (let i = 0; i < players.length; i++) {
      const author = currentAuthor(gameId, players);
      const others = players.filter((p) => p.playerId !== author.playerId);
      // The author bluffs (their vote is wrong by construction); of the two
      // informed voters one is correct, one wrong → 1 of 2 = Distinctive.
      // Counting the decoy would make it 1 of 3 and flip the verdict.
      store.castVote(gameId, author.playerToken, others[1].playerId);
      store.castVote(gameId, others[0].playerToken, author.playerId);
      store.castVote(gameId, others[1].playerToken, others[0].playerId);
      store.advanceStatement(gameId, hostToken);
    }

    const view = store.getState(gameId);
    if (view.status !== "FINISHED") throw new Error("expected FINISHED");
    for (const entry of view.results) {
      expect(entry.totalVotes).toBe(2);
      expect(entry.correctVotes).toBe(1);
      expect(entry.verdict).toBe("Distinctive");
    }
  });

  it("orders results by correct-vote share, most distinctive first", () => {
    const { gameId, hostToken, players } = threePlayerGame();

    // Give the statement shown i-th exactly i correct votes (0, 1, 2), so the
    // displayed order is the exact reverse of the expected score order.
    const authorsInShownOrder: StartedPlayer[] = [];
    for (let i = 0; i < players.length; i++) {
      const author = currentAuthor(gameId, players);
      authorsInShownOrder.push(author);
      const others = players.filter((p) => p.playerId !== author.playerId);
      others.forEach((voter, v) => {
        const wrongNominee = others.find((p) => p.playerId !== voter.playerId)!;
        store.castVote(gameId, voter.playerToken, v < i ? author.playerId : wrongNominee.playerId);
      });
      store.advanceStatement(gameId, hostToken);
    }

    const view = store.getState(gameId);
    if (view.status !== "FINISHED") throw new Error("expected FINISHED");
    expect(view.results.map((r) => r.correctVotes)).toEqual([2, 1, 0]);
    expect(view.results.map((r) => r.playerId)).toEqual(
      [...authorsInShownOrder].reverse().map((a) => a.playerId),
    );
  });

  it("ranks a fully-guessed statement above an equal correct count with more voters", () => {
    const { gameId, hostToken, players } = threePlayerGame();

    // Shown order: 1 of 2 correct, then 0 of 2, then 1 of 1 (one voter
    // abstains). Ranking by share puts the 1-of-1 first despite its raw
    // correct count tying the 1-of-2.
    const authorsInShownOrder: StartedPlayer[] = [];
    const correctPerRound = [1, 0, 1];
    const votersPerRound = [2, 2, 1];
    for (let i = 0; i < players.length; i++) {
      const author = currentAuthor(gameId, players);
      authorsInShownOrder.push(author);
      const others = players.filter((p) => p.playerId !== author.playerId);
      others.slice(0, votersPerRound[i]).forEach((voter, v) => {
        const wrongNominee = others.find((p) => p.playerId !== voter.playerId)!;
        store.castVote(
          gameId,
          voter.playerToken,
          v < correctPerRound[i] ? author.playerId : wrongNominee.playerId,
        );
      });
      store.advanceStatement(gameId, hostToken);
    }

    const view = store.getState(gameId);
    if (view.status !== "FINISHED") throw new Error("expected FINISHED");
    expect(view.results.map((r) => r.playerId)).toEqual(
      [authorsInShownOrder[2], authorsInShownOrder[0], authorsInShownOrder[1]].map(
        (a) => a.playerId,
      ),
    );
  });

  it("marks an unvoted statement Generic and ranks it below a voted one", () => {
    const { gameId, hostToken, ada, bea } = startedGame();

    // The first statement's voter guesses correctly (1 of 1); the host
    // advances past the second statement with no votes at all (0 of 0).
    const view0 = store.getState(gameId);
    if (view0.status !== "ACTIVE") throw new Error("expected ACTIVE");
    const firstAuthor = view0.currentStatement === "ada statement" ? ada : bea;
    const firstVoter = firstAuthor === ada ? bea : ada;
    store.castVote(gameId, firstVoter.playerToken, firstAuthor.playerId);
    store.advanceStatement(gameId, hostToken);
    store.advanceStatement(gameId, hostToken);

    const view = store.getState(gameId);
    if (view.status !== "FINISHED") throw new Error("expected FINISHED");
    expect(view.results.map((r) => r.playerId)).toEqual([
      firstAuthor.playerId,
      firstVoter.playerId,
    ]);
    expect(view.results[1]).toMatchObject({ correctVotes: 0, totalVotes: 0, verdict: "Generic" });
  });

  it("marks a statement Generic when correct votes fall just under half", () => {
    const { gameId, hostToken } = store.createGame("secret");
    const players = ["Ada", "Bea", "Cy", "Di"].map((name) => ({
      name,
      ...store.joinGame(gameId, "secret", name),
    }));
    players.forEach((p) => store.submitStatement(gameId, p.playerToken, `${p.name} statement`));
    store.startGame(gameId, hostToken);

    for (let i = 0; i < players.length; i++) {
      const author = currentAuthor(gameId, players);
      const others = players.filter((p) => p.playerId !== author.playerId);
      // one correct, two wrong → 1 of 3, just under the 50% threshold
      store.castVote(gameId, others[0].playerToken, author.playerId);
      store.castVote(gameId, others[1].playerToken, others[0].playerId);
      store.castVote(gameId, others[2].playerToken, others[0].playerId);
      store.advanceStatement(gameId, hostToken);
    }

    const view = store.getState(gameId);
    if (view.status !== "FINISHED") throw new Error("expected FINISHED");
    for (const entry of view.results) {
      expect(entry.totalVotes).toBe(3);
      expect(entry.correctVotes).toBe(1);
      expect(entry.verdict).toBe("Generic");
    }
  });

  it("marks a statement Generic when fewer than half are correct", () => {
    const { gameId, hostToken, players } = threePlayerGame();

    for (let i = 0; i < players.length; i++) {
      const author = currentAuthor(gameId, players);
      const others = players.filter((p) => p.playerId !== author.playerId);
      // both vote for each other, neither for the author → 0 of 2
      store.castVote(gameId, others[0].playerToken, others[1].playerId);
      store.castVote(gameId, others[1].playerToken, others[0].playerId);
      store.advanceStatement(gameId, hostToken);
    }

    const view = store.getState(gameId);
    if (view.status !== "FINISHED") throw new Error("expected FINISHED");
    for (const entry of view.results) {
      expect(entry.correctVotes).toBe(0);
      expect(entry.verdict).toBe("Generic");
    }
  });
});

describe("24-hour expiry", () => {
  it("reports a game older than 24 hours as expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const { gameId } = store.createGame("secret");

    vi.setSystemTime(new Date("2026-01-02T00:00:01Z")); // 24h + 1s later

    expect(() => store.getState(gameId)).toThrow(GameExpiredError);
  });

  it("deletes the expired game so it is gone afterwards", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const { gameId } = store.createGame("secret");
    vi.setSystemTime(new Date("2026-01-02T00:00:01Z"));
    expect(() => store.getState(gameId)).toThrow(GameExpiredError);

    expect(() => store.getState(gameId)).toThrow(GameNotFoundError);
  });

  it("keeps a game alive within 24 hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const { gameId } = store.createGame("secret");

    vi.setSystemTime(new Date("2026-01-01T23:59:59Z"));

    expect(store.getState(gameId).status).toBe("LOBBY");
  });
});
