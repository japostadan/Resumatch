import { Shell } from "../common/Shell";
import { useParams } from "@tanstack/react-router";
import { useGameSession, hostHash } from "../../hooks/useGameSession";
import { Header } from "../common/Header";
import { Main } from "../common/Main";
import { Footer } from "../common/Footer";
import { useGameState } from "../../hooks/useGameState";
import { useState } from "react";
import { advanceStatement } from "../../lib/api";
import { useResultsRedirect } from "../../hooks/useResultsRedirect";

export function HostAdvance() {
  const { gameId } = useParams({ from: "/game/$gameId/vote" });
  const { session } = useGameSession();
  const hostToken = session?.role === "host" ? session.hostToken : "";
  const { state } = useGameState(gameId);
  const [advancing, setAdvancing] = useState(false);
  const [advancedFromIndex, setAdvancedFromIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useResultsRedirect(gameId, state?.status === "FINISHED", hostHash(hostToken));

  const isActive = state?.status === "ACTIVE";

  // `advancedFromIndex` keeps Next disabled between a successful advance and
  // the next poll reporting the new statement, so a double press cannot skip
  // a statement. It stops matching as soon as the index moves on.
  const waitingForPoll =
    isActive && (advancing || advancedFromIndex === state.currentStatementIndex);

  async function handleNext() {
    if (state?.status !== "ACTIVE") return;
    setError(null);
    setAdvancing(true);
    try {
      await advanceStatement(gameId, hostToken);
      setAdvancedFromIndex(state.currentStatementIndex);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not advance statement. Please try again.",
      );
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <>
      <Header />
      <Main>
        <Shell>
          <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">Game on</p>
          <div className="mt-4 flex flex-col gap-5">
            <h1 className="mt-4 font-display text-4xl font-black tracking-tight">
              {state === null
                ? "Loading…"
                : isActive
                  ? `Current statement ${state.currentStatementIndex + 1} of ${state.totalStatements}`
                  : "Error:"}
            </h1>
            <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
              {state === null
                ? ""
                : isActive
                  ? state.currentStatement
                  : "Current game is inactive."}
            </p>
            <button
              disabled={!isActive || waitingForPoll}
              onClick={handleNext}
              className="rounded mt-9 bg-violet px-4 py-2 text-white hover:bg-violet/80 disabled:cursor-not-allowed disabled:bg-violet/50"
            >
              Next
            </button>
            {error && (
              <p role="alert" className="text-sm font-bold text-generic">
                {error}
              </p>
            )}
          </div>
        </Shell>
      </Main>
      <Footer />
    </>
  );
}
