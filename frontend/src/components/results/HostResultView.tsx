import { useGameState } from "../../hooks/useGameState";
import { Shell } from "../common/Shell";
import { Eyebrow } from "../common/Eyebrow";
import { Heading } from "../common/Heading";
import { Muted } from "../common/Muted";
import { Alert } from "../common/Alert";

type HostResultViewProps = {
  gameId: string;
};

export function HostResultView({ gameId }: HostResultViewProps) {
  const { state, loading, error } = useGameState(gameId);

  if (!state) {
    return (
      <Shell>
        <Eyebrow>Results view</Eyebrow>
        <Heading>Setting up the results</Heading>
        {error ? <Alert>{error}</Alert> : loading && <Muted>Loading the results…</Muted>}
      </Shell>
    );
  }

  if (state.status !== "ACTIVE") {
    return (
      <Shell>
        <Eyebrow>Results view</Eyebrow>
        <Heading>Hang tight</Heading>
        {error && <Alert>{error}</Alert>}
        <Muted> The game has finished. Results are on their way. </Muted>
      </Shell>
    );
  }
}
