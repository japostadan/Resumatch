import { useState, type FormEvent } from "react";
import { Button } from "../common/Button";
import { castVote } from "../../lib/api";
import { useGameState } from "../../hooks/useGameState";
import { useResultsRedirect } from "../../hooks/useResultsRedirect";
import { playerHash } from "../../hooks/useGameSession";

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
  const { state, loading, error } = useGameState(gameId, playerId);
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

  if (state === null) {
    return (
      <Shell>
        <Eyebrow>Voting round</Eyebrow>
        <Heading>Setting up the round</Heading>
        {error ? <Alert>{error}</Alert> : loading && <Muted>Loading the round…</Muted>}
      </Shell>
    );
  }

  if (state.status !== "ACTIVE") {
    return (
      <Shell>
        <Eyebrow>Voting round</Eyebrow>
        <Heading>Hang tight</Heading>
        {error && <Alert>{error}</Alert>}
        <Muted>
          {state.status === "LOBBY"
            ? "Waiting for the voting round to begin — keep this tab open."
            : "The game has finished. Results are on their way."}
        </Muted>
      </Shell>
    );
  }

  const hasVoted = state.hasVoted || votedIndex === state.currentStatementIndex;

  if (hasVoted) {
    return (
      <Shell>
        <Eyebrow>Vote in</Eyebrow>
        <Heading>Your guess is locked</Heading>
        {error && <Alert>{error}</Alert>}
        <Muted>Waiting for the host to move to the next statement — keep this tab open.</Muted>
      </Shell>
    );
  }

  return (
    <Shell>
      <Eyebrow>
        Statement {state.currentStatementIndex + 1} of {state.totalStatements}
      </Eyebrow>
      <Heading>Who wrote this?</Heading>
      {error && <Alert>{error}</Alert>}
      <blockquote className="mt-6 border-2 border-line bg-surface px-5 py-4 text-lg font-medium text-ink">
        &ldquo;{state.currentStatement}&rdquo;
      </blockquote>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
        <fieldset className="flex flex-col gap-3" disabled={submitting}>
          <legend className="mb-3 text-sm font-bold tracking-wide text-ink">
            Select who you think wrote it —{" "}
            {state.candidates.length === 1 ? "1 person" : `${state.candidates.length} people`}
          </legend>
          {state.candidates.map((candidate) => (
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
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">{children}</p>;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h1 className="mt-4 font-display text-4xl font-black tracking-tight">{children}</h1>;
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">{children}</p>;
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-5 text-sm font-bold text-generic">
      {children}
    </p>
  );
}
