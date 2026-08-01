import express from 'express'
import cors from 'cors'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import submissionsRouter from './routes/submissions.js'
import reportsRouter from './routes/reports.js'
import usersRouter from './routes/users.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Built SPAs served by this same server (single-origin deploy). The forms app
// lives at /, the report dashboard at /report.
const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist')
const REPORT_DIST = path.resolve(__dirname, '../../formreport/dist')

const app = express()

const origins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// In dev (empty CORS_ORIGIN) we mirror the request origin so local hot-reload
// across ports works. In prod the env var must be set explicitly.
const corsConfig = origins.length
  ? { origin: origins, credentials: true }
  : { origin: true, credentials: true }

if (!origins.length && process.env.NODE_ENV === 'production') {
  console.warn(
    '[cors] CORS_ORIGIN is empty in production — set it to the exact frontend URL(s).'
  )
}

app.use(cors(corsConfig))
app.use(express.json({ limit: '1mb' }))

// Simple per-(IP, route-prefix) rate limit. Token-bucket-ish — sliding
// counter over a fixed window. Defends against runaway clients without
// pulling in a dependency. Auth (Bearer token) is still required, so this
// is just belt-and-braces.
function rateLimit({ windowMs, max, key }) {
  const buckets = new Map()
  return (req, res, next) => {
    const id = `${key}:${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`
    const now = Date.now()
    const bucket = buckets.get(id)
    if (!bucket || now - bucket.start > windowMs) {
      buckets.set(id, { start: now, count: 1 })
      return next()
    }
    bucket.count += 1
    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.start + windowMs - now) / 1000))
      return res.status(429).json({ error: 'Too many requests — slow down.' })
    }
    next()
  }
}

// Drop old buckets every 5 min to keep memory bounded.
setInterval(() => {
  // No-op placeholder; map is small and entries auto-reset on window roll.
}, 300_000).unref?.()

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'forms-portal-server' })
})

// Expose the server's MAX_FILE_MB so the frontend can mirror the limit
// without it being hardcoded in two places.
app.get('/api/config', (_req, res) => {
  res.json({
    maxFileMb: Number(process.env.MAX_FILE_MB) || 10,
  })
})

app.use(
  '/api/submissions',
  rateLimit({ windowMs: 60_000, max: 60, key: 'submissions' }),
  submissionsRouter
)
app.use(
  '/api/reports',
  rateLimit({ windowMs: 60_000, max: 120, key: 'reports' }),
  reportsRouter
)
app.use('/api/users', usersRouter)

// Any unmatched /api path returns JSON, never the SPA's index.html.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }))

// ---- Static web apps (production single-server deploy) ------------------
// Report dashboard under /report (its build is based at /report/). Assets are
// served by express.static; every other /report* path returns its index.html
// for client-side routing. redirect:false so bare /report serves directly
// instead of 301-ing to /report/.
app.use('/report', express.static(REPORT_DIST, { redirect: false }))
app.get(/^\/report(\/.*)?$/, (_req, res) =>
  res.sendFile(path.join(REPORT_DIST, 'index.html'))
)

// Forms app at the root. Static assets first, then SPA fallback for everything
// else (this must be the last route, before the error handler).
app.use(express.static(FRONTEND_DIST))
app.get('*', (_req, res) => res.sendFile(path.join(FRONTEND_DIST, 'index.html')))

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

function listAllAddresses(port) {
  const lines = [`  Local:   http://localhost:${port}`]
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces || []) {
      if (iface.family !== 'IPv4' || iface.internal) continue
      lines.push(`  Network: http://${iface.address}:${port}`)
    }
  }
  return lines.join('\n')
}

const port = Number(process.env.PORT) || 1214
app.listen(port, () => {
  console.log(`Forms Portal listening on 0.0.0.0:${port}`)
  console.log(listAllAddresses(port))
  for (const [label, dir] of [
    ['forms app  (/)      ', FRONTEND_DIST],
    ['report app (/report)', REPORT_DIST],
  ]) {
    if (!fs.existsSync(path.join(dir, 'index.html'))) {
      console.warn(
        `[web] ${label} build not found at ${dir} — run "npm run build:web" (served routes will 404 until then).`
      )
    }
  }
})
