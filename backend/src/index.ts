import express, { type NextFunction, type Request, type Response } from 'express'
import { isGameError } from './errors/index.js'

const app = express()
const PORT: number = Number(process.env.PORT) || 3000

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
// Mount game routes here. Keep index.ts clean — one line per feature.

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
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

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
})

export { app }
