import {
  formatDateTime,
  formatMoney,
  formatDate,
  parseJson,
} from './formatters.js'

// Full, form-aware detail of one submission — rendered inline in the day view.
// Groups fields the way the forms actually work: a Summary grid of short
// answers (Yes/No questions get colour-coded badges, with their follow-up
// "describe/explain" answer nested underneath), then checklist grids,
// attachments, and free-text notes as full-width sections.

const WIDE_TYPES = new Set(['grid', 'array', 'file', 'files', 'textarea'])

function isEmpty(v) {
  return (
    v === null ||
    v === undefined ||
    v === '' ||
    (Array.isArray(v) && v.length === 0)
  )
}

function Dash() {
  return <span className="text-slate-300 text-sm">—</span>
}

// Does this scalar value read like a yes/no/na answer?
function looksLikeAnswer(v) {
  const a = String(v).trim().toLowerCase()
  return (
    ['yes', 'no', 'na', 'n/a'].includes(a) ||
    a.startsWith('yes') ||
    a.startsWith('no ') ||
    a.includes('see comment')
  )
}

function AnswerBadge({ value }) {
  const a = String(value).trim().toLowerCase()
  let cls = 'bg-indigo-100 text-indigo-700'
  if (a.startsWith('yes')) cls = 'bg-emerald-100 text-emerald-700'
  else if (a === 'no' || a.startsWith('no ')) cls = 'bg-rose-100 text-rose-700'
  else if (a === 'na' || a === 'n/a') cls = 'bg-slate-100 text-slate-500'
  else if (a.includes('see comment')) cls = 'bg-amber-100 text-amber-700'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}
    >
      {String(value)}
    </span>
  )
}

// Short scalar value: badges for yes/no answers, otherwise typed formatting.
function ScalarValue({ value, type }) {
  if (isEmpty(value)) return <Dash />
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
      return (
        <AnswerBadge value={value === 1 || value === true || value === '1' ? 'Yes' : 'No'} />
      )
    default:
      return looksLikeAnswer(value) ? (
        <AnswerBadge value={value} />
      ) : (
        <span className="text-slate-900 break-words">{String(value)}</span>
      )
  }
}

// Checklist grid → responsive item/answer cells (wraps into columns so long
// checklists don't run down the whole page).
function Checklist({ value }) {
  const parsed = parseJson(value)
  const entries =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? Object.entries(parsed)
      : []
  if (!entries.length) return <Dash />
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
      {entries.map(([item, answer]) => (
        <div
          key={item}
          className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 bg-white"
        >
          <span className="text-sm text-slate-700 min-w-0 break-words">{item}</span>
          <AnswerBadge value={answer} />
        </div>
      ))}
    </div>
  )
}

function Chips({ value }) {
  const parsed = parseJson(value)
  const arr = Array.isArray(parsed) ? parsed : null
  if (!arr || !arr.length) return <Dash />
  return (
    <div className="flex flex-wrap gap-1.5">
      {arr.map((item, i) => (
        <span
          key={i}
          className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-sm font-medium"
        >
          {String(item)}
        </span>
      ))}
    </div>
  )
}

function FileLinks({ value, multiple }) {
  const parsed = parseJson(value)
  if (!parsed) return <Dash />
  const list = multiple ? (Array.isArray(parsed) ? parsed : [parsed]) : [parsed]
  if (!list.length) return <Dash />
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((file, i) => (
        <a
          key={i}
          href={file.drive_view_link || '#'}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all group w-72 max-w-full"
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

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
      {children}
    </div>
  )
}

function SubmissionDetail({ form, row, gradient }) {
  const initial = (row.submitted_by_name || row.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase()

  const fields = form.fields || []

  // Pair a follow-up "describe/explain" textarea with the question above it
  // (its key starts with the question's key), so they read as one thing.
  const items = []
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]
    const next = fields[i + 1]
    const scalarQuestion = !WIDE_TYPES.has(f.type)
    if (
      scalarQuestion &&
      next &&
      next.type === 'textarea' &&
      next.key.startsWith(f.key)
    ) {
      items.push({ field: f, follow: next })
      i++
    } else {
      items.push({ field: f })
    }
  }

  const summary = items.filter((it) => !WIDE_TYPES.has(it.field.type))
  const grids = items.filter((it) => it.field.type === 'grid')
  const arrays = items.filter((it) => it.field.type === 'array')
  const files = items.filter(
    (it) => it.field.type === 'file' || it.field.type === 'files'
  )
  const notes = items.filter((it) => it.field.type === 'textarea')

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
      {/* header */}
      <div
        className={`bg-gradient-to-r ${gradient} px-6 py-4 text-white flex items-center gap-3`}
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
          <div className="text-white/85 text-xs font-bold">#{row.id}</div>
          <div className="text-white/70 text-xs">
            {formatDateTime(row.created_at)}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-7">
        {/* Summary: short answers, Yes/No badges, nested follow-ups */}
        {summary.length > 0 && (
          <dl className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-5">
            {summary.map(({ field, follow }) => {
              const followVal = follow ? row[follow.key] : null
              return (
                <div key={field.key} className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {field.label}
                  </dt>
                  <dd className="text-sm">
                    <ScalarValue value={row[field.key]} type={field.type} />
                  </dd>
                  {follow && !isEmpty(followVal) && (
                    <dd className="mt-1.5 text-sm text-slate-600 whitespace-pre-wrap border-l-2 border-slate-200 pl-2.5">
                      {String(followVal)}
                    </dd>
                  )}
                </div>
              )
            })}
          </dl>
        )}

        {/* Checklist grids */}
        {grids.map(({ field }) => (
          <div key={field.key}>
            <SectionLabel>{field.label}</SectionLabel>
            <Checklist value={row[field.key]} />
          </div>
        ))}

        {/* Array fields (chips) */}
        {arrays.map(({ field }) => (
          <div key={field.key}>
            <SectionLabel>{field.label}</SectionLabel>
            <Chips value={row[field.key]} />
          </div>
        ))}

        {/* Attachments */}
        {files.length > 0 && (
          <div>
            <SectionLabel>Attachments</SectionLabel>
            <div className="space-y-3">
              {files.map(({ field }) => (
                <div key={field.key}>
                  <div className="text-xs font-medium text-slate-500 mb-1.5">
                    {field.label}
                  </div>
                  <FileLinks
                    value={row[field.key]}
                    multiple={field.type === 'files'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Free-text notes */}
        {notes.map(({ field }) => {
          const v = row[field.key]
          if (isEmpty(v)) return null
          return (
            <div key={field.key}>
              <SectionLabel>{field.label}</SectionLabel>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                {String(v)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SubmissionDetail
