import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  listArchive,
  removeArchiveEntry,
  clearAllArchive,
  subscribeArchive,
  ARCHIVE_TTL_MS,
} from '../outbox/archive.js'

function formatDateTime(ms) {
  if (!ms) return '—'
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return '—'
  }
}

function formatRemaining(expiresAt) {
  const ms = (expiresAt || 0) - Date.now()
  if (ms <= 0) return 'expired'
  const hours = Math.floor(ms / 3600_000)
  const mins = Math.floor((ms % 3600_000) / 60_000)
  if (hours > 0) return `expires in ${hours}h ${mins}m`
  return `expires in ${mins}m`
}

export default function ArchiveButton() {
  const [entries, setEntries] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const refresh = () =>
      listArchive().then((all) => {
        if (!cancelled) setEntries(all)
      })
    refresh()
    const unsub = subscribeArchive(refresh)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      unsub()
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const count = entries.length
  if (count === 0 && !open) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`${count} submission${count === 1 ? '' : 's'} kept locally for 24 hours`}
        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 hover:bg-emerald-100 hover:border-emerald-300 transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 8v13H3V8" />
          <path d="M1 3h22v5H1z" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
        <span>
          {count} recent
        </span>
      </button>
      {open &&
        createPortal(
          <ArchiveModal
            entries={entries}
            onClose={() => setOpen(false)}
          />,
          document.body
        )}
    </>
  )
}

function ArchiveModal({ entries, onClose }) {
  const ttlHours = Math.round(ARCHIVE_TTL_MS / 3600_000)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent submissions
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Local backup of every form you submitted in the last {ttlHours}{' '}
              hours. Auto-deleted after that. Lives only in this browser.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-3 flex-1">
          {entries.length === 0 ? (
            <div className="text-center text-slate-500 py-10">
              No submissions in the last {ttlHours} hours.
            </div>
          ) : (
            entries.map((entry) => (
              <ArchiveEntryCard key={entry.id} entry={entry} />
            ))
          )}
        </div>
        {entries.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Delete all local copies? Server data is unaffected. This only clears the backup in this browser.'
                  )
                ) {
                  clearAllArchive()
                }
              }}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ArchiveEntryCard({ entry }) {
  const [expanded, setExpanded] = useState(false)
  const json = useMemo(
    () =>
      JSON.stringify(
        {
          formKey: entry.formKey,
          serverId: entry.serverId,
          status: entry.status,
          submittedBy: entry.submittedBy,
          submittedAt: entry.submittedAt,
          fields: entry.fields,
          files: entry.files,
        },
        null,
        2
      ),
    [entry]
  )

  const handleCopy = () => {
    navigator.clipboard
      ?.writeText(json)
      .then(() => alert('Copied to clipboard.'))
      .catch(() => alert('Copy failed — your browser may block clipboard access.'))
  }

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entry.formKey}-${entry.id}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900 truncate mb-0.5">
            {entry.formKey}
          </div>
          <div className="text-xs text-slate-500">
            {formatDateTime(entry.submittedAt)}
            {entry.serverId ? ` · Server ID #${entry.serverId}` : ''}
            {' · '}
            {formatRemaining(entry.expiresAt)}
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50/50">
          <pre className="text-xs text-slate-700 p-4 overflow-auto max-h-72 whitespace-pre-wrap break-words font-mono">
            {json}
          </pre>
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
            >
              Copy JSON
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
            >
              Download
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Delete this local copy? Server data is unaffected.')) {
                  removeArchiveEntry(entry.id)
                }
              }}
              className="ml-auto text-xs font-semibold text-rose-700 hover:text-rose-900 underline"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
