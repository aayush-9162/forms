import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  initGoogleAuth,
  renderSignInButton,
  promptOneTap,
  disableAutoSelect,
  getStoredCredential,
  storeCredential,
  clearCredential,
  decodeCredential,
} from '../lib/google.js'
import { seedAuthForSync, clearAuthForSync } from '../outbox/sync.js'
import { clearAllDrafts } from '../hooks/useDraftState.js'

const AuthContext = createContext(null)

// Derive the app's user object from a Google ID token. The `credential` /
// `exp` fields are the same shape the form/api code already reads.
function buildUser(credential) {
  if (!credential) return null
  const p = decodeCredential(credential)
  if (!p) return null
  return {
    email: p.email || '',
    name: p.name || p.email || '',
    picture: p.picture || null,
    sub: p.sub || null,
    credential,
    exp: p.exp || 0,
  }
}

export function AuthProvider({ children }) {
  const [credential, setCredential] = useState(() => getStoredCredential())
  const [authReady, setAuthReady] = useState(false)

  const user = useMemo(() => buildUser(credential), [credential])

  const acceptCredential = useCallback((token) => {
    storeCredential(token)
    setCredential(token)
  }, [])

  // Boot Google Identity Services once. The callback fires on button click,
  // One Tap, or silent auto-select for a returning user.
  useEffect(() => {
    let cancelled = false
    initGoogleAuth((token) => {
      if (!cancelled) acceptCredential(token)
    })
      .then(() => !cancelled && setAuthReady(true))
      .catch((err) => {
        console.error('[google] init failed', err)
        if (!cancelled) setAuthReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [acceptCredential])

  // Mirror the credential into IDB so the service worker can replay queued
  // submissions; clear it on sign-out / expiry.
  useEffect(() => {
    if (user?.credential && user?.exp) {
      seedAuthForSync({ credential: user.credential, exp: user.exp })
    } else {
      clearAuthForSync()
    }
  }, [user?.credential, user?.exp])

  // Google ID tokens can't be silently refreshed, so when this one expires we
  // drop the user and the app falls back to the login screen.
  useEffect(() => {
    if (!user?.exp) return
    const ms = user.exp * 1000 - Date.now()
    if (ms <= 0) {
      clearCredential()
      setCredential(null)
      return
    }
    const t = setTimeout(() => {
      clearCredential()
      setCredential(null)
    }, ms)
    return () => clearTimeout(t)
  }, [user?.exp])

  const signOut = useCallback(() => {
    // Wipe in-progress drafts so the next user of a shared browser doesn't see
    // half-finished form data.
    clearAllDrafts()
    clearCredential()
    clearAuthForSync()
    disableAutoSelect()
    setCredential(null)
  }, [])

  const value = useMemo(
    () => ({ user, authReady, renderSignInButton, promptOneTap, signOut }),
    [user, authReady, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
