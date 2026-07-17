import { useState, type FormEvent } from "react";
import { Button } from "../common/Button";
import { castVote } from "../../lib/api";
import { useGameState } from "../../hooks/useGameState";
import { useResultsRedirect } from "../../hooks/useResultsRedirect";
import { playerHash } from "../../hooks/useGameSession";
import { StatusGate } from "../common/StatusGate";
import { Shell } from "../common/Shell";
import { Eyebrow } from "../common/Eyebrow";
import { Heading } from "../common/Heading";
import { Muted } from "../common/Muted";
import { Alert } from "../common/Alert";
import { StatementCard } from "../common/StatementCard";

type PlayerVoteViewProps = {
  gameId: string;
  playerId: string;
  playerToken: string;
};

// The Player's ballot for the current statement. The polled game state drives
// what is shown: the ballot while the vote is open, the confirmation once this
// player has voted, and a waiting message outside the ACTIVE phase. `votedIndex`
// bridges the gap between a successful vote and the next poll reporting
// hasVoted, and resets naturally when the Host advances to the next statement.
export function PlayerVoteView({ gameId, playerId, playerToken }: PlayerVoteViewProps) {
  const { state, loading, error } = useGameState(gameId, playerId, {
    role: "player",
    playerId,
    playerToken,
  });
  const [nomineeId, setNomineeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [votedIndex, setVotedIndex] = useState<number | null>(null);

  useResultsRedirect(gameId, state?.status === "FINISHED", playerHash(playerToken, playerId));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (nomineeId === "" || state?.status !== "ACTIVE") return;
    setVoteError(null);
    setSubmitting(true);
    try {
      await castVote(gameId, playerToken, nomineeId);
      setVotedIndex(state.currentStatementIndex);
      setNomineeId("");
    } catch (err) {
      setVoteError(
        err instanceof Error ? err.message : "Could not submit your vote. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StatusGate
      state={state}
      loading={loading}
      error={error}
      targetStatus="ACTIVE"
      wrapper={(props) => <Shell wide {...props} />}
      loadingEyebrow="Voting round"
      loadingHeading="Setting up the round"
      loadingBody="Loading the round…"
      pendingEyebrow="Voting round"
      pendingHeading="Hang tight"
      pendingBody={(notYet) =>
        notYet.status === "LOBBY"
          ? "Waiting for the voting round to begin — keep this tab open."
          : "The game has finished. Results are on their way."
      }
    >
      {(active) => {
        const hasVoted = active.hasVoted || votedIndex === active.currentStatementIndex;

        if (hasVoted) {
          return (
            <Shell wide>
              <Eyebrow>Vote in</Eyebrow>
              <Heading>Your guess is locked</Heading>
              {error && <Alert>{error}</Alert>}
              <Muted>
                Waiting for the host to move to the next statement — keep this tab open.
              </Muted>
            </Shell>
          );
        }

        return (
          <Shell wide>
            <Eyebrow>
              Statement {active.currentStatementIndex + 1} of {active.totalStatements}
            </Eyebrow>
            <Heading>Who wrote this?</Heading>
            {error && <Alert>{error}</Alert>}
            <StatementCard>&ldquo;{active.currentStatement}&rdquo;</StatementCard>

            <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
              <fieldset
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                disabled={submitting}
              >
                <legend className="col-span-full mb-3 text-sm font-bold tracking-wide text-ink">
                  Select who you think wrote it —{" "}
                  {active.candidates.length === 1
                    ? "1 person"
                    : `${active.candidates.length} people`}
                </legend>
                {active.candidates.map((candidate) => (
                  <label
                    key={candidate.id}
                    className="flex items-center gap-3 border-2 border-line bg-surface px-4 py-3"
                  >
                    <input
                      type="radio"
                      name="nomineeId"
                      value={candidate.id}
                      checked={nomineeId === candidate.id}
                      onChange={() => setNomineeId(candidate.id)}
                      className="size-4 accent-violet"
                    />
                    <span className="text-lg font-bold text-ink">{candidate.name}</span>
                  </label>
                ))}
              </fieldset>

              {voteError && <Alert>{voteError}</Alert>}

              {/* Sticky so the action stays visible while a long candidate list
                  scrolls behind it — the movement doubles as the scroll cue. */}
              <div className="sticky bottom-0 bg-canvas pt-2 pb-4">
                <Button type="submit" disabled={nomineeId === "" || submitting} className="w-full">
                  {submitting ? "Submitting…" : "Submit vote"}
                </Button>
              </div>
            </form>
          </Shell>
        );
      }}
    </StatusGate>
  );
}
