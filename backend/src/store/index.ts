import { randomUUID } from 'node:crypto'
import type { GameView, LobbyPlayer, Candidate, ResultEntry } from '@resumatch/shared'
import {
  GameNotFoundError,
  GameExpiredError,
  WrongPasswordError,
  MissingPasswordError,
  WrongStatusError,
  BadTokenError,
  AlreadySubmittedError,
  AlreadyVotedError,
  NotEnoughPlayersError,
} from '../errors/index.js'

type Player = {
  id: string
  name: string
  token: string
  statement?: string
}

type Game = {
  id: string
  password: string
  hostToken: string
  status: 'LOBBY' | 'ACTIVE' | 'FINISHED'
  players: Player[]
  createdAt: number
  statementOrder: string[]
  currentStatementIndex: number
  votes: Map<string, string>[]
}

const games = new Map<string, Game>()

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

function isExpired(game: Game): boolean {
  return Date.now() - game.createdAt > TWENTY_FOUR_HOURS_MS
}

function generateGameId(): string {
  let id: string
  do {
    id = Math.random().toString(36).slice(2, 8)
  } while (games.has(id))
  return id
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function playerById(game: Game, id: string): Player | undefined {
  return game.players.find((p) => p.id === id)
}

export function createGame(password: string): { gameId: string; hostToken: string } {
  if (typeof password !== 'string' || password.trim() === '') throw new MissingPasswordError()
  const gameId = generateGameId()
  const hostToken = randomUUID()
  games.set(gameId, {
    id: gameId,
    password,
    hostToken,
    status: 'LOBBY',
    players: [],
    createdAt: Date.now(),
    statementOrder: [],
    currentStatementIndex: 0,
    votes: [],
  })
  return { gameId, hostToken }
}

export function joinGame(
  gameId: string,
  password: string,
  name: string,
): { playerId: string; playerToken: string } {
  const game = requireGame(gameId)
  if (game.password !== password) throw new WrongPasswordError()
  if (game.status !== 'LOBBY') throw new WrongStatusError('Game has already started')
  const playerId = randomUUID()
  const playerToken = randomUUID()
  game.players.push({ id: playerId, name, token: playerToken })
  return { playerId, playerToken }
}

function requireGame(gameId: string): Game {
  const game = games.get(gameId)
  if (!game) throw new GameNotFoundError()
  if (isExpired(game)) {
    games.delete(gameId)
    throw new GameExpiredError()
  }
  return game
}

function requirePlayerByToken(game: Game, token: string): Player {
  const player = game.players.find((p) => p.token === token)
  if (!player) throw new BadTokenError()
  return player
}

export function submitStatement(gameId: string, playerToken: string, statement: string): void {
  const game = requireGame(gameId)
  const player = requirePlayerByToken(game, playerToken)
  if (player.statement !== undefined) throw new AlreadySubmittedError()
  player.statement = statement
}

export function startGame(gameId: string, hostToken: string): void {
  const game = requireGame(gameId)
  if (game.hostToken !== hostToken) throw new BadTokenError()
  const submitters = game.players.filter((p) => p.statement !== undefined)
  if (submitters.length < 2) throw new NotEnoughPlayersError()
  game.statementOrder = shuffle(submitters.map((p) => p.id))
  game.currentStatementIndex = 0
  game.votes = game.statementOrder.map(() => new Map<string, string>())
  game.status = 'ACTIVE'
}

export function castVote(gameId: string, playerToken: string, nomineeId: string): void {
  const game = requireGame(gameId)
  if (game.status !== 'ACTIVE') throw new WrongStatusError('Voting is not open')
  const voter = requirePlayerByToken(game, playerToken)
  const currentVotes = game.votes[game.currentStatementIndex]
  if (currentVotes.has(voter.id)) throw new AlreadyVotedError()
  if (nomineeId === voter.id || !game.statementOrder.includes(nomineeId)) {
    throw new WrongStatusError('Nominee is not a valid candidate')
  }
  currentVotes.set(voter.id, nomineeId)
}

export function advanceStatement(gameId: string, hostToken: string): void {
  const game = requireGame(gameId)
  if (game.hostToken !== hostToken) throw new BadTokenError()
  if (game.status !== 'ACTIVE') throw new WrongStatusError('Game is not in progress')
  game.currentStatementIndex++
  if (game.currentStatementIndex >= game.statementOrder.length) {
    game.status = 'FINISHED'
  }
}

function buildResults(game: Game): ResultEntry[] {
  return game.statementOrder.map((authorId, index) => {
    const author = playerById(game, authorId)!
    const votes = game.votes[index]
    const totalVotes = votes.size
    let correctVotes = 0
    for (const nomineeId of votes.values()) {
      if (nomineeId === authorId) correctVotes++
    }
    const verdict = totalVotes > 0 && correctVotes * 2 >= totalVotes ? 'Distinctive' : 'Generic'
    return {
      playerId: author.id,
      name: author.name,
      statement: author.statement!,
      correctVotes,
      totalVotes,
      verdict,
    }
  })
}

export function getState(gameId: string, playerId?: string): GameView {
  const game = requireGame(gameId)

  if (game.status === 'LOBBY') {
    const players: LobbyPlayer[] = game.players.map((p) => ({
      id: p.id,
      name: p.name,
      hasSubmitted: p.statement !== undefined,
    }))
    return { status: 'LOBBY', gameId: game.id, players }
  }

  if (game.status === 'FINISHED') {
    return { status: 'FINISHED', gameId: game.id, results: buildResults(game) }
  }

  const authorId = game.statementOrder[game.currentStatementIndex]
  const author = playerById(game, authorId)
  const candidates: Candidate[] = game.statementOrder
    .filter((id) => id !== playerId)
    .map((id) => {
      const player = playerById(game, id)!
      return { id: player.id, name: player.name }
    })
  const hasVoted = playerId !== undefined && game.votes[game.currentStatementIndex].has(playerId)
  return {
    status: 'ACTIVE',
    gameId: game.id,
    currentStatement: author!.statement!,
    currentStatementIndex: game.currentStatementIndex,
    totalStatements: game.statementOrder.length,
    candidates,
    hasVoted,
  }
}
