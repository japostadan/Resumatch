import express, { type NextFunction, type Request, type Response } from 'express'
import { isGameError } from './errors/index.js'
import { createGame } from './store/index.js'

const app = express()

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json())

app.use((_req, res, next) => {
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Host-Token, X-Player-Token')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  next()
})

app.options(/.*/, (_req, res) => {
  res.sendStatus(204)
})

app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

// ── Routes ──────────────────────────────────────────────────────────────────
// Mount game routes here. Keep this file clean — one line per feature.

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/api/games', (req, res) => {
  const { password } = req.body ?? {}
  res.status(201).json(createGame(password))
})

// ── Error handler (must be last) ────────────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (isGameError(err)) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

export { app }
