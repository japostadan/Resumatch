import { Shell } from "../common/Shell";
import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useGameSession, hostHash } from "../../hooks/useGameSession";
import { useGameState } from "../../hooks/useGameState";
import { useResultsRedirect } from "../../hooks/useResultsRedirect";
import { StatusGate } from "../common/StatusGate";
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
  const { state, loading, error } = useGameState(gameId, undefined, session);
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

  return (
    <StatusGate
      state={state}
      loading={loading}
      error={error}
      targetStatus="ACTIVE"
      wrapper={Shell}
      loadingEyebrow="Voting round"
      loadingHeading="Setting up the round"
      loadingBody="Loading the round…"
      pendingEyebrow="Voting round"
      pendingHeading="Hang tight"
      pendingBody="The round isn't running yet — keep this tab open."
    >
      {(active) => {
        const waitingForPoll = advancing || advancedFromIndex === active.currentStatementIndex;
        const isLastStatement = active.currentStatementIndex + 1 === active.totalStatements;

        return (
          <Shell>
            <Eyebrow>
              Statement {active.currentStatementIndex + 1} of {active.totalStatements}
            </Eyebrow>
            <Heading>Who wrote this?</Heading>
            {error && <Alert>{error}</Alert>}
            <StatementCard>&ldquo;{active.currentStatement}&rdquo;</StatementCard>
            <Muted>
              {active.votesIn} of {active.totalPlayers} votes in
            </Muted>
            {advanceError && <Alert>{advanceError}</Alert>}
            <Button type="button" onClick={handleNext} disabled={waitingForPoll} className="mt-8">
              {isLastStatement ? "Finish game" : "Next statement"}
            </Button>
          </Shell>
        );
      }}
    </StatusGate>
  );
}
