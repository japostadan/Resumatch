import { useParams } from "@tanstack/react-router";
import { SessionEnded } from "../common/SessionEnded";
import { useGameSession } from "../../hooks/useGameSession";
import { Eyebrow } from "../common/Eyebrow";
import { Heading } from "../common/Heading";
import { Muted } from "../common/Muted";
import { HostResultView } from "./HostResultView";
import { MainLayout } from "../common/MainLayout";
import { ResultsPane } from "./ResultsPane";

export function Results() {
  const { gameId } = useParams({ from: "/game/$gameId/results" });
  const { session } = useGameSession();

  // SessionEnded carries its own full-screen Shell, so it renders bare here —
  // the same presentation Vote gives it — rather than nested in the chrome.
  if (!session) {
    return <SessionEnded />;
  }

  if (session.role === "host") {
    return (
      <MainLayout>
        <HostResultView gameId={gameId} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ResultsPane>
        <Eyebrow>Game is over</Eyebrow>
        <Heading>The game has finished</Heading>
        <Muted>
          Results opens in the next slice. Keep this tab open — the results are being dealt out.
        </Muted>
      </ResultsPane>
    </MainLayout>
  );
}
