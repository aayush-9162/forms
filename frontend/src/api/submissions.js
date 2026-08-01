// Empty base = same-origin relative calls (/api/...). Set VITE_API_URL only
// when the API is on a different origin than the app (e.g. Vite dev on 7801
// hitting the API on 7800). When Express serves the built app itself, leave it
// unset so requests follow whatever host/port/IP is serving the page.
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || ''

function buildFormData(fields, files) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
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
    for (const [fieldName, fileOrList] of Object.entries(files)) {
      if (!fileOrList) continue
      if (Array.isArray(fileOrList)) {
        for (const f of fileOrList) {
          if (f) fd.append(fieldName, f)
        }
      } else {
        fd.append(fieldName, fileOrList)
      }
    }
  }
  return fd
}

// Carries the HTTP status so callers can tell terminal (4xx) errors from
// transient (network / 5xx) ones. 401 is treated as transient because the
// user can re-auth and retry; other 4xx mean the data itself is bad and a
// retry would just fail again.
export class SubmissionError extends Error {
  constructor(message, { status = 0, transient = true } = {}) {
    super(message)
    this.name = 'SubmissionError'
    this.status = status
    this.transient = transient
  }
}

export async function submitForm({
  formKey,
  fields,
  files,
  credential,
  idempotencyKey,
}) {
  if (!credential) {
    throw new SubmissionError('Not signed in — please sign in again.', {
      status: 0,
      transient: true,
    })
  }
  const body = buildFormData(fields, files)
  let res
  try {
    res = await fetch(`${API_BASE}/api/submissions/${formKey}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credential}`,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body,
    })
  } catch (err) {
    // Network-level failure (offline, DNS, CORS) — always transient.
    throw new SubmissionError(err.message || 'Network error', {
      status: 0,
      transient: true,
    })
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (data?.error) msg = data.error
    } catch {
      // non-JSON response
    }
    // 401 is transient: user can re-auth. 408 / 429 are also transient.
    // Everything else in 4xx is terminal (the request itself is bad).
    const transient =
      res.status === 0 ||
      res.status === 401 ||
      res.status === 408 ||
      res.status === 429 ||
      res.status >= 500
    throw new SubmissionError(msg, { status: res.status, transient })
  }
  return res.json()
}
