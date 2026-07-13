import { useEffect, useState } from "react";
import type { GameView } from "@resumatch/shared";

const POLL_INTERVAL_MS = 2000;

type GameStateResult = {
  state: GameView | null;
  loading: boolean;
  error: string | null;
};

// Polls the game state every 2 seconds and returns the latest GameView. A 404
// (game expired or never existed) and a FINISHED view are both terminal — the
// state can never change again — so polling stops. Other failures are treated
// as transient and polling continues so a brief network blip recovers on its
// own.
export function useGameState(gameId: string, playerId?: string): GameStateResult {
  const [state, setState] = useState<GameView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const query = playerId ? `?playerId=${encodeURIComponent(playerId)}` : "";
        const res = await fetch(`/api/games/${gameId}/state${query}`);
        if (!active) return;

        if (res.status === 404) {
          setError("This game has expired or no longer exists.");
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
  }, [gameId, playerId]);

  return { state, loading, error };
}
