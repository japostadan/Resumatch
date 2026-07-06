// Placeholder for the Voting screen. Slice B4 (#20) auto-navigates here from the
// Lobby when the game becomes ACTIVE; the voting UI itself is built in Slice C.
export function Vote() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="w-full max-w-md">
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">Game on</p>
        <h1 className="mt-4 font-display text-4xl font-black tracking-tight">
          The game has started
        </h1>
        <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
          Voting opens in the next slice. Keep this tab open — the statements are being dealt out.
        </p>
      </div>
    </div>
  );
}
