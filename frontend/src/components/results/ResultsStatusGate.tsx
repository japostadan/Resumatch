import type { FinishedView, GameView } from "@resumatch/shared";
import { ResultsPane } from "./ResultsPane";
import { Eyebrow } from "../common/Eyebrow";
import { Heading } from "../common/Heading";
import { Muted } from "../common/Muted";
import { Alert } from "../common/Alert";

type ResultsStatusGateProps = {
  state: GameView | null;
  loading: boolean;
  error: string | null;
  loadingHeading: string;
  loadingBody: string;
  pendingEyebrow: string;
  pendingHeading: string;
  pendingBody: string;
  children: (state: FinishedView) => React.ReactNode;
};

// The Host and Player results screens poll through the same two "not ready
// yet" states before they diverge on what FINISHED looks like — this carries
// that shared shape so each screen only has to render its own reveal.
export function ResultsStatusGate({
  state,
  loading,
  error,
  loadingHeading,
  loadingBody,
  pendingEyebrow,
  pendingHeading,
  pendingBody,
  children,
}: ResultsStatusGateProps) {
  if (!state) {
    return (
      <ResultsPane>
        <Eyebrow>Results view</Eyebrow>
        <Heading>{loadingHeading}</Heading>
        {error ? <Alert>{error}</Alert> : loading && <Muted>{loadingBody}</Muted>}
      </ResultsPane>
    );
  }

  if (state.status !== "FINISHED") {
    return (
      <ResultsPane>
        <Eyebrow>{pendingEyebrow}</Eyebrow>
        <Heading>{pendingHeading}</Heading>
        {error && <Alert>{error}</Alert>}
        <Muted>{pendingBody}</Muted>
      </ResultsPane>
    );
  }

  return <>{children(state)}</>;
}
