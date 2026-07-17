import { useNavigate } from "@tanstack/react-router";
import { useGameState } from "../../hooks/useGameState";
import { StatusGate } from "../common/StatusGate";
import { ResultsPane } from "./ResultsPane";
import { Eyebrow } from "../common/Eyebrow";
import { Heading } from "../common/Heading";
import { Button } from "../common/Button";
import { StatementCard } from "../common/StatementCard";
import { VerdictGlyph } from "../common/motifs";

type HostResultViewProps = {
  gameId: string;
  hostToken: string;
};

export function HostResultView({ gameId, hostToken }: HostResultViewProps) {
  const { state, loading, error } = useGameState(gameId, undefined, { role: "host", hostToken });
  const navigate = useNavigate();

  return (
    <StatusGate
      state={state}
      loading={loading}
      error={error}
      targetStatus="FINISHED"
      wrapper={ResultsPane}
      loadingEyebrow="Results view"
      loadingHeading="Setting up the results"
      loadingBody="Loading the results…"
      pendingEyebrow="Results view"
      pendingHeading="Hang tight"
      pendingBody="The game is still in progress. Results appear once it finishes."
    >
      {(finished) => {
        // The backend ranks results by correct-vote share, most distinctive first.
        const resultViews = finished.results.map((result) => (
          <StatementCard key={result.playerId}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-base">{result.name}</div>
              <div
                className={
                  "flex items-center gap-1.5 rounded-full text-sm font-bold text-badge-ink px-2 " +
                  (result.verdict === "Distinctive" ? "bg-distinctive" : "bg-generic")
                }
              >
                <VerdictGlyph verdict={result.verdict} />
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
              <Button type="button" onClick={() => navigate({ to: "/" })}>
                Finish
              </Button>
            </div>
          </ResultsPane>
        );
      }}
    </StatusGate>
  );
}
