import { createFileRoute } from "@tanstack/react-router";
import { Results } from "../../../components/results/Results";

// game/$gameId/results.tsx → "/game/:gameId/results"
export const Route = createFileRoute("/game/$gameId/results")({
  component: Results,
});
