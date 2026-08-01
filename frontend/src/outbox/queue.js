import {
  addEntry,
  putEntry,
  getAllEntries,
  deleteEntry,
  countEntries,
} from './db.js'
import { requestBackgroundSync, pingServiceWorkerDrain } from './sync.js'

const listeners = new Set()

function notify() {
  for (const cb of listeners) {
    try {
      cb()
    } catch {
      /* listener exceptions must not block notification */
    }
  }
}

export function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getCount() {
  return countEntries()
}

export function getAll() {
  return getAllEntries()
}

// Normalize file map to an array-per-field shape for storage. Each item
// keeps its original filename + mime so retries / SW replays don't end up
// with generic "attachment_0" names server-side.
function normalizeFiles(files) {
  if (!files) return null
  const out = {}
  for (const [field, value] of Object.entries(files)) {
    if (!value) continue
    const arr = Array.isArray(value) ? value.filter(Boolean) : [value]
    if (arr.length) {
      out[field] = arr.map((f) => ({
        blob: f instanceof Blob ? f : null,
        name: f?.name || 'attachment',
        type: f?.type || 'application/octet-stream',
      }))
    }
  }
  return Object.keys(out).length ? out : null
}

export async function enqueueSubmission({
  formKey,
  fields,
  files,
  idempotencyKey,
}) {
  const entry = {
    formKey,
    fields: fields || {},
    files: normalizeFiles(files),
    idempotencyKey: idempotencyKey || null,
    attempts: 0,
    lastError: '',
    state: 'pending', // 'pending' | 'failed' (terminal)
    createdAt: Date.now(),
    nextAttempt: Date.now(),
  }
  const id = await addEntry(entry)
  console.log(`[outbox] enqueued ${formKey} (id=${id})`)
  notify()

  // Hand off to the Service Worker so retries happen even after the tab
  // closes. If the browser doesn't support Background Sync, the in-tab
  // retrier is still running and will eventually replay the entry.
  const handledBySW = await requestBackgroundSync()
  if (handledBySW) {
    // Nudge the SW to try once right now too.
    pingServiceWorkerDrain()
  }

  return id
}

export async function updateEntryAfterFailure(entry, error, opts = {}) {
  entry.attempts = (entry.attempts || 0) + 1
  entry.lastError = error?.message || String(error)
  if (opts.terminal) {
    entry.state = 'failed'
    entry.nextAttempt = Number.POSITIVE_INFINITY
  } else {
    entry.nextAttempt = Date.now() + backoffDelay(entry.attempts)
  }
  await putEntry(entry)
  notify()
}

export async function removeEntry(id) {
  await deleteEntry(id)
  notify()
}

// Exponential-ish backoff capped at 1 hour.
// Attempt 1 → 10s, 2 → 30s, 3 → 2m, 4 → 5m, 5 → 15m, 6+ → 1h.
function backoffDelay(attempts) {
  const steps = [10_000, 30_000, 120_000, 300_000, 900_000, 3_600_000]
  return steps[Math.min(attempts - 1, steps.length - 1)] || steps[0]
}
