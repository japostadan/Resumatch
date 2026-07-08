import { Shell } from "../common/Shell";
import { useParams } from "@tanstack/react-router";
import { useGameSession } from "../../hooks/useGameSession";
import { Header } from "../common/Header";
import { Main } from "../common/Main";
import { Footer } from "../common/Footer";
import { useGameState } from "../../hooks/useGameState";

export function HostAdvance() {
  const { gameId } = useParams({ from: "/game/$gameId/vote" });
  const { session } = useGameSession();
  const hostToken = session?.role === "host" ? session.hostToken : undefined;
  const { state } = useGameState(gameId, hostToken);
  const isActive = state?.status === "ACTIVE";
  const statementNumber = isActive
    ? `Current statement ${state?.currentStatementIndex + 1} of ${state?.totalStatements}`
    : "Error:";
  const statementText = isActive ? state?.currentStatement : "Current game is inactive.";

  const handleNext = () => {};

  return (
    <>
      <Header />
      <Main>
        <Shell>
          <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">Game on</p>
          <div className="mt-4 flex flex-col gap-5">
            <h1 className="mt-4 font-display text-4xl font-black tracking-tight">
              {statementNumber}
            </h1>
            <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
              {statementText}
            </p>
            <button
              disabled={!isActive}
              onClick={handleNext}
              className="rounded mt-9 bg-violet px-4 py-2 text-white hover:bg-violet/80 disabled:cursor-not-allowed disabled:bg-violet/50"
            >
              Next
            </button>
          </div>
        </Shell>
      </Main>
      <Footer />
    </>
  );
}
