import { useEffect, useState } from 'react'

const PREFIX = 'draft:'

// Drop-in replacement for useState that mirrors its value into localStorage
// so accidental refresh / tab close doesn't lose form input. Key is namespaced
// under `draft:` so we can wipe a whole form's draft with one prefix search.
//
//   const [date, setDate] = useDraftState('warehouse-notification.date', '')
//
// File / Blob values cannot be serialized — keep those on plain useState.
export function useDraftState(key, initial) {
  const fullKey = PREFIX + key
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(fullKey)
      if (raw !== null) return JSON.parse(raw)
    } catch {
      /* corrupt entry — fall through to initial */
    }
    return typeof initial === 'function' ? initial() : initial
  })

  useEffect(() => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(value))
    } catch {
      /* quota exceeded or storage disabled — silently skip persistence */
    }
  }, [fullKey, value])

  return [value, setValue]
}

// Removes every draft key for one form (e.g. all `draft:warehouse-notification.*`).
// Call after a successful submit or on explicit Reset.
export function clearFormDraft(formKey) {
  const prefix = `${PREFIX}${formKey}.`
  const toRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(prefix)) toRemove.push(k)
  }
  toRemove.forEach((k) => localStorage.removeItem(k))
}

// Removes every draft from every form. Used on sign-out so the next user
// doesn't see the previous user's in-progress data.
export function clearAllDrafts() {
  const toRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) toRemove.push(k)
  }
  toRemove.forEach((k) => localStorage.removeItem(k))
}
