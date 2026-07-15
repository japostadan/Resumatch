import { useEffect, useRef } from "react";

// Every screen's title flows through this component, so focusing it on mount
// is what tells a screen-reader or keyboard user that a new screen has
// arrived — covers route transitions and StatusGate's loading/pending/active
// handoffs alike, with no per-screen wiring needed.
export function Heading({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);

  // Depending on `children` (not just mounting) matters: StatusGate-driven
  // screens like CreateGame's confirmation view and SubmitStatement's
  // round-closed view swap content at the same tree position, so React reuses
  // this <h1> instead of remounting it — a mount-only effect would silently
  // never refire and leave focus wherever it happened to land.
  useEffect(() => {
    ref.current?.focus();
  }, [children]);

  return (
    <h1
      ref={ref}
      tabIndex={-1}
      className="mt-4 font-display text-4xl font-black tracking-tight focus:outline-2 focus:outline-offset-4 focus:outline-violet"
    >
      {children}
    </h1>
  );
}
