import { useParams } from "@tanstack/react-router";
import { useGameSession } from "../../hooks/useGameSession";
import { PlayerVoteView } from "./PlayerVoteView";
import { HostAdvance } from "./HostAdvance";
import { SessionEnded } from "../common/SessionEnded";

// The Host and Player share this route but see different views, the same split
// as the Lobby. The Player gets the ballot; the Host advances the statements.
// A visitor with no session is sent to rejoin.
export function Vote() {
  const { gameId } = useParams({ from: "/game/$gameId/vote" });
  const { session } = useGameSession();

  if (!session) {
    return <SessionEnded />;
  }

  if (session.role === "host") {
    return <HostAdvance />;
  }

  return (
    <PlayerVoteView gameId={gameId} playerId={session.playerId} playerToken={session.playerToken} />
  );
}
