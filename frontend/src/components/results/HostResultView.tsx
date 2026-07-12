import { useNavigate } from "@tanstack/react-router";
import { useGameState } from "../../hooks/useGameState";
import { Shell } from "../common/Shell";
import { Eyebrow } from "../common/Eyebrow";
import { Heading } from "../common/Heading";
import { Muted } from "../common/Muted";
import { Alert } from "../common/Alert";
import { Button } from "../common/Button";

type HostResultViewProps = {
  gameId: string;
};

export function HostResultView({ gameId }: HostResultViewProps) {
  const { state, loading, error } = useGameState(gameId);
  const navigate = useNavigate();

  if (!state) {
    return (
      <Shell>
        <Eyebrow>Results view</Eyebrow>
        <Heading>Setting up the results</Heading>
        {error ? <Alert>{error}</Alert> : loading && <Muted>Loading the results…</Muted>}
      </Shell>
    );
  }

  if (state.status !== "FINISHED") {
    return (
      <Shell>
        <Eyebrow>Results view</Eyebrow>
        <Heading>Hang tight</Heading>
        {error && <Alert>{error}</Alert>}
        <Muted> The game has finished. Results are on their way. </Muted>
      </Shell>
    );
  }

  const resultViews = state.results
    .toSorted((a, b) => b.correctVotes - a.correctVotes)
    .map((result) => (
      <blockquote
        key={result.playerId}
        className="mt-6 border-2 border-line bg-surface px-5 py-4 text-lg font-medium text-ink"
      >
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-base">{result.name}</div>
          <div
            className={
              "rounded-full text-sm text-white pr-2 pl-2 " +
              (result.verdict === "Distinctive" ? "bg-green-700" : "bg-blue-700")
            }
          >
            {result.verdict}
          </div>
        </div>
        <div className="p-6 italic text-lg">{result.statement}</div>
        <div>
          <div className="w-full h-4 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-300"
              style={{ width: `${(result.correctVotes / result.totalVotes) * 100}%` }}
            />
          </div>
          <div className="p-2 flex justify-center text-base">
            {result.correctVotes}/{result.totalVotes}
          </div>
        </div>
      </blockquote>
    ));

  return (
    <Shell>
      <Eyebrow>Results view</Eyebrow>
      <Heading>Results </Heading>
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
    </Shell>
  );
}
