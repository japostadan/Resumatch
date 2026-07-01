import { randomUUID } from 'node:crypto'
import type { GameView, LobbyPlayer } from '@resumatch/shared'
import { GameNotFoundError, WrongPasswordError, WrongStatusError } from '../errors/index.js'

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
}

const games = new Map<string, Game>()

function generateGameId(): string {
  let id: string
  do {
    id = Math.random().toString(36).slice(2, 8)
  } while (games.has(id))
  return id
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

export function getState(gameId: string, _playerId?: string): GameView {
  const game = requireGame(gameId)
  const players: LobbyPlayer[] = game.players.map((p) => ({
    id: p.id,
    name: p.name,
    hasSubmitted: p.statement !== undefined,
  }))
  return { status: 'LOBBY', gameId: game.id, players }
}
