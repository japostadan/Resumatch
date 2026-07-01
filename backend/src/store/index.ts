import { randomUUID } from 'node:crypto'
import type { GameView, LobbyPlayer, Candidate } from '@resumatch/shared'
import {
  GameNotFoundError,
  WrongPasswordError,
  WrongStatusError,
  BadTokenError,
  AlreadySubmittedError,
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
