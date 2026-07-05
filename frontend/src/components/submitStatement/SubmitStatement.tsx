// Placeholder for the Submit Statement screen. Slice B1 (#17) navigates here
// after a player joins; the statement form itself is built in Slice B2 (#18).
export function SubmitStatement() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="w-full max-w-md">
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">You&apos;re in</p>
        <h1 className="mt-4 font-display text-4xl font-black tracking-tight">
          Submit your statement
        </h1>
        <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
          The statement form opens in the next slice. Keep this tab open — your session is saved.
        </p>
      </div>
    </div>
  );
}
