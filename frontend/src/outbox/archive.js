import {
  addArchiveEntry,
  getAllArchive,
  deleteArchiveEntry,
  clearArchive,
  deleteExpiredArchive,
} from './db.js'

export const ARCHIVE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

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

export function subscribeArchive(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// Convert any File / Blob in a files map to lightweight metadata so the
// archive can be JSON-displayed without bloating IDB with the actual file
// bytes. The originals are already in Drive.
function summarizeFiles(files) {
  if (!files) return null
  const out = {}
  for (const [field, value] of Object.entries(files)) {
    if (!value) continue
    const arr = Array.isArray(value) ? value.filter(Boolean) : [value]
    if (!arr.length) continue
    out[field] = arr.map((f) => ({
      name: f?.name || 'attachment',
      size: typeof f?.size === 'number' ? f.size : null,
      type: f?.type || 'application/octet-stream',
    }))
  }
  return Object.keys(out).length ? out : null
}

export async function archiveSubmission({
  formKey,
  fields,
  files,
  submittedBy,
  serverId = null,
  status = 'submitted', // 'submitted' (server accepted) | 'queued' (offline, will retry)
}) {
  const now = Date.now()
  const entry = {
    formKey,
    fields: fields || {},
    files: summarizeFiles(files),
    submittedBy: submittedBy
      ? { name: submittedBy.name, email: submittedBy.email }
      : null,
    serverId,
    status,
    submittedAt: now,
    expiresAt: now + ARCHIVE_TTL_MS,
  }
  try {
    const id = await addArchiveEntry(entry)
    notify()
    return id
  } catch (err) {
    console.warn('[archive] failed to add entry:', err.message || err)
    return null
  }
}

export async function listArchive() {
  try {
    const all = await getAllArchive()
    // Newest first.
    return all.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))
  } catch (err) {
    console.warn('[archive] failed to list:', err.message || err)
    return []
  }
}

export async function removeArchiveEntry(id) {
  await deleteArchiveEntry(id)
  notify()
}

export async function clearAllArchive() {
  await clearArchive()
  notify()
}

export async function pruneExpiredArchive() {
  try {
    const removed = await deleteExpiredArchive()
    if (removed > 0) {
      console.log(`[archive] pruned ${removed} expired entries`)
      notify()
    }
    return removed
  } catch (err) {
    console.warn('[archive] prune failed:', err.message || err)
    return 0
  }
}
