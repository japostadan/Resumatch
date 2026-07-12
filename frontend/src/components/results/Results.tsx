import { useParams } from "@tanstack/react-router";
import { SessionEnded } from "../common/SessionEnded";
import { useGameSession } from "../../hooks/useGameSession";
import { Shell } from "../common/Shell";
import { HostResultView } from "./HostResultView";

export function Results() {
  const { gameId } = useParams({ from: "/game/$gameId/results" });
  const { session } = useGameSession();

  if (!session) {
    return <SessionEnded />;
  }

  if (session.role === "host") {
    return <HostResultView gameId={gameId} />;
  }

  return (
    <Shell>
      <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">Game is over</p>
      <h1 className="mt-4 font-display text-4xl font-black tracking-tight">
        The game has finished
      </h1>
      <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
        Results opens in the next slice. Keep this tab open — the results are being dealt out.
      </p>
    </Shell>
  );
}
