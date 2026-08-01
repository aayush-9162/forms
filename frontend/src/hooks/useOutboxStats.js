import { useEffect, useState } from 'react'
import { getAll, subscribe } from '../outbox/queue.js'

export function useOutboxStats() {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    let cancelled = false
    const refresh = () =>
      getAll()
        .then((all) => {
          if (!cancelled) setEntries(all)
        })
        .catch(() => {
          /* ignore transient IDB errors */
        })

    refresh()
    const unsub = subscribe(refresh)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      unsub()
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const pending = entries.filter((e) => e.state !== 'failed')
  const failed = entries.filter((e) => e.state === 'failed')

  return {
    entries,
    pending,
    failed,
    count: pending.length,
    failedCount: failed.length,
  }
}
