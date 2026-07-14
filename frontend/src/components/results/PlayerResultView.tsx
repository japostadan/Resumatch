import type { Verdict } from "@resumatch/shared";
import { useGameState } from "../../hooks/useGameState";
import { ResultsStatusGate } from "./ResultsStatusGate";
import { ResultsPane } from "./ResultsPane";
import { Eyebrow } from "../common/Eyebrow";
import { Heading } from "../common/Heading";
import { Muted } from "../common/Muted";

type PlayerResultViewProps = {
  gameId: string;
  playerId: string;
  playerToken: string;
};

// Hand-authored per #24 — tailored to the verdict, not the specific
// statement, so it stays true without needing AI or a backend call.
const TAKEAWAY_CARDS: Record<Verdict, { heading: string; intro: string; items: string[] }> = {
  Distinctive: {
    heading: "Keep what worked, push further",
    intro: "Your statement stood out. For your next CV edit:",
    items: [
      "Note which concrete detail made it recognisable",
      "Keep those specifics — don't sand them down",
      "Push one more line from generic to concrete",
    ],
  },
  Generic: {
    heading: "Make it unmistakably yours",
    intro: "For your next CV edit:",
    items: [
      'Replace cliches ("hard-working team player") with specifics',
      "Name a real project you built",
      "Quantify one outcome (users, %, time saved)",
      "Cut filler adjectives",
    ],
  },
};

// The Player's own reveal: just their verdict and a matching Takeaway Card,
// never the full room reveal the Host projects (#24). The backend already
// scopes the FINISHED response to this player's own result (#80).
export function PlayerResultView({ gameId, playerId, playerToken }: PlayerResultViewProps) {
  const { state, loading, error } = useGameState(gameId, playerId, { playerToken });

  return (
    <ResultsStatusGate
      state={state}
      loading={loading}
      error={error}
      loadingHeading="Setting up your results"
      loadingBody="Loading your results…"
      pendingEyebrow="Game is over"
      pendingHeading="The game has finished"
      pendingBody="Keep this tab open — your results are being dealt out."
    >
      {(finished) => {
        const ownResult = finished.results[0];

        if (!ownResult) {
          return (
            <ResultsPane>
              <Eyebrow>Game is over</Eyebrow>
              <Heading>Thanks for playing</Heading>
              <Muted>
                You didn&apos;t have a statement in this round, so there&apos;s no card for you.
              </Muted>
            </ResultsPane>
          );
        }

        const card = TAKEAWAY_CARDS[ownResult.verdict];

        return (
          <ResultsPane>
            <Eyebrow>Your result</Eyebrow>
            <Heading>{ownResult.verdict}</Heading>
            <div className="mt-6 border-2 border-line bg-surface px-5 py-4">
              <div className="text-lg font-bold text-ink">{card.heading}</div>
              <Muted>{card.intro}</Muted>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-base text-ink">
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </ResultsPane>
        );
      }}
    </ResultsStatusGate>
  );
}
