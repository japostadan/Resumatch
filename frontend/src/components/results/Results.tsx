import { useParams } from "@tanstack/react-router";
import { SessionEnded } from "../common/SessionEnded";
import { useGameSession } from "../../hooks/useGameSession";
import { HostResultView } from "./HostResultView";
import { PlayerResultView } from "./PlayerResultView";
import { MainLayout } from "../common/MainLayout";

export function Results() {
  const { gameId } = useParams({ from: "/game/$gameId/results" });
  const { session } = useGameSession();

  // SessionEnded carries its own full-screen Shell, so it renders bare here —
  // the same presentation Vote gives it — rather than nested in the chrome.
  if (!session) {
    return <SessionEnded />;
  }

  return (
    <MainLayout>
      {session.role === "host" ? (
        <HostResultView gameId={gameId} hostToken={session.hostToken} />
      ) : (
        <PlayerResultView
          gameId={gameId}
          playerId={session.playerId}
          playerToken={session.playerToken}
        />
      )}
    </MainLayout>
  );
}
