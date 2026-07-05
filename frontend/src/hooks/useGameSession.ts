import { useCallback } from 'react'

export function useGameSession() {
  const getToken = useCallback((key: string) => {
    const params = new URLSearchParams(window.location.hash.slice(1))

    return params.get(key)
  }, [])

  const setToken = useCallback((key: string, token: string) => {
    const params = new URLSearchParams(window.location.hash.slice(1))

    params.set(key, token)

    window.location.hash = params.toString()
  }, [])

  return {
    getPlayerToken: () => getToken('playerToken'),
    setPlayerToken: (token: string) => setToken('playerToken', token),

    getHostToken: () => getToken('hostToken'),
    setHostToken: (token: string) => setToken('hostToken', token),
  }
}
