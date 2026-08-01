const DB_NAME = 'forms-portal-outbox'
const DB_VERSION = 3
const SUBMISSIONS_STORE = 'submissions'
const AUTH_STORE = 'auth'
const ARCHIVE_STORE = 'archive'

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
        // Index on expiresAt so prune scans only past-due rows.
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

// --- submissions store (outbox / pending) ---

export async function addEntry(entry) {
  const store = await storeOp(SUBMISSIONS_STORE, 'readwrite')
  return awaitReq(store.add(entry))
}

export async function putEntry(entry) {
  const store = await storeOp(SUBMISSIONS_STORE, 'readwrite')
  return awaitReq(store.put(entry))
}

export async function getAllEntries() {
  const store = await storeOp(SUBMISSIONS_STORE, 'readonly')
  return awaitReq(store.getAll())
}

export async function deleteEntry(id) {
  const store = await storeOp(SUBMISSIONS_STORE, 'readwrite')
  return awaitReq(store.delete(id))
}

export async function countEntries() {
  const store = await storeOp(SUBMISSIONS_STORE, 'readonly')
  return awaitReq(store.count())
}

// --- auth store ---

export async function setAuthValue(key, value) {
  const store = await storeOp(AUTH_STORE, 'readwrite')
  return awaitReq(store.put(value, key))
}

export async function getAuthValue(key) {
  const store = await storeOp(AUTH_STORE, 'readonly')
  return awaitReq(store.get(key))
}

export async function clearAuthStore() {
  const store = await storeOp(AUTH_STORE, 'readwrite')
  return awaitReq(store.clear())
}

// --- archive store (24h post-submit backup) ---

export async function addArchiveEntry(entry) {
  const store = await storeOp(ARCHIVE_STORE, 'readwrite')
  return awaitReq(store.add(entry))
}

export async function getAllArchive() {
  const store = await storeOp(ARCHIVE_STORE, 'readonly')
  return awaitReq(store.getAll())
}

export async function deleteArchiveEntry(id) {
  const store = await storeOp(ARCHIVE_STORE, 'readwrite')
  return awaitReq(store.delete(id))
}

export async function clearArchive() {
  const store = await storeOp(ARCHIVE_STORE, 'readwrite')
  return awaitReq(store.clear())
}

// Delete every archive entry whose expiresAt is <= now.
// Uses the expiresAt index so the scan is bounded to expired rows only.
export async function deleteExpiredArchive(now = Date.now()) {
  const store = await storeOp(ARCHIVE_STORE, 'readwrite')
  const index = store.index('expiresAt')
  const range = IDBKeyRange.upperBound(now)
  return new Promise((resolve, reject) => {
    let removed = 0
    const cursorReq = index.openCursor(range)
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result
      if (cursor) {
        cursor.delete()
        removed += 1
        cursor.continue()
      } else {
        resolve(removed)
      }
    }
    cursorReq.onerror = () => reject(cursorReq.error)
  })
}
