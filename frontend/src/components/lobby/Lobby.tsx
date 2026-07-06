import { useParams } from "@tanstack/react-router";
import type { LobbyPlayer } from "@resumatch/shared";
import { useGameSession } from "../../hooks/useGameSession";
import { useGameState } from "../../hooks/useGameState";

// The Host and Player share this route but see different views. The session's
// role decides which; a visitor with no session is sent to rejoin.
export function Lobby() {
  const { gameId } = useParams({ from: "/game/$gameId/lobby" });
  const { session } = useGameSession();
  const playerId = session?.role === "player" ? session.playerId : undefined;
  const { state, loading, error } = useGameState(gameId, playerId);

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

  const players = state?.status === "LOBBY" ? state.players : null;

  if (session.role === "host") {
    return <HostDashboard players={players} loading={loading} error={error} />;
  }

  return <PlayerWaiting players={players} playerId={session.playerId} error={error} />;
}

function HostDashboard({
  players,
  loading,
  error,
}: {
  players: LobbyPlayer[] | null;
  loading: boolean;
  error: string | null;
}) {
  const submittedCount = players?.filter((p) => p.hasSubmitted).length ?? 0;

  return (
    <Shell>
      <Eyebrow>Lobby</Eyebrow>
      <Heading>Who&apos;s in the room</Heading>
      {error && <Alert>{error}</Alert>}
      {players === null ? (
        loading && <p className="mt-6 text-base text-muted">Loading the room…</p>
      ) : players.length === 0 ? (
        <p className="mt-6 text-base text-muted">Waiting for the first player to join…</p>
      ) : (
        <>
          <p className="mt-5 text-base text-muted">
            {submittedCount} of {players.length} submitted
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between border-2 border-line bg-surface px-4 py-3"
              >
                <span className="text-lg font-bold text-ink">{player.name}</span>
                <span
                  className={`text-sm font-bold ${
                    player.hasSubmitted ? "text-distinctive" : "text-muted"
                  }`}
                >
                  {player.hasSubmitted ? "Submitted" : "Waiting"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Shell>
  );
}

function PlayerWaiting({
  players,
  playerId,
  error,
}: {
  players: LobbyPlayer[] | null;
  playerId: string;
  error: string | null;
}) {
  const me = players?.find((p) => p.id === playerId);
  const confirmed = me?.hasSubmitted ?? false;

  return (
    <Shell>
      <Eyebrow>{confirmed ? "You're set" : "Almost there"}</Eyebrow>
      <Heading>{confirmed ? "Your statement is in" : "Saving your statement…"}</Heading>
      {error && <Alert>{error}</Alert>}
      <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
        {confirmed
          ? `${me ? `Nice one, ${me.name}. ` : ""}Waiting for the host to start the game — keep this tab open.`
          : "Hang tight while we confirm your submission."}
      </p>
    </Shell>
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

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-5 text-sm font-bold text-generic">
      {children}
    </p>
  );
}
