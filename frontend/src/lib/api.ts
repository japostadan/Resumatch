export type CreatedGame = {
  gameId: string;
  hostToken: string;
};

export type JoinedGame = {
  playerId: string;
  playerToken: string;
};

// Requests go to the relative /api path; the Vite dev server proxies it to the
// backend (see vite.config.ts), and the deployed site does the same.
export async function createGame(password: string): Promise<CreatedGame> {
  const res = await fetch("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Could not create the game. Please try again.");
  }
  return res.json();
}

export async function joinGame(
  gameId: string,
  password: string,
  playerName: string,
): Promise<JoinedGame> {
  const res = await fetch(`/api/games/${gameId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Could not join the game. Please try again.");
  }
  return res.json();
}

// The player token authenticates the submission via the X-Player-Token header
// rather than the body, matching the backend route (POST /api/games/:id/statement).
export async function submitStatement(
  gameId: string,
  playerToken: string,
  statement: string,
): Promise<void> {
  const res = await fetch(`/api/games/${gameId}/statement`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Player-Token": playerToken },
    body: JSON.stringify({ statement }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Could not submit your statement. Please try again.");
  }
}

// The player token authenticates the vote via the X-Player-Token header,
// matching the backend route (POST /api/games/:id/vote).
export async function castVote(
  gameId: string,
  playerToken: string,
  nomineeId: string,
): Promise<void> {
  const res = await fetch(`/api/games/${gameId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Player-Token": playerToken },
    body: JSON.stringify({ nomineeId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Could not submit your vote. Please try again.");
  }
}

// The host token authenticates the start via the X-Host-Token header, matching
// the backend route (POST /api/games/:id/start). No request body is needed.
export async function startGame(gameId: string, hostToken: string): Promise<void> {
  const res = await fetch(`/api/games/${gameId}/start`, {
    method: "POST",
    headers: { "X-Host-Token": hostToken },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Could not start the game. Please try again.");
  }
}
