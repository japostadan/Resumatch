import { Shell } from "../common/Shell";
import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useGameSession, hostHash } from "../../hooks/useGameSession";
import { useGameState } from "../../hooks/useGameState";
import { useResultsRedirect } from "../../hooks/useResultsRedirect";
import { advanceStatement } from "../../lib/api";
import { Button } from "../common/Button";

// The Host's control for the voting round: the statement the room is
// discussing front and centre (this screen is likely on the projector), the
// voting progress, and the button to move on. `advancedFromIndex` keeps the
// button disabled between a successful advance and the next poll reporting
// the new statement, so a double press cannot skip a statement.
export function HostAdvance() {
  const { gameId } = useParams({ from: "/game/$gameId/vote" });
  const { session } = useGameSession();
  const hostToken = session?.role === "host" ? session.hostToken : "";
  const { state, loading, error } = useGameState(gameId);
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
      <blockquote className="mt-6 border-2 border-line bg-surface px-5 py-4 text-lg font-medium text-ink">
        &ldquo;{state.currentStatement}&rdquo;
      </blockquote>
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
