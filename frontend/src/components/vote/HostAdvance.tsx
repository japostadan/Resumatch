import { useParams } from "@tanstack/react-router";
import { useGameSession } from "../../hooks/useGameSession";

export function HostAdvance() {
  const { gameId } = useParams({ from: "/game/$gameId/vote" });
  const { session } = useGameSession();
  const hostToken = session?.role === "host" ? session.hostToken : undefined;

  return (
    <button className="rounded bg-violet px-4 py-2 text-white hover:bg-violet/80 disabled:cursor-not-allowed disabled:bg-violet/50" />
  );
}
