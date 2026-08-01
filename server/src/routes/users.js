import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { requireGoogleAuth } from '../auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// App-managed user list, stored as a JSON file next to the server. This is a
// simple directory of email → role, edited from the Users tab in the report
// dashboard. It is NOT an auth source — the API still authenticates every
// request with Google. gitignored so deploys don't clobber it.
const DATA_DIR = path.resolve(__dirname, '../../data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

function readUsers() {
  try {
    const parsed = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeUsers(users) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

const router = Router()
router.use(requireGoogleAuth)

// Whole-list read.
router.get('/', (_req, res) => {
  res.json({ users: readUsers() })
})

// Whole-list replace (the Users tab sends the full edited array on Save).
router.put('/', (req, res) => {
  const incoming = req.body?.users
  if (!Array.isArray(incoming)) {
    return res.status(400).json({ error: 'Body must be { users: [...] }' })
  }
  const seen = new Set()
  const clean = []
  for (const u of incoming) {
    const email = String(u?.email || '')
      .trim()
      .toLowerCase()
    if (!email || seen.has(email)) continue
    // basic email shape check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue
    seen.add(email)
    clean.push({
      email,
      name: String(u?.name || '').trim(),
      role: String(u?.role || '').trim(),
    })
  }
  writeUsers(clean)
  res.json({ ok: true, users: clean })
})

export default router
