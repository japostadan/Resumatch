import { Shell } from "../common/Shell";
import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useGameSession, hostHash } from "../../hooks/useGameSession";
import { useGameState } from "../../hooks/useGameState";
import { useResultsRedirect } from "../../hooks/useResultsRedirect";
import { advanceStatement } from "../../lib/api";
import { Button } from "../common/Button";
import { Eyebrow } from "../common/Eyebrow";
import { Heading } from "../common/Heading";
import { Muted } from "../common/Muted";
import { Alert } from "../common/Alert";
import { StatementCard } from "../common/StatementCard";

// The Host's control for the voting round: the statement the room is
// discussing front and centre (this screen is likely on the projector), the
// voting progress, and the button to move on. `advancedFromIndex` keeps the
// button disabled between a successful advance and the next poll reporting
// the new statement, so a double press cannot skip a statement.
export function HostAdvance() {
  const { gameId } = useParams({ from: "/game/$gameId/vote" });
  const { session } = useGameSession();
  const hostToken = session?.role === "host" ? session.hostToken : "";
  const { state, loading, error } = useGameState(gameId, undefined, { hostToken });
  const [advancing, setAdvancing] = useState(false);
  const [advancedFromIndex, setAdvancedFromIndex] = useState<number | null>(null);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  useResultsRedirect(gameId, state?.status === "FINISHED", hostHash(hostToken));

  async function handleNext() {
    if (state?.status !== "ACTIVE") return;
    setAdvanceError(null);
    setAdvancing(true);
    try {
      await advanceStatement(gameId, hostToken);
      setAdvancedFromIndex(state.currentStatementIndex);
    } catch (err) {
      setAdvanceError(
        err instanceof Error ? err.message : "Could not advance statement. Please try again.",
      );
    } finally {
      setAdvancing(false);
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
        <Muted>The round isn&apos;t running yet — keep this tab open.</Muted>
      </Shell>
    );
  }

  const waitingForPoll = advancing || advancedFromIndex === state.currentStatementIndex;
  const isLastStatement = state.currentStatementIndex + 1 === state.totalStatements;

  return (
    <Shell>
      <Eyebrow>
        Statement {state.currentStatementIndex + 1} of {state.totalStatements}
      </Eyebrow>
      <Heading>Who wrote this?</Heading>
      {error && <Alert>{error}</Alert>}
      <StatementCard>&ldquo;{state.currentStatement}&rdquo;</StatementCard>
      <Muted>
        {state.votesIn} of {state.totalPlayers} votes in
      </Muted>
      {advanceError && <Alert>{advanceError}</Alert>}
      <Button type="button" onClick={handleNext} disabled={waitingForPoll} className="mt-8">
        {isLastStatement ? "Finish game" : "Next statement"}
      </Button>
    </Shell>
  );
}
