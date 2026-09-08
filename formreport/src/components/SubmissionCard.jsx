import { formatValue, formatDateTime } from './formatters.js'

// One submission rendered as an attractive card for the date view. Shows the
// submitter + the form's key columns; click opens the full DetailDrawer.
function SubmissionCard({ form, row, bodyColumns, gradient, onClick }) {
  const initial = (row.submitted_by_name || row.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <button
      type="button"
      onClick={() => onClick(row)}
      className="group text-left bg-white rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
    >
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* header */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold shrink-0`}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 truncate">
              {row.submitted_by_name || '—'}
            </div>
            <div className="text-xs text-slate-500 truncate">{row.email}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] font-semibold text-slate-400">
              #{row.id}
            </div>
          </div>
        </div>

        {/* key fields */}
        {bodyColumns.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {bodyColumns.map((c) => {
              const v = row[c.key]
              const display =
                v && typeof v === 'object' ? '—' : formatValue(v, c.type)
              return (
                <div key={c.key} className="min-w-0">
                  <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                    {c.label}
                  </dt>
                  <dd className="text-sm text-slate-800 font-medium truncate">
                    {display}
                  </dd>
                </div>
              )
            })}
          </dl>
        )}

        {/* footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Submitted {formatDateTime(row.created_at)}
          </span>
          <span className="text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
            View details →
          </span>
        </div>
      </div>
    </button>
  )
}

export default SubmissionCard
