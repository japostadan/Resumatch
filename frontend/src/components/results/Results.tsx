import { useParams } from "@tanstack/react-router";
import { SessionEnded } from "../common/SessionEnded";
import { useGameSession } from "../../hooks/useGameSession";
import { Shell } from "../common/Shell";
import { Eyebrow } from "../common/Eyebrow";
import { Heading } from "../common/Heading";
import { Muted } from "../common/Muted";
import { HostResultView } from "./HostResultView";
import { MainLayout } from "../common/MainLayout";

export function Results() {
  const { gameId } = useParams({ from: "/game/$gameId/results" });
  const { session } = useGameSession();

  if (!session) {
    return (
      <MainLayout>
        <SessionEnded />
      </MainLayout>
    );
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
      <Shell>
        <Eyebrow>Game is over</Eyebrow>
        <Heading>The game has finished</Heading>
        <Muted>
          Results opens in the next slice. Keep this tab open — the results are being dealt out.
        </Muted>
      </Shell>
    </MainLayout>
  );
}
