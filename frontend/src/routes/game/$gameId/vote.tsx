import { createFileRoute } from "@tanstack/react-router";
import { PlayerVoteView } from "../../../components/vote/PlayerVoteView";

export const Route = createFileRoute("/game/$gameId/vote")({
  component: VoteRouteComponent,
});

function VoteRouteComponent() {
  const { gameId } = Route.useParams();
  const playerId = localStorage.getItem("playerId") || "";

  if (!playerId) {
    return <div className="error">Player ID not found. Please rejoin the game.</div>;
  }

  return <PlayerVoteView gameId={gameId} playerId={playerId} />;
}
