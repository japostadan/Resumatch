import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { startGame, submitStatement } from '../store/index.js'

describe('POST /api/games', () => {
  it('creates a game and returns a Game ID and Host Token', async () => {
    const res = await request(app).post('/api/games').send({ password: 'secret' })

    expect(res.status).toBe(201)
    expect(typeof res.body.gameId).toBe('string')
    expect(res.body.gameId).toBeTruthy()
    expect(typeof res.body.hostToken).toBe('string')
    expect(res.body.hostToken).toBeTruthy()
  })

  it('rejects a missing password with a 400 and a clear error', async () => {
    const res = await request(app).post('/api/games').send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('A password is required')
  })

  it('rejects an empty password with a 400', async () => {
    const res = await request(app).post('/api/games').send({ password: '' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('A password is required')
  })

  it('rejects a whitespace-only password with a 400', async () => {
    const res = await request(app).post('/api/games').send({ password: '   ' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('A password is required')
  })

  it('rejects a non-string password with a 400', async () => {
    const res = await request(app).post('/api/games').send({ password: 123 })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('A password is required')
  })

  it('rejects a malformed JSON body with a 400 rather than a 500', async () => {
    const res = await request(app)
      .post('/api/games')
      .set('Content-Type', 'application/json')
      .send('{ not valid json')

    expect(res.status).toBe(400)
    expect(typeof res.body.error).toBe('string')
  })
})

describe('POST /api/games/:id/join', () => {
  it('joins a game with the correct password', async () => {
    const createRes = await request(app)
      .post('/api/games')
      .send({ password: 'secret' })

    const gameId = createRes.body.gameId

    const joinRes = await request(app)
      .post(`/api/games/${gameId}/join`)
      .send({
        playerName: 'Alice',
        password: 'secret',
      })

    expect(joinRes.status).toBe(200)
    expect(typeof joinRes.body.playerId).toBe('string')
    expect(joinRes.body.playerId).toBeTruthy()
    expect(typeof joinRes.body.playerToken).toBe('string')
    expect(joinRes.body.playerToken).toBeTruthy()
  })

  it('rejects an incorrect password', async () => {
    const createRes = await request(app)
      .post('/api/games')
      .send({ password: 'secret' })

    const gameId = createRes.body.gameId

    const joinRes = await request(app)
      .post(`/api/games/${gameId}/join`)
      .send({
        playerName: 'Alice',
        password: 'wrong-password',
      })

    expect(joinRes.status).toBe(403)
    expect(joinRes.body.error).toBe('Wrong password')
  })

it('rejects joining an ACTIVE game', async () => {
  const createRes = await request(app)
    .post('/api/games')
    .send({ password: 'secret' })

  const { gameId, hostToken } = createRes.body

  const alice = await request(app)
    .post(`/api/games/${gameId}/join`)
    .send({
      playerName: 'Alice',
      password: 'secret',
    })

  const bob = await request(app)
    .post(`/api/games/${gameId}/join`)
    .send({
      playerName: 'Bob',
      password: 'secret',
    })

  submitStatement(gameId, alice.body.playerToken, 'I like cats')
  submitStatement(gameId, bob.body.playerToken, 'I like dogs')

  startGame(gameId, hostToken)

  const joinRes = await request(app)
    .post(`/api/games/${gameId}/join`)
    .send({
      playerName: 'Charlie',
      password: 'secret',
    })

  expect(joinRes.status).toBe(409)
 
})
  
})
