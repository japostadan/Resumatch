import { createFileRoute } from "@tanstack/react-router";
import { Lobby } from "../../../components/lobby/Lobby";

// game/$gameId/lobby.tsx → "/game/:gameId/lobby"
export const Route = createFileRoute("/game/$gameId/lobby")({
  component: Lobby,
});
