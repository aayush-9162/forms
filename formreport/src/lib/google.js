// Google Identity Services (GIS) helper. Loads the GIS script, holds the
// current ID token ("credential"), and exposes sign-in / sign-out. This
// replaces the Keycloak adapter — auth is once again "Sign in with Google".
//
// The credential is a JWT ID token that the API verifies with
// google-auth-library. Google ID tokens last ~1 hour and CANNOT be silently
// refreshed, so on expiry the app falls back to the login screen.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const STORAGE_KEY = 'formreport.google.credential'

let scriptPromise = null

function loadScript() {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () =>
      reject(new Error('Could not load Google Identity Services'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

// Decode a JWT payload (base64url, UTF-8 safe) without verifying — display
// only. The server does the real cryptographic verification.
export function decodeCredential(token) {
  try {
    let b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function isExpired(token) {
  const p = decodeCredential(token)
  return !p?.exp || p.exp * 1000 <= Date.now()
}

export function getStoredCredential() {
  const token = localStorage.getItem(STORAGE_KEY)
  if (!token) return null
  if (isExpired(token)) {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
  return token
}

export function storeCredential(token) {
  try {
    localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // storage full / disabled — auth still works for the current tab
  }
}

export function clearCredential() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

// Initialize GIS with a callback that fires whenever Google hands us a new
// ID token (button click, One Tap, or auto-select on a return visit).
export async function initGoogleAuth(onCredential) {
  if (!CLIENT_ID) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not set')
  }
  await loadScript()
  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (resp) => resp?.credential && onCredential(resp.credential),
    auto_select: true,
    cancel_on_tap_outside: false,
    context: 'signin',
    ux_mode: 'popup',
  })
}

export function renderSignInButton(el, options = {}) {
  if (!window.google?.accounts?.id || !el) return
  window.google.accounts.id.renderButton(el, {
    type: 'standard',
    theme: 'filled_blue',
    size: 'large',
    text: 'signin_with',
    shape: 'pill',
    width: 280,
    ...options,
  })
}

export function promptOneTap() {
  window.google?.accounts?.id?.prompt()
}

export function disableAutoSelect() {
  window.google?.accounts?.id?.disableAutoSelect()
}
