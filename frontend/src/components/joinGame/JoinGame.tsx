import { useState, type FormEvent } from 'react'

import { joinGame } from '../../lib/api'
import { useGameSession } from '../../hooks/useGameSession'


 export function JoinGame() {
  const [gameId, setGameId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
 const { setPlayerToken } = useGameSession()

async function handleSubmit(event: FormEvent) {
  event.preventDefault()

  if (gameId.trim() === '') {
    setError('Enter a game ID')
    return
  }

  if (playerName.trim() === '') {
    setError('Enter your name')
    return
  }

  if (password.trim() === '') {
    setError('Enter the game password')
    return
  }

setError(null)
setSubmitting(true)

try {
  const result = await joinGame(gameId, playerName, password)

  setPlayerToken(result.playerToken)

  window.location.assign(`/game/${gameId}/submit`)
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : 'Could not join the game.',
  )
} finally {
  setSubmitting(false)
}

}

return (
  <div className="flex min-h-screen flex-col items-center justify-center px-8">
    <div className="w-full max-w-md">
      <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
        Join a game
      </p>

      <h1 className="mt-4 font-display text-4xl font-black tracking-tight">
        Join a game
      </h1>

      <form
        className="mt-9 flex flex-col gap-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold tracking-wide text-ink">
            Game ID
          </span>

          <input
            type="text"
            value={gameId}
            onChange={(event) => setGameId(event.target.value)}
            className="border-2 border-line bg-surface px-4 py-3 text-lg font-medium text-ink outline-none focus:border-violet"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold tracking-wide text-ink">
            Your name
          </span>

          <input
            type="text"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            className="border-2 border-line bg-surface px-4 py-3 text-lg font-medium text-ink outline-none focus:border-violet"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold tracking-wide text-ink">
            Game password
          </span>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border-2 border-line bg-surface px-4 py-3 text-lg font-medium text-ink outline-none focus:border-violet"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm font-bold text-generic">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="border-2 border-cta bg-cta px-6 py-3.5 text-base font-bold text-white disabled:opacity-60"
        >
          {submitting ? 'Joining…' : 'Join game'}
        </button>
      </form>
    </div>
  </div>
)
 }

 