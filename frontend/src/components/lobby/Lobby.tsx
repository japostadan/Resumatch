// Placeholder for the Lobby waiting view. Slice B2 (#18) navigates here after a
// player submits their statement; the live Host dashboard and Player waiting
// view (with polling) are built in Slice B3 (#19).
export function Lobby() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="w-full max-w-md">
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">You&apos;re set</p>
        <h1 className="mt-4 font-display text-4xl font-black tracking-tight">
          Waiting for the host
        </h1>
        <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
          Your statement is in. The live lobby opens in the next slice — keep this tab open.
        </p>
      </div>
    </div>
  );
}
