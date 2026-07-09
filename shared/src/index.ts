export type GameStatus = "LOBBY" | "ACTIVE" | "FINISHED";

export type Verdict = "Distinctive" | "Generic";

export type LobbyPlayer = {
  id: string;
  name: string;
  hasSubmitted: boolean;
};

export type Candidate = {
  id: string;
  name: string;
};

export type ResultEntry = {
  playerId: string;
  name: string;
  statement: string;
  correctVotes: number;
  totalVotes: number;
  verdict: Verdict;
};

export type LobbyView = {
  status: "LOBBY";
  gameId: string;
  players: LobbyPlayer[];
};

export type ActiveView = {
  status: "ACTIVE";
  gameId: string;
  currentStatement: string;
  currentStatementIndex: number;
  totalStatements: number;
  candidates: Candidate[];
  hasVoted: boolean;
  // Voting progress for the current statement, so the Host knows when the
  // room is ready. Every player can vote (the statement's author casts a
  // decoy vote), so totalPlayers is the denominator.
  votesIn: number;
  totalPlayers: number;
};

export type FinishedView = {
  status: "FINISHED";
  gameId: string;
  results: ResultEntry[];
};

export type GameView = LobbyView | ActiveView | FinishedView;

// ── API request body types ──────────────────────────────────────────────────

export type CreateGameBody = {
  password: string;
};

export type JoinGameBody = {
  password: string;
  playerName: string;
};

export type SubmitStatementBody = {
  statement: string;
};

export type CastVoteBody = {
  nomineeId: string;
};
