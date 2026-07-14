import type { GameStatus, GameView } from "@resumatch/shared";
import { Eyebrow } from "./Eyebrow";
import { Heading } from "./Heading";
import { Muted } from "./Muted";
import { Alert } from "./Alert";

type Wrapper = (props: { children: React.ReactNode }) => React.ReactNode;

type NotYet<Status extends GameStatus> = Exclude<GameView, { status: Status }>;
type Reached<Status extends GameStatus> = Extract<GameView, { status: Status }>;

type StatusGateProps<Status extends GameStatus> = {
  state: GameView | null;
  loading: boolean;
  error: string | null;
  targetStatus: Status;
  wrapper: Wrapper;
  loadingEyebrow: string;
  loadingHeading: string;
  loadingBody: string;
  pendingEyebrow: string;
  pendingHeading: string;
  pendingBody: string | ((state: NotYet<Status>) => string);
  children: (state: Reached<Status>) => React.ReactNode;
};

// Every poll-driven screen (voting round, results reveal) passes through the
// same two "not ready yet" states before it can render the status it's
// actually waiting for — this carries that shared shape so each screen only
// renders its own target-status view.
export function StatusGate<Status extends GameStatus>({
  state,
  loading,
  error,
  targetStatus,
  wrapper: Wrapper,
  loadingEyebrow,
  loadingHeading,
  loadingBody,
  pendingEyebrow,
  pendingHeading,
  pendingBody,
  children,
}: StatusGateProps<Status>) {
  if (!state) {
    return (
      <Wrapper>
        <Eyebrow>{loadingEyebrow}</Eyebrow>
        <Heading>{loadingHeading}</Heading>
        {error ? <Alert>{error}</Alert> : loading && <Muted>{loadingBody}</Muted>}
      </Wrapper>
    );
  }

  if (state.status !== targetStatus) {
    // TS can't narrow a generic discriminant, but the check above proves it.
    const notYet = state as NotYet<Status>;
    const body = typeof pendingBody === "function" ? pendingBody(notYet) : pendingBody;
    return (
      <Wrapper>
        <Eyebrow>{pendingEyebrow}</Eyebrow>
        <Heading>{pendingHeading}</Heading>
        {error && <Alert>{error}</Alert>}
        <Muted>{body}</Muted>
      </Wrapper>
    );
  }

  return <>{children(state as Reached<Status>)}</>;
}
