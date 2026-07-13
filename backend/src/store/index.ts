import { randomUUID } from "node:crypto";
import type { GameView, LobbyPlayer, Candidate, ResultEntry } from "@resumatch/shared";
import {
  GameNotFoundError,
  GameExpiredError,
  WrongPasswordError,
  MissingPasswordError,
  MissingNameError,
  MissingStatementError,
  MissingNomineeError,
  WrongStatusError,
  BadTokenError,
  AlreadySubmittedError,
  AlreadyVotedError,
  NotEnoughPlayersError,
} from "../errors/index.js";

type Player = {
  id: string;
  name: string;
  token: string;
  statement?: string;
};

type Game = {
  id: string;
  password: string;
  hostToken: string;
  status: "LOBBY" | "ACTIVE" | "FINISHED";
  players: Player[];
  createdAt: number;
  statementOrder: string[];
  currentStatementIndex: number;
  votes: Map<string, string>[];
};

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Pure helpers that operate on a Game and hold no store state. Kept as
// free functions so they stay independently testable and the GameStore
// class carries only the state-owning operations.
function isExpired(game: Game): boolean {
  return Date.now() - game.createdAt > TWENTY_FOUR_HOURS_MS;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function playerById(game: Game, id: string): Player | undefined {
  return game.players.find((p) => p.id === id);
}

function requirePlayerByToken(game: Game, token: string): Player {
  const player = game.players.find((p) => p.token === token);
  if (!player) throw new BadTokenError();
  return player;
}

// A statement's score is its share of correct votes — the same measure the
// verdict thresholds on — so the most distinctive statements come first.
// An unvoted statement scores 0 rather than dividing by zero.
function score(entry: ResultEntry): number {
  return entry.totalVotes === 0 ? 0 : entry.correctVotes / entry.totalVotes;
}

function buildResults(game: Game): ResultEntry[] {
  const entries = game.statementOrder.map((authorId, index) => {
    const author = playerById(game, authorId)!;
    const votes = game.votes[index];
    // The author's vote on their own statement is a decoy: it keeps them
    // indistinguishable from the other voters but is wrong by construction
    // (self-nominees are rejected), so it is excluded from the tally (#56).
    let totalVotes = 0;
    let correctVotes = 0;
    for (const [voterId, nomineeId] of votes) {
      if (voterId === authorId) continue;
      totalVotes++;
      if (nomineeId === authorId) correctVotes++;
    }
    const verdict = totalVotes > 0 && correctVotes * 2 >= totalVotes ? "Distinctive" : "Generic";
    return {
      playerId: author.id,
      name: author.name,
      statement: author.statement!,
      correctVotes,
      totalVotes,
      verdict,
    };
  });
  return entries.sort((a, b) => score(b) - score(a));
}

// The single owner of all Game state. Each instance holds its own set of
// games, generates tokens, validates transitions, applies TTL checks, and
// produces GameViews. Construct one per process (see createApp); tests
// construct a fresh instance so no state leaks between cases.
export class GameStore {
  private readonly games = new Map<string, Game>();

  private generateGameId(): string {
    let id: string;
    do {
      id = Math.random().toString(36).slice(2, 8);
    } while (this.games.has(id));
    return id;
  }

  private requireGame(gameId: string): Game {
    const game = this.games.get(gameId);
    if (!game) throw new GameNotFoundError();
    if (isExpired(game)) {
      this.games.delete(gameId);
      throw new GameExpiredError();
    }
    return game;
  }

  createGame(password: string): { gameId: string; hostToken: string } {
    if (typeof password !== "string" || password.trim() === "") throw new MissingPasswordError();
    const gameId = this.generateGameId();
    const hostToken = randomUUID();
    this.games.set(gameId, {
      id: gameId,
      password,
      hostToken,
      status: "LOBBY",
      players: [],
      createdAt: Date.now(),
      statementOrder: [],
      currentStatementIndex: 0,
      votes: [],
    });
    return { gameId, hostToken };
  }

  joinGame(
    gameId: string,
    password: string,
    playerName: string,
  ): { playerId: string; playerToken: string } {
    if (typeof password !== "string" || password.trim() === "") throw new MissingPasswordError();
    if (typeof playerName !== "string" || playerName.trim() === "") throw new MissingNameError();

    const game = this.requireGame(gameId);
    if (game.password !== password) throw new WrongPasswordError();
    if (game.status === "ACTIVE") throw new WrongStatusError("Game has already started");
    if (game.status === "FINISHED") throw new WrongStatusError("Game has already finished");

    const playerId = randomUUID();
    const playerToken = randomUUID();
    game.players.push({ id: playerId, name: playerName, token: playerToken });
    return { playerId, playerToken };
  }

  submitStatement(gameId: string, playerToken: string, statement: string): void {
    if (typeof statement !== "string" || statement.trim() === "") throw new MissingStatementError();
    const game = this.requireGame(gameId);
    if (game.status === "ACTIVE") throw new WrongStatusError("Game has already started");
    if (game.status === "FINISHED") throw new WrongStatusError("Game has already finished");
    const player = requirePlayerByToken(game, playerToken);
    if (player.statement !== undefined) throw new AlreadySubmittedError();
    player.statement = statement;
  }

  startGame(gameId: string, hostToken: string): void {
    const game = this.requireGame(gameId);
    if (game.hostToken !== hostToken) throw new BadTokenError();
    const submitters = game.players.filter((p) => p.statement !== undefined);
    if (submitters.length < 2) throw new NotEnoughPlayersError();
    game.statementOrder = shuffle(submitters.map((p) => p.id));
    game.currentStatementIndex = 0;
    game.votes = game.statementOrder.map(() => new Map<string, string>());
    game.status = "ACTIVE";
  }

  castVote(gameId: string, playerToken: string, nomineeId: string): void {
    if (typeof nomineeId !== "string" || nomineeId.trim() === "") throw new MissingNomineeError();
    const game = this.requireGame(gameId);
    if (game.status !== "ACTIVE") throw new WrongStatusError("Voting is not open");
    const voter = requirePlayerByToken(game, playerToken);
    const currentVotes = game.votes[game.currentStatementIndex];
    if (currentVotes.has(voter.id)) throw new AlreadyVotedError();
    if (nomineeId === voter.id || !game.statementOrder.includes(nomineeId)) {
      throw new WrongStatusError("Nominee is not a valid candidate");
    }
    currentVotes.set(voter.id, nomineeId);
  }

  advanceStatement(gameId: string, hostToken: string): void {
    const game = this.requireGame(gameId);
    if (game.hostToken !== hostToken) throw new BadTokenError();
    if (game.status !== "ACTIVE") throw new WrongStatusError("Game is not in progress");
    game.currentStatementIndex++;
    if (game.currentStatementIndex >= game.statementOrder.length) {
      game.status = "FINISHED";
    }
  }

  getState(gameId: string, playerId?: string): GameView {
    const game = this.requireGame(gameId);

    if (game.status === "LOBBY") {
      const players: LobbyPlayer[] = game.players.map((p) => ({
        id: p.id,
        name: p.name,
        hasSubmitted: p.statement !== undefined,
      }));
      return { status: "LOBBY", gameId: game.id, players };
    }

    if (game.status === "FINISHED") {
      return { status: "FINISHED", gameId: game.id, results: buildResults(game) };
    }

    const authorId = game.statementOrder[game.currentStatementIndex];
    const author = playerById(game, authorId);
    const candidates: Candidate[] = game.statementOrder
      .filter((id) => id !== playerId)
      .map((id) => {
        const player = playerById(game, id)!;
        return { id: player.id, name: player.name };
      });
    const hasVoted = playerId !== undefined && game.votes[game.currentStatementIndex].has(playerId);
    return {
      status: "ACTIVE",
      gameId: game.id,
      currentStatement: author!.statement!,
      currentStatementIndex: game.currentStatementIndex,
      totalStatements: game.statementOrder.length,
      candidates,
      hasVoted,
      votesIn: game.votes[game.currentStatementIndex].size,
      totalPlayers: game.players.length,
    };
  }
}
