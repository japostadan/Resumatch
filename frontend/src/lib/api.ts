export type CreatedGame = {
  gameId: string
  hostToken: string
}

// Requests go to the relative /api path; the Vite dev server proxies it to the
// backend (see vite.config.ts), and the deployed site does the same.
export async function createGame(password: string): Promise<CreatedGame> {
  const res = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Could not create the game. Please try again.')
  }
  return res.json()
}
