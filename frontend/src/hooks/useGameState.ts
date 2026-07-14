import { useEffect, useState } from "react";
import type { GameView } from "@resumatch/shared";
import { HOST_TOKEN_HEADER, PLAYER_TOKEN_HEADER } from "../lib/api";
import type { GameSession } from "./useGameSession";

const POLL_INTERVAL_MS = 2000;

type GameStateResult = {
  state: GameView | null;
  loading: boolean;
  error: string | null;
};

// A poll response that ends polling for good: the message to surface, keyed
// by the HTTP status that produces it. Neither condition can resolve itself
// by retrying, so a status landing here short-circuits the transient-failure
// path below. A future terminal status (e.g. a 410 for an archived game)
// only needs an entry here, not a new copy of the early-return block.
const TERMINAL_STATUS_MESSAGES: Record<number, string> = {
  404: "This game has expired or no longer exists.",
  403: "You don't have access to this game.",
};

// Polls the game state every 2 seconds and returns the latest GameView. A 404
// (game expired or never existed), a 403 (wrong or missing credentials), and a
// FINISHED view are all terminal — retrying cannot change any of them — so
// polling stops. Other failures are treated as transient and polling
// continues so a brief network blip recovers on its own.
//
// The FINISHED reveal is gated server-side by role, so callers that poll past
// the end of the game must pass their session to keep reading state once it
// flips to FINISHED — a stale or missing session surfaces as the terminal 403
// message above rather than retrying forever.
export function useGameState(
  gameId: string,
  playerId?: string,
  session?: GameSession | null,
): GameStateResult {
  const [state, setState] = useState<GameView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hostToken = session?.role === "host" ? session.hostToken : undefined;
  const playerToken = session?.role === "player" ? session.playerToken : undefined;

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const query = playerId ? `?playerId=${encodeURIComponent(playerId)}` : "";
        const headers: HeadersInit = {};
        if (hostToken) headers[HOST_TOKEN_HEADER] = hostToken;
        if (playerToken) headers[PLAYER_TOKEN_HEADER] = playerToken;
        const res = await fetch(`/api/games/${gameId}/state${query}`, { headers });
        if (!active) return;

        const terminalMessage = TERMINAL_STATUS_MESSAGES[res.status];
        if (terminalMessage) {
          setError(terminalMessage);
          setLoading(false);
          return; // terminal — do not schedule another poll
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
