import { CardCorner } from "./motifs";

// The bordered card a personal statement is presented in — on the ballot, on
// the host's projected round view, and on the reveal.
export function StatementCard({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="shape-cut relative mt-6 border-2 border-line bg-surface px-5 py-4 text-lg font-medium text-ink">
      <CardCorner className="glow pointer-events-none absolute top-0 left-0 text-violet" />
      {children}
    </blockquote>
  );
}
