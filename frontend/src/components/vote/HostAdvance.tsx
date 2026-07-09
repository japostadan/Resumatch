import { Shell } from "../common/Shell";
import { useParams } from "@tanstack/react-router";
import { useGameSession } from "../../hooks/useGameSession";
import { Header } from "../common/Header";
import { Main } from "../common/Main";
import { Footer } from "../common/Footer";
import { useGameState } from "../../hooks/useGameState";
import { useState } from "react";
import { advanceStatement } from "../../lib/api";

export function HostAdvance() {
  const { gameId } = useParams({ from: "/game/$gameId/vote" });
  const { session } = useGameSession();
  const hostToken = session?.role === "host" ? session.hostToken : undefined;
  const { state } = useGameState(gameId, hostToken);
  const isActive = state?.status === "ACTIVE";
  const [currentStatementIndex, setCurrentStatementIndex] = useState(
    isActive ? state?.currentStatementIndex : 0,
  );
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state?.status === "FINISHED") {
  }

  if (currentStatementIndex !== (isActive ? state?.currentStatementIndex : 0)) {
    setCurrentStatementIndex(isActive ? state?.currentStatementIndex : 0);
    setAdvanced(false);
    setError(null);
  }

  const handleNext = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setError(null);
    setAdvanced(true);
    if (!hostToken) {
      setError("Your session has expired.");
      return;
    }
    try {
      advanceStatement(gameId, hostToken);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not advance statement. Please try again.",
      );
    } finally {
      setAdvanced(false);
    }
  };

  return (
    <>
      <Header />
      <Main>
        <Shell>
          <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">Game on</p>
          <div className="mt-4 flex flex-col gap-5">
            <h1 className="mt-4 font-display text-4xl font-black tracking-tight">
              {isActive
                ? `Current statement ${state?.currentStatementIndex + 1} of ${state?.totalStatements}`
                : "Error:"}
            </h1>
            <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
              {isActive ? state?.currentStatement : "Current game is inactive."}
            </p>
            <button
              disabled={!isActive && !advanced}
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
