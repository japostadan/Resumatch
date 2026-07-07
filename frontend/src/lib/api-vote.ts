export interface Candidate {
  id: string;
  name: string;
}

export interface GameState {
  status: "LOBBY" | "ACTIVE" | "FINISHED";
  gameId: string;
  currentStatement?: string;
  currentStatementIndex?: number;
  totalStatements?: number;
  candidates?: Candidate[];
  hasVoted?: boolean;
  players?: { id: string; name: string; hasSubmitted?: boolean }[];
  results?: {
    playerId: string;
    name: string;
    statement: string;
    correctVotes: number;
    totalVotes: number;
    verdict: string;
  }[];
}

export interface VoteResponse {
  ok: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getPlayerToken(): string {
  return localStorage.getItem("playerToken") || "";
}

export async function fetchGameState(gameId: string, playerId: string): Promise<GameState> {
  const response = await fetch(
    `${API_BASE}/api/games/${gameId}/state?playerId=${encodeURIComponent(playerId)}`,
    {
      headers: {
        "X-Player-Token": getPlayerToken(),
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function castVote(gameId: string, nomineeId: string): Promise<VoteResponse> {
  const response = await fetch(`${API_BASE}/api/games/${gameId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Player-Token": getPlayerToken(),
    },
    body: JSON.stringify({ nomineeId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}
