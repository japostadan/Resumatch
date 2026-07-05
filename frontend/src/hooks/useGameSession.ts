import { useState } from 'react'

// The player/host token lives in the URL hash fragment (e.g. #token=abc) so a
// reload keeps the session without a database or cookies. Both the Create Game
// and Join Game flows write it; the Lobby screens read it back.
function readToken(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return params.get('token')
}

export function useGameSession() {
  const [token, setTokenState] = useState<string | null>(readToken)

  function setToken(value: string) {
    window.location.hash = `token=${value}`
    setTokenState(value)
  }

  return { token, setToken }
}
