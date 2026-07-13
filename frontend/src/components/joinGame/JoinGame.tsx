import { useState, type FormEvent } from "react";
import { Button } from "../common/Button";
import { useNavigate } from "@tanstack/react-router";
import { joinGame } from "../../lib/api";
import { playerHash } from "../../hooks/useGameSession";
import { Route } from "../../routes/join";

export function JoinGame() {
  const { gameId: initialGameId = "" } = Route.useSearch();
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState(initialGameId);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (playerName.trim() === "" || gameId.trim() === "" || password.trim() === "") {
      setError("Enter your name, the Game ID, and the password to join");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const joined = await joinGame(gameId.trim(), password, playerName.trim());
      // Carry the player session in the destination hash — navigating replaces the
      // URL, so writing the hash before navigation would be wiped. The Submit and
      // Lobby screens read it back via useGameSession.
      navigate({
        to: "/game/$gameId/submit",
        params: { gameId: gameId.trim() },
        hash: playerHash(joined.playerToken, joined.playerId),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the game. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">Join a game</p>
      <h1 className="mt-4 font-display text-4xl font-black tracking-tight">Join the room</h1>
      <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
        Enter your name, then the Game ID and password your host read out to the room.
      </p>

      <form className="mt-9 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold tracking-wide text-ink">Your name</span>
          <input
            type="text"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            className="border-2 border-line bg-surface px-4 py-3 text-lg font-medium text-ink outline-none focus:border-violet"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold tracking-wide text-ink">Game ID</span>
          <input
            type="text"
            value={gameId}
            onChange={(event) => setGameId(event.target.value)}
            className="border-2 border-line bg-surface px-4 py-3 text-lg font-medium text-ink outline-none focus:border-violet"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold tracking-wide text-ink">Password</span>
          <input
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border-2 border-line bg-surface px-4 py-3 text-lg font-medium text-ink outline-none focus:border-violet"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm font-bold text-generic">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Joining…" : "Join game"}
        </Button>
      </form>
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
