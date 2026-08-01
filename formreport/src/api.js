import { getStoredCredential, clearCredential } from './lib/google.js'

// Empty base = same-origin relative calls. Set VITE_API_URL only for Vite dev
// (report on 7802 hitting the API on 7800); when Express serves the built app
// under /report, leave it unset so requests follow the serving origin.
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || ''

async function request(path) {
  // The Google ID token is attached as a bearer. getStoredCredential() returns
  // null once it's expired (Google tokens can't be silently refreshed).
  const credential = getStoredCredential()
  const headers = credential ? { Authorization: `Bearer ${credential}` } : {}
  const res = await fetch(`${API_BASE}${path}`, { headers })
  if (res.status === 401) {
    // Token missing/expired/invalid — clear it and reload so the app shows the
    // sign-in screen instead of getting stuck.
    clearCredential()
    window.location.reload()
    throw new Error('Session expired — redirecting to sign in.')
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (data?.error) msg = data.error
    } catch {
      /* non-JSON */
    }
    throw new Error(msg)
  }
  return res.json()
}

export function fetchSummary() {
  return request('/api/reports/summary')
}

export function fetchSubmissions(formKey, { limit = 200, offset = 0 } = {}) {
  const qs = new URLSearchParams({ limit, offset }).toString()
  return request(`/api/reports/${formKey}?${qs}`)
}

export function fetchSubmission(formKey, id) {
  return request(`/api/reports/${formKey}/${id}`)
}
