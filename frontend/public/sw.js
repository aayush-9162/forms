// Forms Portal service worker
// Handles Background Sync retries of queued form submissions after failures.
// Runs even when no tab is open (Chrome/Edge/Opera). Classic worker — no ES modules.

const DB_NAME = 'forms-portal-outbox'
const DB_VERSION = 3
const SUBMISSIONS_STORE = 'submissions'
const AUTH_STORE = 'auth'
const ARCHIVE_STORE = 'archive'
const ARCHIVE_TTL_MS = 24 * 60 * 60 * 1000
const SYNC_TAG = 'submit-outbox'
const LOG = '[sw]'

// Mirror of retrier.js — keep in sync.
const BACKOFF_STEPS = [10_000, 30_000, 120_000, 300_000, 900_000, 3_600_000]

function backoffDelay(attempts) {
  return (
    BACKOFF_STEPS[Math.min(attempts - 1, BACKOFF_STEPS.length - 1)] ||
    BACKOFF_STEPS[0]
  )
}

function isTerminalStatus(status) {
  // Mirror api/submissions.js: 401/408/429/5xx are transient; other 4xx are
  // terminal (server rejected the data — retrying will keep failing).
  if (status === 0 || status === 401 || status === 408 || status === 429) {
    return false
  }
  return status >= 400 && status < 500
}

let dbPromise

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(SUBMISSIONS_STORE)) {
        db.createObjectStore(SUBMISSIONS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        })
      }
      if (!db.objectStoreNames.contains(AUTH_STORE)) {
        db.createObjectStore(AUTH_STORE)
      }
      if (!db.objectStoreNames.contains(ARCHIVE_STORE)) {
        const archive = db.createObjectStore(ARCHIVE_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        })
        archive.createIndex('expiresAt', 'expiresAt')
        archive.createIndex('submittedAt', 'submittedAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function storeOp(storeName, mode) {
  return openDb().then((db) =>
    db.transaction(storeName, mode).objectStore(storeName)
  )
}

function awaitReq(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getAuthValue(key) {
  const store = await storeOp(AUTH_STORE, 'readonly')
  return awaitReq(store.get(key))
}

async function getAllSubmissions() {
  const store = await storeOp(SUBMISSIONS_STORE, 'readonly')
  return awaitReq(store.getAll())
}

async function putSubmission(entry) {
  const store = await storeOp(SUBMISSIONS_STORE, 'readwrite')
  return awaitReq(store.put(entry))
}

async function deleteSubmission(id) {
  const store = await storeOp(SUBMISSIONS_STORE, 'readwrite')
  return awaitReq(store.delete(id))
}

function summarizeFiles(stored) {
  if (!stored) return null
  const out = {}
  for (const [field, items] of Object.entries(stored)) {
    if (!Array.isArray(items) || !items.length) continue
    out[field] = items.map((item) => ({
      name: item?.name || 'attachment',
      size: item?.blob?.size || null,
      type: item?.type || item?.blob?.type || 'application/octet-stream',
    }))
  }
  return Object.keys(out).length ? out : null
}

async function addArchive(entry) {
  const store = await storeOp(ARCHIVE_STORE, 'readwrite')
  return awaitReq(store.add(entry))
}

function reconstructFiles(stored) {
  if (!stored) return null
  const out = {}
  for (const [field, items] of Object.entries(stored)) {
    if (!Array.isArray(items) || !items.length) continue
    out[field] = items
      .map((item) => {
        if (item instanceof File) {
          return item
        }
        if (item instanceof Blob) {
          return new File([item], 'attachment', { type: item.type })
        }
        if (item?.blob instanceof Blob) {
          return new File([item.blob], item.name || 'attachment', {
            type: item.type || item.blob.type || 'application/octet-stream',
          })
        }
        return null
      })
      .filter(Boolean)
  }
  return Object.keys(out).length ? out : null
}

function buildFormData(fields, files) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields || {})) {
    if (value === undefined || value === null) continue
    if (typeof value === 'object' && !(value instanceof Blob)) {
      fd.append(key, JSON.stringify(value))
    } else if (typeof value === 'boolean') {
      fd.append(key, value ? '1' : '0')
    } else {
      fd.append(key, value)
    }
  }
  if (files) {
    for (const [field, arr] of Object.entries(files)) {
      if (!Array.isArray(arr)) continue
      for (const f of arr) {
        if (!f) continue
        if (f instanceof File) {
          fd.append(field, f, f.name)
        } else if (f instanceof Blob) {
          fd.append(field, f, 'attachment')
        }
      }
    }
  }
  return fd
}

