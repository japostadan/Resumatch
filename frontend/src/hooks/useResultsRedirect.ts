import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

// When the polled game state reports FINISHED, everyone moves to the results,
// carrying their session hash forward — the same handoff the Lobby does when
// the game becomes ACTIVE.
export function useResultsRedirect(gameId: string, finished: boolean, sessionHash: string) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!finished) return;
    navigate({ to: "/game/$gameId/results", params: { gameId }, hash: sessionHash });
  }, [finished, gameId, sessionHash, navigate]);
}
