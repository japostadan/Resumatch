import { useEffect, useState } from "react";
import { Button } from "../common/Button";
import { Shell } from "../common/Shell";
import { Eyebrow } from "../common/Eyebrow";
import { Heading } from "../common/Heading";
import { Muted } from "../common/Muted";
import { Alert } from "../common/Alert";
import { useParams, useNavigate } from "@tanstack/react-router";
import type { LobbyPlayer } from "@resumatch/shared";
import { startGame } from "../../lib/api";
import { useGameSession, hostHash, playerHash, type GameSession } from "../../hooks/useGameSession";
import { useGameState } from "../../hooks/useGameState";

function sessionHash(session: GameSession): string {
  return session.role === "host"
    ? hostHash(session.hostToken)
    : playerHash(session.playerToken, session.playerId);
}

// The Host and Player share this route but see different views. The session's
// role decides which; a visitor with no session is sent to rejoin.
export function Lobby() {
  const { gameId } = useParams({ from: "/game/$gameId/lobby" });
  const { session } = useGameSession();
  const playerId = session?.role === "player" ? session.playerId : undefined;
  const hostToken = session?.role === "host" ? session.hostToken : undefined;
  const playerToken = session?.role === "player" ? session.playerToken : undefined;
  const navigate = useNavigate();
  const { state, loading, error } = useGameState(gameId, playerId, { hostToken, playerToken });

  // When the Host starts, the poll reports ACTIVE and everyone moves to voting,
  // carrying their session forward so the vote screen can authenticate them.
  const isActive = state?.status === "ACTIVE";
  useEffect(() => {
    if (!isActive || !session) return;
    navigate({ to: "/game/$gameId/vote", params: { gameId }, hash: sessionHash(session) });
  }, [isActive, session, gameId, navigate]);

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
    return (
      <HostDashboard
        gameId={gameId}
        hostToken={session.hostToken}
        players={players}
        loading={loading}
        error={error}
      />
    );
  }

  return <PlayerWaiting players={players} playerId={session.playerId} error={error} />;
}

function HostDashboard({
  gameId,
  hostToken,
  players,
  loading,
  error,
}: {
  gameId: string;
  hostToken: string;
  players: LobbyPlayer[] | null;
  loading: boolean;
  error: string | null;
}) {
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [confirmingStart, setConfirmingStart] = useState(false);
  const submittedCount = players?.filter((p) => p.hasSubmitted).length ?? 0;
  const canStart = submittedCount >= 2;
  // Starting locks out everyone who hasn't submitted (late statements are
  // rejected once the game is ACTIVE), so an early start needs an explicit
  // confirmation. The poll keeps counts live: if the stragglers submit while
  // the warning is up, it disappears and Start goes back to one click.
  const pendingCount = (players?.length ?? 0) - submittedCount;
  const showStartWarning = confirmingStart && pendingCount > 0;

  // Once the room catches up the confirmation is spent — without this reset a
  // later joiner would pop the warning back open with no click from the host.
  useEffect(() => {
    if (pendingCount === 0) setConfirmingStart(false);
  }, [pendingCount]);

  async function handleStart() {
    if (pendingCount > 0 && !confirmingStart) {
      setConfirmingStart(true);
      return;
    }
    setStartError(null);
    setStarting(true);
    try {
      await startGame(gameId, hostToken);
      // Leave `starting` set: the next poll reports ACTIVE and Lobby navigates
      // everyone to voting, so the button stays disabled through the handoff.
    } catch (err) {
      setStartError(
        err instanceof Error ? err.message : "Could not start the game. Please try again.",
      );
      setStarting(false);
    }
  }

  return (
    <Shell>
      <Eyebrow>Lobby</Eyebrow>
      <Heading>Who&apos;s in the room</Heading>

      <div className="mt-5 border-2 border-line bg-surface p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet">Game ID</p>
        <code className="mt-2 block font-mono text-2xl font-bold tracking-[0.2em] text-ink">
          {gameId}
        </code>
      </div>
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
      {startError && <Alert>{startError}</Alert>}
      {showStartWarning ? (
        <>
          <Alert>
            Only {submittedCount} of {players!.length} players have submitted — players who
            haven&apos;t will be left out of the game.
          </Alert>
          <div className="mt-8 flex gap-4">
            <Button type="button" onClick={handleStart} disabled={starting}>
              {starting ? "Starting…" : "Start anyway"}
            </Button>
            <Button type="button" onClick={() => setConfirmingStart(false)} disabled={starting}>
              Keep waiting
            </Button>
          </div>
        </>
      ) : (
        <Button
          type="button"
          onClick={handleStart}
          disabled={!canStart || starting}
          className="mt-8"
        >
          {starting ? "Starting…" : "Start game"}
        </Button>
      )}
      {!canStart && (
        <p className="mt-3 text-sm text-muted">
          At least 2 players must submit before you can start.
        </p>
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
      <Muted>
        {confirmed
          ? `${me ? `Nice one, ${me.name}. ` : ""}Waiting for the host to start the game — keep this tab open.`
          : "Hang tight while we confirm your submission."}
      </Muted>
    </Shell>
  );
}
