import { useParams } from "@tanstack/react-router";
import { useGameSession } from "../../hooks/useGameSession";
import { PlayerVoteView } from "./PlayerVoteView";

// The Host and Player share this route but see different views, the same split
// as the Lobby. The Player gets the ballot; the Host keeps a placeholder until
// Slice C2 (#22) adds statement advancement. A visitor with no session is sent
// to rejoin.
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
    return (
      <Shell>
        <Eyebrow>Game on</Eyebrow>
        <Heading>The game has started</Heading>
        <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
          The room is voting on the first statement. You&apos;ll advance the statements from here in
          the next slice — keep this tab open.
        </p>
      </Shell>
    );
  }

  return (
    <PlayerVoteView gameId={gameId} playerId={session.playerId} playerToken={session.playerToken} />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">{children}</p>;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h1 className="mt-4 font-display text-4xl font-black tracking-tight">{children}</h1>;
}
