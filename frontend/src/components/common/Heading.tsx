import { useEffect, useRef } from "react";
import { HeadingAccent } from "./motifs";

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
    <>
      <HeadingAccent className="glow mt-4 text-violet" />
      {/* No visible focus ring: the focus-on-mount above is for screen
       * readers, not a manual tab stop sighted/keyboard users land on, so a
       * highlighted box here would read as a spurious highlight. */}
      <h1
        ref={ref}
        tabIndex={-1}
        className="glow-text mt-4 font-display text-4xl font-black tracking-tight focus:outline-none"
      >
        {children}
      </h1>
    </>
  );
}
