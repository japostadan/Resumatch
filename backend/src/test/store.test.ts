import { describe, it, expect } from 'vitest'
import {
  createGame,
  joinGame,
  submitStatement,
  startGame,
  castVote,
  getState,
} from '../store/index.js'
import {
  GameNotFoundError,
  WrongPasswordError,
  WrongStatusError,
  BadTokenError,
  AlreadySubmittedError,
  AlreadyVotedError,
  NotEnoughPlayersError,
} from '../errors/index.js'

// A started 2-player game (Ada and Bea, both submitted), ready for voting.
function startedGame() {
  const { gameId, hostToken } = createGame('secret')
  const ada = joinGame(gameId, 'secret', 'Ada')
  const bea = joinGame(gameId, 'secret', 'Bea')
  submitStatement(gameId, ada.playerToken, 'ada statement')
  submitStatement(gameId, bea.playerToken, 'bea statement')
  startGame(gameId, hostToken)
  return { gameId, hostToken, ada, bea }
}

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

describe('submitStatement', () => {
  it('marks the player as submitted', () => {
    const { gameId } = createGame('secret')
    const { playerId, playerToken } = joinGame(gameId, 'secret', 'Ada')

    submitStatement(gameId, playerToken, 'my statement')

    const view = getState(gameId)
    if (view.status !== 'LOBBY') throw new Error('expected LOBBY')
    expect(view.players).toContainEqual({ id: playerId, name: 'Ada', hasSubmitted: true })
  })

  it('rejects an unknown token', () => {
    const { gameId } = createGame('secret')
    joinGame(gameId, 'secret', 'Ada')

    expect(() => submitStatement(gameId, 'not-a-token', 'x')).toThrow(BadTokenError)
  })

  it('rejects a second submission from the same player', () => {
    const { gameId } = createGame('secret')
    const { playerToken } = joinGame(gameId, 'secret', 'Ada')
    submitStatement(gameId, playerToken, 'first')

    expect(() => submitStatement(gameId, playerToken, 'second')).toThrow(AlreadySubmittedError)
  })
})

describe('startGame', () => {
  it('transitions to ACTIVE and shows the first statement to the host', () => {
    const { gameId, hostToken } = createGame('secret')
    const ada = joinGame(gameId, 'secret', 'Ada')
    const bea = joinGame(gameId, 'secret', 'Bea')
    submitStatement(gameId, ada.playerToken, 'ada statement')
    submitStatement(gameId, bea.playerToken, 'bea statement')

    startGame(gameId, hostToken)

    const view = getState(gameId)
    if (view.status !== 'ACTIVE') throw new Error('expected ACTIVE')
    expect(view.currentStatementIndex).toBe(0)
    expect(view.totalStatements).toBe(2)
    expect(['ada statement', 'bea statement']).toContain(view.currentStatement)
    expect(view.hasVoted).toBe(false)
    expect(view.candidates).toHaveLength(2)
    expect(view.candidates.map((c) => c.name).sort()).toEqual(['Ada', 'Bea'])
  })

  it('excludes players who did not submit a statement', () => {
    const { gameId, hostToken } = createGame('secret')
    const ada = joinGame(gameId, 'secret', 'Ada')
    const bea = joinGame(gameId, 'secret', 'Bea')
    joinGame(gameId, 'secret', 'Cy') // never submits
    submitStatement(gameId, ada.playerToken, 'ada statement')
    submitStatement(gameId, bea.playerToken, 'bea statement')

    startGame(gameId, hostToken)

    const view = getState(gameId)
    if (view.status !== 'ACTIVE') throw new Error('expected ACTIVE')
    expect(view.totalStatements).toBe(2)
    expect(view.candidates.map((c) => c.name).sort()).toEqual(['Ada', 'Bea'])
  })

  it('rejects a wrong host token', () => {
    const { gameId } = createGame('secret')
    const ada = joinGame(gameId, 'secret', 'Ada')
    const bea = joinGame(gameId, 'secret', 'Bea')
    submitStatement(gameId, ada.playerToken, 'a')
    submitStatement(gameId, bea.playerToken, 'b')

    expect(() => startGame(gameId, 'not-the-host')).toThrow(BadTokenError)
  })

  it('requires at least two submitted statements', () => {
    const { gameId, hostToken } = createGame('secret')
    const ada = joinGame(gameId, 'secret', 'Ada')
    joinGame(gameId, 'secret', 'Bea')
    submitStatement(gameId, ada.playerToken, 'only one')

    expect(() => startGame(gameId, hostToken)).toThrow(NotEnoughPlayersError)
  })

  it('excludes the requesting player from their own candidate list', () => {
    const { gameId, hostToken } = createGame('secret')
    const ada = joinGame(gameId, 'secret', 'Ada')
    const bea = joinGame(gameId, 'secret', 'Bea')
    submitStatement(gameId, ada.playerToken, 'ada statement')
    submitStatement(gameId, bea.playerToken, 'bea statement')
    startGame(gameId, hostToken)

    const view = getState(gameId, ada.playerId)
    if (view.status !== 'ACTIVE') throw new Error('expected ACTIVE')
    expect(view.candidates.map((c) => c.name)).toEqual(['Bea'])
  })

  it('rejects joining once the game has started', () => {
    const { gameId, hostToken } = createGame('secret')
    const ada = joinGame(gameId, 'secret', 'Ada')
    const bea = joinGame(gameId, 'secret', 'Bea')
    submitStatement(gameId, ada.playerToken, 'a')
    submitStatement(gameId, bea.playerToken, 'b')
    startGame(gameId, hostToken)

    expect(() => joinGame(gameId, 'secret', 'Cy')).toThrow(WrongStatusError)
  })
})

describe('castVote', () => {
  it('records a vote and marks the voter as having voted', () => {
    const { gameId, ada, bea } = startedGame()

    castVote(gameId, ada.playerToken, bea.playerId)

    const view = getState(gameId, ada.playerId)
    if (view.status !== 'ACTIVE') throw new Error('expected ACTIVE')
    expect(view.hasVoted).toBe(true)
  })

  it('rejects a second vote on the same statement', () => {
    const { gameId, ada, bea } = startedGame()
    castVote(gameId, ada.playerToken, bea.playerId)

    expect(() => castVote(gameId, ada.playerToken, bea.playerId)).toThrow(AlreadyVotedError)
  })

  it('rejects a vote with an unknown token', () => {
    const { gameId, bea } = startedGame()

    expect(() => castVote(gameId, 'not-a-token', bea.playerId)).toThrow(BadTokenError)
  })

  it('rejects a self-vote', () => {
    const { gameId, ada } = startedGame()

    expect(() => castVote(gameId, ada.playerToken, ada.playerId)).toThrow(WrongStatusError)
  })

  it('rejects a vote for an unknown nominee', () => {
    const { gameId, ada } = startedGame()

    expect(() => castVote(gameId, ada.playerToken, 'ghost')).toThrow(WrongStatusError)
  })

  it('rejects voting before the game has started', () => {
    const { gameId } = createGame('secret')
    const ada = joinGame(gameId, 'secret', 'Ada')
    const bea = joinGame(gameId, 'secret', 'Bea')

    expect(() => castVote(gameId, ada.playerToken, bea.playerId)).toThrow(WrongStatusError)
  })
})
