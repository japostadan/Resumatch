import { useState, type FormEvent } from "react";
import { Button } from "../common/Button";
import { useNavigate, useParams } from "@tanstack/react-router";
import { submitStatement } from "../../lib/api";
import { useGameSession, playerHash } from "../../hooks/useGameSession";

export function SubmitStatement() {
  const { gameId } = useParams({ from: "/game/$gameId/submit" });
  const { session } = useGameSession();
  const [statement, setStatement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (statement.trim() === "") {
      setError("Write your statement before submitting");
      return;
    }
    if (session?.role !== "player") {
      setError("Your session has expired. Rejoin the game to continue.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitStatement(gameId, session.playerToken, statement.trim());
      // Carry the player session into the lobby hash — navigating replaces the URL
      // and would otherwise drop it, losing the session on a reload (and for the
      // live lobby view that reads it back via useGameSession).
      navigate({
        to: "/game/$gameId/lobby",
        params: { gameId },
        hash: playerHash(session.playerToken, session.playerId),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit your statement. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="w-full max-w-md">
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">You&apos;re in</p>
        <h1 className="mt-4 font-display text-4xl font-black tracking-tight">
          Submit your statement
        </h1>
        <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
          Write one line about yourself. The room will vote on whether it sounds like a real person
          or a resume cliché.
        </p>

        <form className="mt-9 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold tracking-wide text-ink">Your statement</span>
            <textarea
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              rows={3}
              className="border-2 border-line bg-surface px-4 py-3 text-lg font-medium text-ink outline-none focus:border-violet"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm font-bold text-generic">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit statement"}
          </Button>
        </form>
      </div>
    </div>
  );
}
