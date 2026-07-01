import { describe, it, expect } from 'vitest'
import { createGame, joinGame, getState } from '../store/index.js'
import { GameNotFoundError, WrongPasswordError } from '../errors/index.js'

describe('createGame', () => {
  it('creates a game and returns a Game ID and Host Token', () => {
    const { gameId, hostToken } = createGame('secret')

    expect(gameId).toBeTruthy()
    expect(hostToken).toBeTruthy()
    expect(gameId).not.toBe(hostToken)
  })

  it('produces a LobbyView with no players for a freshly created game', () => {
    const { gameId } = createGame('secret')

    const view = getState(gameId)

    expect(view).toEqual({ status: 'LOBBY', gameId, players: [] })
  })
})

describe('joinGame', () => {
  it('adds a player with the correct password and lists them as not yet submitted', () => {
    const { gameId } = createGame('secret')

    const { playerId, playerToken } = joinGame(gameId, 'secret', 'Ada')

    expect(playerId).toBeTruthy()
    expect(playerToken).toBeTruthy()

    const view = getState(gameId)
    expect(view.status).toBe('LOBBY')
    if (view.status !== 'LOBBY') throw new Error('expected LOBBY')
    expect(view.players).toEqual([{ id: playerId, name: 'Ada', hasSubmitted: false }])
  })

  it('rejects a wrong password', () => {
    const { gameId } = createGame('secret')

    expect(() => joinGame(gameId, 'wrong', 'Ada')).toThrow(WrongPasswordError)
  })

  it('rejects an unknown game', () => {
    expect(() => joinGame('nope', 'secret', 'Ada')).toThrow(GameNotFoundError)
  })
})
