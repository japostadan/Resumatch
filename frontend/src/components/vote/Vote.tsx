import { useParams } from "@tanstack/react-router";
import { useGameSession } from "../../hooks/useGameSession";
import { PlayerVoteView } from "./PlayerVoteView";
import { HostAdvance } from "./HostAdvance";
import { Shell } from "../common/Shell";
import { Eyebrow } from "../common/Eyebrow";

// The Host and Player share this route but see different views, the same split
// as the Lobby. The Player gets the ballot; the Host advances the statements.
// A visitor with no session is sent to rejoin.
export function Vote() {
  const { gameId } = useParams({ from: "/game/$gameId/vote" });
  const { session } = useGameSession();

  if (!session) {
    return (
      <Shell>
        <Eyebrow>Session ended</Eyebrow>
        <Heading>Rejoin the game</Heading>
        <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
          We couldn&apos;t find your session on this device. Head back and rejoin with the Game ID
          and password.
        </p>
      </Shell>
    );
  }

  if (session.role === "host") {
    return <HostAdvance />;
  }

  return (
    <PlayerVoteView gameId={gameId} playerId={session.playerId} playerToken={session.playerToken} />
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h1 className="mt-4 font-display text-4xl font-black tracking-tight">{children}</h1>;
}
