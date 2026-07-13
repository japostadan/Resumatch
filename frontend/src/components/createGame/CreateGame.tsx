import { Shell } from "../common/Shell";
import { Button } from "../common/Button";
import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createGame, type CreatedGame } from "../../lib/api";
import { useGameSession, hostHash } from "../../hooks/useGameSession";
import { GameQRCode } from "../QrCode/QRCode";

export function CreateGame() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [game, setGame] = useState<CreatedGame | null>(null);
  const { setHostSession } = useGameSession();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.trim() === "") {
      setError("Enter a password to create a game");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await createGame(password);
      setHostSession(created.hostToken);
      setGame(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the game. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (game) {
    const joinUrl = new URL("join/", window.location.origin);
    joinUrl.searchParams.set("gameId", game.gameId);

    return (
      <Shell>
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">Game created</p>

        <h1 className="mt-4 font-display text-4xl font-black tracking-tight">
          Read this out to the room
        </h1>

        <dl className="mt-9 grid gap-4">
          <Field label="Game ID">
            <span className="font-display text-5xl font-black tracking-wider text-violet">
              {game.gameId}
            </span>
          </Field>

          <Field label="Scan to join">
            <div className="flex justify-center">
              <GameQRCode value={joinUrl.toString()} />
            </div>
          </Field>

          <Field label="Password">
            <span className="font-display text-3xl font-bold">{password}</span>
          </Field>
        </dl>

        <p className="mt-8 max-w-[42ch] text-sm leading-relaxed text-muted">
          Players open Resumatch, choose <span className="font-bold text-ink">Join a game</span>,
          and enter this Game ID and password. Open the lobby to watch them arrive.
        </p>

        <Button
          type="button"
          onClick={() =>
            navigate({
              to: "/game/$gameId/lobby",
              params: {
                gameId: game.gameId,
              } as never,
              hash: hostHash(game.hostToken),
            })
          }
          className="mt-8"
        >
          Open the lobby
        </Button>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">Host a game</p>

      <h1 className="mt-4 font-display text-4xl font-black tracking-tight">Create a game</h1>

      <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
        Pick a password for this session. You'll share it, along with the Game ID, with the room so
        everyone can join.
      </p>

      <form className="mt-9 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold tracking-wide text-ink">Game password</span>

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
          {submitting ? "Creating…" : "Create game"}
        </Button>
      </form>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-line bg-surface px-5 py-4">
      <dt className="text-xs font-bold tracking-widest text-muted uppercase">{label}</dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  );
}
