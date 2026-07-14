import { createFileRoute } from "@tanstack/react-router";
import { JoinGame } from "../components/joinGame/JoinGame";

// join.tsx → "/join"
export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>) => ({
    gameId: typeof search.gameId === "string" ? search.gameId : "",
  }),
  component: JoinGame,
});
