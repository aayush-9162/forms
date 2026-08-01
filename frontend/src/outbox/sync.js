import { setAuthValue, clearAuthStore } from './db.js'

const SYNC_TAG = 'submit-outbox'

export function supportsBackgroundSync() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'SyncManager' in window
  )
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[sw] not supported — falling back to in-tab retry loop only')
    return null
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    console.log('[sw] registered')
    return reg
  } catch (err) {
    console.warn('[sw] registration failed:', err)
    return null
  }
}

export async function requestBackgroundSync() {
  if (!supportsBackgroundSync()) return false
  try {
    const reg = await navigator.serviceWorker.ready
    if (!('sync' in reg)) return false
    await reg.sync.register(SYNC_TAG)
    console.log('[sw] background sync registered')
    return true
  } catch (err) {
    console.warn('[sw] sync register failed:', err)
    return false
  }
}

export async function seedAuthForSync({ credential, exp, apiBase }) {
  try {
    if (credential) await setAuthValue('credential', credential)
    if (exp) await setAuthValue('exp', exp)
    if (apiBase) await setAuthValue('apiBase', apiBase)
  } catch (err) {
    console.warn('[sw] could not seed auth to IDB:', err)
  }
}

export async function clearAuthForSync() {
  try {
    await clearAuthStore()
  } catch (err) {
    console.warn('[sw] could not clear auth:', err)
  }
}

export function pingServiceWorkerDrain() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready
    .then((reg) => {
      if (reg.active) {
        reg.active.postMessage({ type: 'drain' })
      }
    })
    .catch(() => {})
}
