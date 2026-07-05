import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameSession } from './useGameSession'

afterEach(() => {
  window.location.hash = ''
})

describe('useGameSession', () => {
  it('reads the token from the URL hash', () => {
    window.location.hash = 'token=abc123'

    const { result } = renderHook(() => useGameSession())

    expect(result.current.token).toBe('abc123')
  })

  it('is null when the hash has no token', () => {
    const { result } = renderHook(() => useGameSession())

    expect(result.current.token).toBeNull()
  })

  it('writes the token to the URL hash', () => {
    const { result } = renderHook(() => useGameSession())

    act(() => result.current.setToken('written-tok'))

    expect(window.location.hash).toContain('token=written-tok')
    expect(result.current.token).toBe('written-tok')
  })
})
