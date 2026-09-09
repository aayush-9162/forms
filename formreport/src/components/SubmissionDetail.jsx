import {
  formatDateTime,
  formatMoney,
  formatDate,
  parseJson,
} from './formatters.js'

// Full, expanded detail of one submission — rendered inline in the day view
// (no click, no drawer). Shows every field of the form for this row.

function answerBadgeClass(answer) {
  const a = String(answer || '').toLowerCase()
  if (a.startsWith('yes')) return 'bg-emerald-100 text-emerald-700'
  if (a === 'no') return 'bg-rose-100 text-rose-700'
  if (a === 'na') return 'bg-slate-100 text-slate-600'
  if (a.includes('see comment')) return 'bg-amber-100 text-amber-700'
  return 'bg-indigo-100 text-indigo-700'
}

function ScalarValue({ value, type }) {
  switch (type) {
    case 'money':
      return <span className="font-semibold text-slate-900">{formatMoney(value)}</span>
    case 'int':
      return (
        <span className="font-semibold text-slate-900">
          {Number(value).toLocaleString()}
        </span>
      )
    case 'date':
      return <span className="text-slate-900">{formatDate(value)}</span>
    case 'time':
      return <span className="text-slate-900">{String(value)}</span>
    case 'bool':
      return value === 1 || value === true || value === '1' ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          No
        </span>
      )
    case 'textarea':
      return (
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">
          {value}
        </div>
      )
    default:
      return <span className="text-slate-900 break-words">{String(value)}</span>
  }
}

function GridValue({ value }) {
  const parsed = parseJson(value)
  if (!parsed || typeof parsed !== 'object') return <Dash />
  const entries = Object.entries(parsed)
  if (!entries.length) return <Dash />
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100">
          {entries.map(([label, answer]) => (
            <tr key={label} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-slate-700">{label}</td>
              <td className="px-3 py-2 text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${answerBadgeClass(
                    answer
                  )}`}
                >
                  {String(answer)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ArrayValue({ value }) {
  const parsed = parseJson(value)
  const arr = Array.isArray(parsed) ? parsed : null
  if (!arr || !arr.length) return <Dash />
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
  if (!parsed) return <Dash />
  const list = multiple ? (Array.isArray(parsed) ? parsed : [parsed]) : [parsed]
  if (!list.length) return <Dash />
  return (
    <div className="space-y-2">
      {list.map((file, i) => (
        <a
          key={i}
          href={file.drive_view_link || '#'}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all group max-w-md"
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
        </a>
      ))}
    </div>
  )
}

function Dash() {
  return <span className="text-slate-400 italic text-sm">—</span>
}

const WIDE_TYPES = new Set(['grid', 'array', 'file', 'files', 'textarea'])

function isEmpty(v) {
  return (
    v === null ||
    v === undefined ||
    v === '' ||
    (Array.isArray(v) && v.length === 0)
  )
}

function renderValue(field, v) {
  if (isEmpty(v)) return <Dash />
  switch (field.type) {
    case 'grid':
      return <GridValue value={v} />
    case 'array':
      return <ArrayValue value={v} />
    case 'files':
      return <FileValue value={v} multiple />
    case 'file':
      return <FileValue value={v} multiple={false} />
    default:
      return <ScalarValue value={v} type={field.type} />
  }
}

function SubmissionDetail({ form, row, gradient }) {
  const initial = (row.submitted_by_name || row.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase()

  const fields = form.fields || []
  const compact = fields.filter((f) => !WIDE_TYPES.has(f.type))
  const wide = fields.filter((f) => WIDE_TYPES.has(f.type))

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
      {/* header */}
      <div
        className={`bg-gradient-to-r ${gradient} px-5 py-4 text-white flex items-center gap-3`}
      >
        <div className="w-11 h-11 rounded-xl bg-white/20 ring-1 ring-white/30 flex items-center justify-center font-bold text-lg shrink-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold leading-tight truncate">
            {row.submitted_by_name || '—'}
          </div>
          <div className="text-white/85 text-xs truncate">{row.email}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-white/85 text-[11px] font-bold">#{row.id}</div>
          <div className="text-white/70 text-[11px]">
            {formatDateTime(row.created_at)}
          </div>
        </div>
      </div>

      {/* body */}
      <div className="p-5 sm:p-6">
        {compact.length > 0 && (
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mb-6">
            {compact.map((f) => (
              <div key={f.key} className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {f.label}
                </dt>
                <dd className="text-sm">{renderValue(f, row[f.key])}</dd>
              </div>
            ))}
          </dl>
        )}

        {wide.length > 0 && (
          <div className="space-y-5">
            {wide.map((f) => (
              <div key={f.key}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  {f.label}
                </div>
                {renderValue(f, row[f.key])}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SubmissionDetail
