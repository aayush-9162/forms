import { submitForm, SubmissionError } from '../api/submissions.js'
import {
  getAll,
  removeEntry,
  updateEntryAfterFailure,
} from './queue.js'
import { archiveSubmission } from './archive.js'
import { getStoredCredential, decodeCredential } from '../lib/google.js'

const IDLE_INTERVAL_MS = 30_000
const LOG_PREFIX = '[outbox]'

let loopTimer = null
let draining = false
let started = false

function log(...args) {
  console.log(LOG_PREFIX, ...args)
}

// Build the "user" shape archiveSubmission records, decoded from the Google
// ID token itself.
function snapshotUser(credential) {
  const p = credential && decodeCredential(credential)
  if (!p) return null
  return {
    email: p.email,
    name: p.name || p.email,
    credential,
    exp: p.exp,
  }
}

// Stored file entries carry { blob, name, type } so we can faithfully
// reconstruct File objects with their original filenames on retry.
function reconstructFiles(stored) {
  if (!stored) return null
  const out = {}
  for (const [field, items] of Object.entries(stored)) {
    if (!Array.isArray(items) || !items.length) continue
    out[field] = items
      .map((item) => {
        if (item instanceof File) return item
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

export async function drain({ force = false } = {}) {
  if (draining) {
    log('drain already in progress, skipping')
    return
  }
  draining = true
  try {
    if (!navigator.onLine) {
      log('browser is offline, will retry on reconnect')
      return
    }
    // Google ID tokens can't be refreshed, so we just use the stored one.
    // getStoredCredential() returns null once it's expired — the drain then
    // no-ops until the user signs in again and a fresh token is stored.
    const credential = getStoredCredential()
    if (!credential) {
      log('no valid Google credential — skipping drain until next sign-in')
      return
    }
    const user = snapshotUser(credential)

    const entries = await getAll()
    if (entries.length === 0) return

    const now = Date.now()
    // When forced (user clicked "Retry now"), bypass backoff for non-terminal
    // entries. The next failure will reset backoff from the current attempt count.
    const due = entries.filter((e) => {
      if (e.state === 'failed') return false
      if (force) return true
      return (e.nextAttempt || 0) <= now
    })
    log(
      `draining ${due.length}/${entries.length} entries${force ? ' (forced)' : ' (rest waiting for backoff or terminally failed)'}`
    )

    for (const entry of due) {
      try {
        log(
          `trying ${entry.formKey} (id=${entry.id}, attempt=${(entry.attempts || 0) + 1})`
        )
        const result = await submitForm({
          formKey: entry.formKey,
          fields: entry.fields,
          files: reconstructFiles(entry.files),
          credential,
          idempotencyKey: entry.idempotencyKey || undefined,
        })
        // Now that the server has accepted the data, drop a copy into the
        // 24h archive — same as a fresh successful submit would.
        archiveSubmission({
          formKey: entry.formKey,
          fields: entry.fields,
          files: entry.files,
          submittedBy: user,
          serverId: result?.id || null,
          status: 'submitted',
        })
        await removeEntry(entry.id)
        log(`✓ sent ${entry.formKey} (id=${entry.id}), removed from outbox`)
      } catch (err) {
        const terminal =
          err instanceof SubmissionError && !err.transient
        log(
          `${terminal ? '⨯ TERMINAL' : '✗ transient'} ${entry.formKey} (id=${entry.id}): ${err.message}`
        )
        await updateEntryAfterFailure(entry, err, { terminal })
      }
    }
  } finally {
    draining = false
  }
}

function scheduleLoop() {
  if (loopTimer) clearTimeout(loopTimer)
  loopTimer = setTimeout(() => {
    drain().finally(scheduleLoop)
  }, IDLE_INTERVAL_MS)
}

export function startRetryLoop() {
  if (started) return
  started = true
  log('retry loop started')

  setTimeout(() => {
    drain().finally(scheduleLoop)
  }, 1500)

  window.addEventListener('online', () => {
    log('browser came online — draining')
    drain()
  })
  window.addEventListener('focus', () => drain())
}

export function retryNow() {
  log('manual retry triggered — bypassing backoff')
  drain({ force: true })
}
