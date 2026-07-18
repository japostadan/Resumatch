import type { Verdict } from "@resumatch/shared";

// Hand-coded inline SVG accents — no icon library, no third-party requests,
// matching the self-hosted-fonts constraint. Shared across Header, Heading,
// StatementCard and the results views so the shape language stays defined
// in one place.

type MotifProps = { className?: string };

export function LogoMark({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" className={className}>
      <rect x="2" y="2" width="9" height="9" fill="currentColor" />
      <path d="M11 18 18 3 18 18Z" fill="currentColor" opacity="0.65" />
    </svg>
  );
}

export function HeadingAccent({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className={className}>
      <path d="M1 1 15 8 1 15Z" fill="currentColor" />
    </svg>
  );
}

export function CardCorner({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className={className}>
      <path d="M0 0 24 0 0 24Z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

// Reinforces the colour verdict signal with a shape (circle vs triangle) so
// it doesn't read as color-only — green/red stay reserved for verdicts per
// CONTEXT.md, this is purely additive.
export function VerdictGlyph({ verdict, className }: { verdict: Verdict } & MotifProps) {
  if (verdict === "Distinctive") {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className={className}>
        <circle cx="8" cy="8" r="6.5" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className={className}>
      <path d="M8 1 15 14 1 14Z" fill="currentColor" />
    </svg>
  );
}
