import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

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
    expect(typeof res.body.error).toBe('string')
  })

  it('rejects an empty password with a 400', async () => {
    const res = await request(app).post('/api/games').send({ password: '' })

    expect(res.status).toBe(400)
    expect(typeof res.body.error).toBe('string')
  })
})
