import {
  formatDateTime,
  formatMoney,
  formatDate,
  parseJson,
} from './formatters.js'

function fieldValue(value, type) {
  if (value === null || value === undefined || value === '') return null
  switch (type) {
    case 'money':
      return <span className="font-semibold text-slate-900">{formatMoney(value)}</span>
    case 'int':
      return <span className="font-semibold text-slate-900">{Number(value).toLocaleString()}</span>
    case 'date':
      return formatDate(value)
    case 'time':
      return String(value)
    case 'bool':
      return value === 1 || value === true || value === '1' ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          No
        </span>
      )
    case 'textarea':
      return (
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
          {value}
        </div>
      )
    default:
      return <span className="text-slate-900">{String(value)}</span>
  }
}

function GridValue({ value }) {
  const parsed = parseJson(value)
  if (!parsed || typeof parsed !== 'object') return '—'
  const entries = Object.entries(parsed)
  if (!entries.length) return '—'
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100">
          {entries.map(([row, answer]) => (
            <tr key={row} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-slate-700">{row}</td>
              <td className="px-3 py-2 text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${answerBadgeClass(
                    answer
                  )}`}
                >
                  {answer}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function answerBadgeClass(answer) {
  const a = String(answer || '').toLowerCase()
  if (a.startsWith('yes')) return 'bg-emerald-100 text-emerald-700'
  if (a === 'no') return 'bg-rose-100 text-rose-700'
  if (a === 'na') return 'bg-slate-100 text-slate-600'
  if (a.includes('see comment')) return 'bg-amber-100 text-amber-700'
  return 'bg-indigo-100 text-indigo-700'
}

function ArrayValue({ value }) {
  const parsed = parseJson(value)
  const arr = Array.isArray(parsed) ? parsed : null
  if (!arr || !arr.length) return '—'
  return (
    <div className="flex flex-wrap gap-1.5">
      {arr.map((item, i) => (
        <span
          key={i}
          className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold"
        >
          {String(item)}
        </span>
      ))}
    </div>
  )
}

function FileValue({ value, multiple }) {
  const parsed = parseJson(value)
  if (!parsed) return '—'
  const list = multiple ? (Array.isArray(parsed) ? parsed : [parsed]) : [parsed]
  if (!list.length) return '—'
  return (
    <div className="space-y-2">
      {list.map((file, i) => (
        <a
          key={i}
          href={file.drive_view_link || '#'}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-700">
              {file.original_name || 'Attachment'}
            </div>
            <div className="text-xs text-slate-500">
              {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
              {file.mime ? ` · ${file.mime}` : ''}
            </div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-400 group-hover:text-indigo-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      ))}
    </div>
  )
}

function DetailDrawer({ form, row, onClose, categoryGradient }) {
  if (!row) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <div
          className={`relative bg-gradient-to-br ${categoryGradient} px-6 py-5 text-white overflow-hidden`}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
                Submission #{row.id}
              </div>
              <h2 className="text-xl font-bold leading-tight">{form.title}</h2>
              <div className="text-white/90 text-sm mt-1.5">
                {formatDateTime(row.created_at)}
                {row.submitted_by_name ? ` · ${row.submitted_by_name}` : ''}
              </div>
              <div className="text-white/70 text-xs mt-0.5">{row.email}</div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {form.fields.map((f) => {
            const v = row[f.key]
            const empty =
              v === null ||
              v === undefined ||
              v === '' ||
              (Array.isArray(v) && v.length === 0)
            return (
              <div key={f.key}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  {f.label}
                </div>
                {empty ? (
                  <div className="text-slate-400 italic text-sm">—</div>
                ) : f.type === 'grid' ? (
                  <GridValue value={v} />
                ) : f.type === 'array' ? (
                  <ArrayValue value={v} />
                ) : f.type === 'files' ? (
                  <FileValue value={v} multiple />
                ) : f.type === 'file' ? (
                  <FileValue value={v} multiple={false} />
                ) : (
                  fieldValue(v, f.type)
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default DetailDrawer