async function drainOutbox() {
  console.log(LOG, 'drainOutbox start')
  const [credential, exp, apiBase] = await Promise.all([
    getAuthValue('credential'),
    getAuthValue('exp'),
    getAuthValue('apiBase'),
  ])
  if (!credential || !exp || Date.now() / 1000 >= Number(exp)) {
    console.log(LOG, 'drain aborted: no valid credential in IDB')
    // Throw so browser reschedules once the user signs in.
    throw new Error('no-credential')
  }
  if (!apiBase) {
    console.log(LOG, 'drain aborted: apiBase missing in IDB')
    throw new Error('no-api-base')
  }
  const base = String(apiBase).replace(/\/$/, '')

  const entries = await getAllSubmissions()
  if (!entries.length) {
    console.log(LOG, 'drain: no pending entries')
    return
  }

  const now = Date.now()
  const due = entries.filter(
    (e) => e.state !== 'failed' && (e.nextAttempt || 0) <= now
  )
  console.log(
    LOG,
    `drain: ${due.length}/${entries.length} due (rest waiting for backoff or terminally failed)`
  )

  for (const entry of due) {
    try {
      const body = buildFormData(entry.fields, reconstructFiles(entry.files))
      const headers = { Authorization: `Bearer ${credential}` }
      if (entry.idempotencyKey) headers['Idempotency-Key'] = entry.idempotencyKey
      const res = await fetch(`${base}/api/submissions/${entry.formKey}`, {
        method: 'POST',
        headers,
        body,
      })
      if (!res.ok) {
        let msg = `Request failed (${res.status})`
        try {
          const data = await res.json()
          if (data?.error) msg = data.error
        } catch {
          /* non-JSON error */
        }
        const err = new Error(msg)
        err.status = res.status
        throw err
      }
      let serverId = null
      try {
        const data = await res.json()
        serverId = data?.id || null
      } catch {
        /* server returned non-JSON success */
      }
      // 24h post-submit backup — same as the main thread's archiveSubmission.
      try {
        const ts = Date.now()
        await addArchive({
          formKey: entry.formKey,
          fields: entry.fields,
          files: summarizeFiles(entry.files),
          submittedBy: null,
          serverId,
          status: 'submitted',
          submittedAt: ts,
          expiresAt: ts + ARCHIVE_TTL_MS,
        })
      } catch (archiveErr) {
        console.log(LOG, 'archive write failed (non-fatal):', archiveErr.message)
      }
      await deleteSubmission(entry.id)
      console.log(LOG, `✓ sent ${entry.formKey} (id=${entry.id})`)
    } catch (err) {
      entry.attempts = (entry.attempts || 0) + 1
      entry.lastError = err.message
      if (isTerminalStatus(err.status)) {
        entry.state = 'failed'
        entry.nextAttempt = Number.POSITIVE_INFINITY
        console.log(
          LOG,
          `⨯ TERMINAL ${entry.formKey} (id=${entry.id}): ${err.message}`
        )
      } else {
        entry.nextAttempt = Date.now() + backoffDelay(entry.attempts)
        console.log(
          LOG,
          `✗ failed ${entry.formKey} (id=${entry.id}): ${err.message} — next attempt in ${Math.round((entry.nextAttempt - Date.now()) / 1000)}s`
        )
      }
      await putSubmission(entry)
    }
  }

  const remaining = (await getAllSubmissions()).filter(
    (e) => e.state !== 'failed' && Number.isFinite(e.nextAttempt)
  )
  if (remaining.length > 0) {
    console.log(
      LOG,
      `drain incomplete: ${remaining.length} still pending — rethrowing so browser reschedules`
    )
    throw new Error('some-entries-still-pending')
  }
  console.log(LOG, 'drain complete: nothing left to retry')
}

self.addEventListener('install', () => {
  console.log(LOG, 'install')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log(LOG, 'activate')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('sync', (event) => {
  console.log(LOG, `sync event: ${event.tag}`)
  if (event.tag === SYNC_TAG) {
    event.waitUntil(drainOutbox())
  }
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'drain') {
    console.log(LOG, 'drain requested via message')
    const p = drainOutbox().catch((err) => {
      console.log(LOG, 'message-drain finished with:', err?.message)
    })
    if (event.waitUntil) event.waitUntil(p)
  }
})
