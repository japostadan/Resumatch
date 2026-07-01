import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  createGame,
  joinGame,
  submitStatement,
  startGame,
  castVote,
  advanceStatement,
  getState,
} from '../store/index.js'
import {
  GameNotFoundError,
  GameExpiredError,
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

// A started 3-player game; statement text is `${name} statement` so tests
// can map the anonymous currentStatement back to its author.
function threePlayerGame() {
  const { gameId, hostToken } = createGame('secret')
  const players = ['Ada', 'Bea', 'Cy'].map((name) => ({
    name,
    ...joinGame(gameId, 'secret', name),
  }))
  players.forEach((p) => submitStatement(gameId, p.playerToken, `${p.name} statement`))
  startGame(gameId, hostToken)
  return { gameId, hostToken, players }
}

type StartedPlayer = { name: string; playerId: string; playerToken: string }

// Author of whichever statement is currently displayed.
function currentAuthor(gameId: string, players: StartedPlayer[]): StartedPlayer {
  const view = getState(gameId)
  if (view.status !== 'ACTIVE') throw new Error('expected ACTIVE')
  const author = players.find((p) => `${p.name} statement` === view.currentStatement)
  if (!author) throw new Error('no author for current statement')
  return author
}

afterEach(() => {
  vi.useRealTimers()
})

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
    expect(view.candidates.map((c) => c.name).toSorted()).toEqual(['Ada', 'Bea'])
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
    expect(view.candidates.map((c) => c.name).toSorted()).toEqual(['Ada', 'Bea'])
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

describe('advanceStatement', () => {
  it('moves to the next statement while statements remain', () => {
    const { gameId, hostToken } = startedGame()

    advanceStatement(gameId, hostToken)

    const view = getState(gameId)
    if (view.status !== 'ACTIVE') throw new Error('expected ACTIVE')
    expect(view.currentStatementIndex).toBe(1)
  })

  it('rejects a wrong host token', () => {
    const { gameId } = startedGame()

    expect(() => advanceStatement(gameId, 'not-the-host')).toThrow(BadTokenError)
  })

  it('finishes the game after the last statement', () => {
    const { gameId, hostToken } = startedGame()

    advanceStatement(gameId, hostToken) // index 0 -> 1 (last of 2)
    advanceStatement(gameId, hostToken) // past the last -> FINISHED

    const view = getState(gameId)
    expect(view.status).toBe('FINISHED')
  })

  it('rejects advancing before the game has started', () => {
    const { gameId, hostToken } = createGame('secret')

    expect(() => advanceStatement(gameId, hostToken)).toThrow(WrongStatusError)
  })
})

describe('results', () => {
  it('marks a statement Distinctive when exactly half of the voters are correct', () => {
    const { gameId, hostToken, players } = threePlayerGame()

    for (let i = 0; i < players.length; i++) {
      const author = currentAuthor(gameId, players)
      const others = players.filter((p) => p.playerId !== author.playerId)
      // one correct, one wrong → 1 of 2 = 50%
      castVote(gameId, others[0].playerToken, author.playerId)
      castVote(gameId, others[1].playerToken, others[0].playerId)
      advanceStatement(gameId, hostToken)
    }

    const view = getState(gameId)
    if (view.status !== 'FINISHED') throw new Error('expected FINISHED')
    for (const entry of view.results) {
      expect(entry.totalVotes).toBe(2)
      expect(entry.correctVotes).toBe(1)
      expect(entry.verdict).toBe('Distinctive')
    }
  })

  it('marks a statement Generic when fewer than half are correct', () => {
    const { gameId, hostToken, players } = threePlayerGame()

    for (let i = 0; i < players.length; i++) {
      const author = currentAuthor(gameId, players)
      const others = players.filter((p) => p.playerId !== author.playerId)
      // both vote for each other, neither for the author → 0 of 2
      castVote(gameId, others[0].playerToken, others[1].playerId)
      castVote(gameId, others[1].playerToken, others[0].playerId)
      advanceStatement(gameId, hostToken)
    }

    const view = getState(gameId)
    if (view.status !== 'FINISHED') throw new Error('expected FINISHED')
    for (const entry of view.results) {
      expect(entry.correctVotes).toBe(0)
      expect(entry.verdict).toBe('Generic')
    }
  })
})

describe('24-hour expiry', () => {
  it('reports a game older than 24 hours as expired', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const { gameId } = createGame('secret')

    vi.setSystemTime(new Date('2026-01-02T00:00:01Z')) // 24h + 1s later

    expect(() => getState(gameId)).toThrow(GameExpiredError)
  })

  it('deletes the expired game so it is gone afterwards', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const { gameId } = createGame('secret')
    vi.setSystemTime(new Date('2026-01-02T00:00:01Z'))
    expect(() => getState(gameId)).toThrow(GameExpiredError)

    expect(() => getState(gameId)).toThrow(GameNotFoundError)
  })

  it('keeps a game alive within 24 hours', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const { gameId } = createGame('secret')

    vi.setSystemTime(new Date('2026-01-01T23:59:59Z'))

    expect(getState(gameId).status).toBe('LOBBY')
  })
})
