import type { Candidate } from "../../lib/api-vote";
import { useVoting } from "../../hooks/useVoting";

interface PlayerVoteViewProps {
  gameId: string;
  playerId: string;
}

export function PlayerVoteView({ gameId, playerId }: PlayerVoteViewProps) {
  const {
    statement,
    candidates,
    hasVoted,
    isActive,
    submitVote,
    voteStatus,
    voteError,
    isLoading,
    error,
  } = useVoting(gameId, playerId);

  if (!isActive) {
    return (
      <div className="vote-view" data-testid="vote-view">
        <p className="phase-message">Waiting for the voting round to begin...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="vote-view" data-testid="vote-view">
        <p className="loading">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vote-view" data-testid="vote-view">
        <p className="error" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (hasVoted || voteStatus === "success") {
    return (
      <div className="vote-view" data-testid="vote-view">
        <div className="confirmation" data-testid="vote-confirmation">
          <h2>Vote Submitted!</h2>
          <p>Your guess has been recorded. Waiting for other players...</p>
          {statement && <p className="statement-reminder">Statement: &ldquo;{statement}&rdquo;</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="vote-view" data-testid="vote-view">
      <h2>Who wrote this?</h2>

      {statement && (
        <blockquote className="anonymous-statement" data-testid="anonymous-statement">
          {statement}
        </blockquote>
      )}

      <form
        className="vote-form"
        data-testid="vote-form"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          const nomineeId = formData.get("nomineeId") as string;
          if (nomineeId) {
            submitVote(nomineeId);
          }
        }}
      >
        <fieldset disabled={voteStatus === "loading"}>
          <legend>Select the player you think wrote this statement:</legend>

          <div className="candidates-list" role="radiogroup" aria-label="Candidate players">
            {candidates.map((candidate: Candidate) => (
              <label key={candidate.id} className="candidate-option">
                <input
                  type="radio"
                  name="nomineeId"
                  value={candidate.id}
                  required
                  data-testid={`candidate-${candidate.id}`}
                />
                <span className="candidate-name">{candidate.name}</span>
              </label>
            ))}
          </div>

          {candidates.length === 0 && (
            <p className="no-candidates">No other players available to vote for.</p>
          )}

          <button
            type="submit"
            className="submit-vote"
            disabled={voteStatus === "loading"}
            data-testid="submit-vote"
          >
            {voteStatus === "loading" ? "Submitting..." : "Submit Vote"}
          </button>
        </fieldset>
      </form>

      {voteStatus === "error" && voteError && (
        <p className="error" role="alert" data-testid="vote-error">
          {voteError}
        </p>
      )}
    </div>
  );
}
