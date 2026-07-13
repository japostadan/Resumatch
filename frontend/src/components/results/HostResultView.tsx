import { useNavigate } from "@tanstack/react-router";
import { useGameState } from "../../hooks/useGameState";
import { ResultsPane } from "./ResultsPane";
import { Eyebrow } from "../common/Eyebrow";
import { Heading } from "../common/Heading";
import { Muted } from "../common/Muted";
import { Alert } from "../common/Alert";
import { Button } from "../common/Button";
import { StatementCard } from "../common/StatementCard";

type HostResultViewProps = {
  gameId: string;
};

export function HostResultView({ gameId }: HostResultViewProps) {
  const { state, loading, error } = useGameState(gameId);
  const navigate = useNavigate();

  if (!state) {
    return (
      <ResultsPane>
        <Eyebrow>Results view</Eyebrow>
        <Heading>Setting up the results</Heading>
        {error ? <Alert>{error}</Alert> : loading && <Muted>Loading the results…</Muted>}
      </ResultsPane>
    );
  }

  if (state.status !== "FINISHED") {
    return (
      <ResultsPane>
        <Eyebrow>Results view</Eyebrow>
        <Heading>Hang tight</Heading>
        {error && <Alert>{error}</Alert>}
        <Muted>The game is still in progress. Results appear once it finishes.</Muted>
      </ResultsPane>
    );
  }

  // The backend ranks results by correct-vote share, most distinctive first.
  const resultViews = state.results.map((result) => (
    <StatementCard key={result.playerId}>
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-base">{result.name}</div>
        <div
          className={
            "rounded-full text-sm font-bold text-canvas px-2 " +
            (result.verdict === "Distinctive" ? "bg-distinctive" : "bg-generic")
          }
        >
          {result.verdict}
        </div>
      </div>
      <div className="p-6 italic text-lg">{result.statement}</div>
      <div>
        <progress
          aria-label={`Correct guesses for ${result.name}`}
          value={result.correctVotes}
          // A zero-max progress bar is invalid HTML; an unvoted statement
          // shows an empty bar out of 1 instead.
          max={result.totalVotes === 0 ? 1 : result.totalVotes}
          className="h-4 w-full appearance-none overflow-hidden rounded-full bg-hair [&::-webkit-progress-bar]:bg-hair [&::-webkit-progress-value]:bg-violet [&::-moz-progress-bar]:bg-violet"
        />
        <div className="p-2 flex justify-center text-base">
          {result.correctVotes}/{result.totalVotes}
        </div>
      </div>
    </StatementCard>
  ));

  return (
    <ResultsPane>
      <Eyebrow>Results view</Eyebrow>
      <Heading>Results</Heading>
      <div>{resultViews}</div>
      <div className="p-6 flex justify-center items-center h-40">
        <Button
          type="button"
          onClick={() =>
            navigate({
              to: "/",
            })
          }
        >
          Finish
        </Button>
      </div>
    </ResultsPane>
  );
}
