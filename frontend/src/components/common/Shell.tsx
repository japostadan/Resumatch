// `wide` widens the column for screens meant to be read from across a room
// (the host's "share this with the room" confirmation) rather than held.
export function Shell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>{children}</div>
    </div>
  );
}
