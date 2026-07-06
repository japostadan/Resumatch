import { createFileRoute } from "@tanstack/react-router";
import { Vote } from "../../../components/vote/Vote";

// game/$gameId/vote.tsx → "/game/:gameId/vote"
export const Route = createFileRoute("/game/$gameId/vote")({
  component: Vote,
});
