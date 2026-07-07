import { useState, useEffect, useCallback } from "react";
import type { GameState, Candidate } from "../lib/api-vote";
import { fetchGameState, castVote } from "../lib/api-vote";

export type VoteStatus = "idle" | "loading" | "success" | "error";

export interface UseVotingReturn {
  statement: string | null;
  candidates: Candidate[];
  hasVoted: boolean;
  isActive: boolean;
  submitVote: (nomineeId: string) => Promise<void>;
  voteStatus: VoteStatus;
  voteError: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useVoting(gameId: string, playerId: string): UseVotingReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>("idle");
  const [voteError, setVoteError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadState() {
      setIsLoading(true);
      setError(null);

      try {
        const state = await fetchGameState(gameId, playerId);
        if (!cancelled) {
          setGameState(state);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load game state");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadState();

    return () => {
      cancelled = true;
    };
  }, [gameId, playerId, refreshKey]);

  const submitVote = useCallback(
    async (nomineeId: string) => {
      setVoteStatus("loading");
      setVoteError(null);

      try {
        await castVote(gameId, nomineeId);
        setVoteStatus("success");
        setRefreshKey((k) => k + 1);
      } catch (err: any) {
        setVoteStatus("error");
        setVoteError(err.message || "Failed to cast vote");
      }
    },
    [gameId],
  );

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const isActive = gameState?.status === "ACTIVE";
  const statement = gameState?.currentStatement || null;
  const candidates = gameState?.candidates || [];
  const hasVoted = gameState?.hasVoted || false;

  return {
    statement,
    candidates,
    hasVoted,
    isActive,
    submitVote,
    voteStatus,
    voteError,
    isLoading,
    error,
    refresh,
  };
}
