import { useEffect, useState } from "react";
import type { GameView } from "@resumatch/shared";

const POLL_INTERVAL_MS = 2000;

type GameStateResult = {
  state: GameView | null;
  loading: boolean;
  error: string | null;
};

export type GameStateCredentials = {
  hostToken?: string;
  playerToken?: string;
};

// Polls the game state every 2 seconds and returns the latest GameView. A 404
// (game expired or never existed), a 403 (wrong or missing credentials), and a
// FINISHED view are all terminal — retrying cannot change any of them — so
// polling stops. Other failures are treated as transient and polling
// continues so a brief network blip recovers on its own.
//
// The FINISHED reveal is gated server-side (#80), so callers that poll past
// the end of the game must pass their Host or Player Token to keep reading
// state once it flips to FINISHED — a stale or missing credential now gets
// the terminal 403 message below instead of retrying forever.
export function useGameState(
  gameId: string,
  playerId?: string,
  credentials?: GameStateCredentials,
): GameStateResult {
  const [state, setState] = useState<GameView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hostToken = credentials?.hostToken;
  const playerToken = credentials?.playerToken;

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const query = playerId ? `?playerId=${encodeURIComponent(playerId)}` : "";
        const headers: HeadersInit = {};
        if (hostToken) headers["X-Host-Token"] = hostToken;
        if (playerToken) headers["X-Player-Token"] = playerToken;
        const res = await fetch(`/api/games/${gameId}/state${query}`, { headers });
        if (!active) return;

        if (res.status === 404) {
          setError("This game has expired or no longer exists.");
          setLoading(false);
          return; // terminal — do not schedule another poll
        }
        if (res.status === 403) {
          setError("You don't have access to this game.");
          setLoading(false);
          return; // terminal — a bad credential will never start working
        }
        if (!res.ok) {
          setError("Could not reach the game. Retrying…");
          setLoading(false);
        } else {
          const view = (await res.json()) as GameView;
          if (!active) return;
          setState(view);
          setError(null);
          setLoading(false);
          if (view.status === "FINISHED") return; // terminal — do not schedule another poll
        }
      } catch {
        if (active) {
          setError("Could not reach the game. Retrying…");
          setLoading(false);
        }
      }

      if (active) timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [gameId, playerId, hostToken, playerToken]);

  return { state, loading, error };
}
