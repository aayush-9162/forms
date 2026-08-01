import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useOutboxStats } from '../hooks/useOutboxStats.js'
import { retryNow } from '../outbox/retrier.js'
import { removeEntry } from '../outbox/queue.js'

function OutboxBadge() {
  const { failed, count, failedCount } = useOutboxStats()
  const [showFailed, setShowFailed] = useState(false)

  if (count === 0 && failedCount === 0) return null

  return (
    <>
      <div className="flex items-center gap-2">
        {count > 0 && (
          <button
            type="button"
            onClick={() => retryNow()}
            title="Submissions waiting to sync. Click to retry now."
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 hover:bg-amber-100 hover:border-amber-300 transition-all"
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              {count} pending{count > 1 ? ' syncs' : ' sync'}
            </span>
          </button>
        )}
        {failedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowFailed(true)}
            title="Submissions the server rejected. Click to review."
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-full px-3 py-1.5 hover:bg-rose-100 hover:border-rose-300 transition-all"
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              {failedCount} failed
            </span>
          </button>
        )}
      </div>
      {showFailed &&
        createPortal(
          <FailedSubmissionsModal
            failed={failed}
            onClose={() => setShowFailed(false)}
          />,
          document.body
        )}
    </>
  )
}

function FailedSubmissionsModal({ failed, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Failed submissions
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              The server rejected these. Retries won&apos;t help — discard them
              once you&apos;ve noted the problem.
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
          {failed.map((entry) => (
            <div
              key={entry.id}
              className="border border-rose-200 bg-rose-50 rounded-lg p-3"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {entry.formKey}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline shrink-0"
                >
                  Discard
                </button>
              </div>
              <p className="text-xs text-rose-800 break-words">
                {entry.lastError || 'Unknown error'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Saved {new Date(entry.createdAt).toLocaleString()} · attempts:{' '}
                {entry.attempts || 0}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OutboxBadge
