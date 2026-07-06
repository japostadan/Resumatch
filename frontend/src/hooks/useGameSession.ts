import { useState } from "react";

// The session lives in the URL hash fragment so a reload keeps it without a
// database or cookies. Role-named keys make the role explicit: a Host carries
// `hostToken`, a Player carries `playerToken` + `playerId`. The Lobby reads the
// session back to decide which view to render; the names match the
// X-Host-Token / X-Player-Token headers these credentials feed.
export type GameSession =
  { role: "host"; hostToken: string } | { role: "player"; playerToken: string; playerId: string };

export function hostHash(hostToken: string): string {
  return `hostToken=${hostToken}`;
}

export function playerHash(playerToken: string, playerId: string): string {
  return `playerToken=${playerToken}&playerId=${playerId}`;
}

function readSession(): GameSession | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  const hostToken = params.get("hostToken");
  if (hostToken) return { role: "host", hostToken };

  const playerToken = params.get("playerToken");
  const playerId = params.get("playerId");
  if (playerToken && playerId) return { role: "player", playerToken, playerId };

  return null;
}

export function useGameSession() {
  const [session, setSession] = useState<GameSession | null>(readSession);

  function setHostSession(hostToken: string) {
    window.location.hash = hostHash(hostToken);
    setSession({ role: "host", hostToken });
  }

  return { session, setHostSession };
}
