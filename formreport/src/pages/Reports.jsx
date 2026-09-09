import { useEffect, useMemo, useState } from 'react'
import {
  CATEGORIES,
  FORMS_META,
  getFormsByCategory,
} from '../data/formsMeta.js'
import { fetchSummary, fetchSubmissions } from '../api.js'
import Sidebar from '../components/Sidebar.jsx'
import SubmissionDetail from '../components/SubmissionDetail.jsx'

// ---- date helpers (all local-time, YYYY-MM-DD) ----
const pad = (n) => String(n).padStart(2, '0')
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const todayYMD = () => toYMD(new Date())
function yesterdayYMD() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toYMD(d)
}
function shiftYMD(ymd, delta) {
  const [y, m, d] = ymd.split('-').map(Number)
  return toYMD(new Date(y, m - 1, d + delta))
}
// Pull a comparable local YYYY-MM-DD out of a row value. Pure date strings
// ('2026-09-06') are used as-is; datetimes (created_at) convert to local.
function rowYMD(value) {
  if (!value) return ''
  const s = String(value)
  if (s.length <= 10 && /^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(value)
  return isNaN(d) ? s.slice(0, 10) : toYMD(d)
}
// The field that represents "the day" for a form: its date field, else created_at.
function dateFieldFor(form) {
  const all = [...(form?.fields || []), ...(form?.columns || [])]
  return all.find((f) => f.type === 'date')?.key || 'created_at'
}
function prettyDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function firstFormKey() {
  const grouped = getFormsByCategory()
  for (const cat of CATEGORIES) {
    if (grouped[cat.key]?.length) return grouped[cat.key][0].key
  }
  return null
}

function findCategory(formKey) {
  const meta = FORMS_META[formKey]
  if (!meta) return CATEGORIES[0]
  return CATEGORIES.find((c) => c.key === meta.category) || CATEGORIES[0]
}

function Reports() {
  const [selectedFormKey, setSelectedFormKey] = useState(firstFormKey)
  const [counts, setCounts] = useState({})
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(yesterdayYMD)
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const form = selectedFormKey ? FORMS_META[selectedFormKey] : null
  const category = findCategory(selectedFormKey)
  const dateField = useMemo(() => dateFieldFor(form), [form])

  const refreshSummary = async () => {
    try {
      const data = await fetchSummary()
      setCounts(data.summary || {})
    } catch (err) {
      console.warn('[reports] summary fetch failed:', err.message)
    }
  }

  const loadRows = async (key) => {
    if (!key) return
    setLoading(true)
    setError('')
    try {
      // Fetch a wide window so the date picker can page back through history.
      const data = await fetchSubmissions(key, { limit: 1000 })
      setRows(data.rows || [])
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadRows(selectedFormKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormKey])

  // Which dates actually have submissions (for hinting + counts).
  const countsByDate = useMemo(() => {
    const map = {}
    for (const r of rows) {
      const k = rowYMD(r[dateField] ?? r.created_at)
      if (k) map[k] = (map[k] || 0) + 1
    }
    return map
  }, [rows, dateField])

  const dayRows = useMemo(() => {
    const onDay = rows.filter(
      (r) => rowYMD(r[dateField] ?? r.created_at) === selectedDate
    )
    if (!search.trim()) return onDay
    const q = search.trim().toLowerCase()
    return onDay.filter((r) =>
      Object.values(r).some((v) =>
        v == null ? false : String(v).toLowerCase().includes(q)
      )
    )
  }, [rows, dateField, selectedDate, search])

  const isToday = selectedDate === todayYMD()
  const isYesterday = selectedDate === yesterdayYMD()

  return (
    <div className="flex h-[calc(100vh-61px)]">
      <Sidebar
        selectedFormKey={selectedFormKey}
        onSelect={setSelectedFormKey}
        counts={counts}
      />

      <main className="flex-1 overflow-y-auto">
        {form && (
          <>
            {/* Compact header (scrolls with the content — not sticky) */}
            <div className="border-b border-slate-200/70 px-6 pt-4 pb-3">
              {/* row 1: category + title | search + refresh */}
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${category.bg} ${category.accent} text-[10px] font-bold uppercase tracking-wider shrink-0`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${category.gradient}`}
                    />
                    {category.label}
                  </span>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate">
                    {form.title}
                  </h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search this day…"
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <button
                    onClick={() => {
                      refreshSummary()
                      loadRows(selectedFormKey)
                    }}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                    aria-label="Refresh"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* row 2: date navigator + chips | selected date · count */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                  <button
                    onClick={() => setSelectedDate((d) => shiftYMD(d, -1))}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    aria-label="Previous day"
                  >
                    ‹
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    max={todayYMD()}
                    onChange={(e) => setSelectedDate(e.target.value || yesterdayYMD())}
                    className="px-2 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none"
                  />
                  <button
                    onClick={() => setSelectedDate((d) => shiftYMD(d, 1))}
                    disabled={isToday}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next day"
                  >
                    ›
                  </button>
                </div>

                <button
                  onClick={() => setSelectedDate(yesterdayYMD())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isYesterday
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  Yesterday
                </button>
                <button
                  onClick={() => setSelectedDate(todayYMD())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isToday
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  Today
                </button>

                <div className="ml-auto flex items-baseline gap-2 text-sm">
                  <span className="font-semibold text-slate-800">
                    {prettyDate(selectedDate)}
                  </span>
                  <span className="text-slate-400">
                    · {dayRows.length}{' '}
                    {dayRows.length === 1 ? 'submission' : 'submissions'}
                  </span>
                  {lastUpdated && (
                    <span className="text-xs text-slate-300 hidden lg:inline">
                      · updated {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
                  {error}
                </div>
              )}

              {loading && rows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/70 p-16 text-center">
                  <div className="w-10 h-10 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
                  <div className="text-slate-600 font-medium">Loading…</div>
                </div>
              ) : dayRows.length === 0 ? (
                <EmptyDay
                  countsByDate={countsByDate}
                  selectedDate={selectedDate}
                  onPick={setSelectedDate}
                />
              ) : (
                <div className="space-y-6">
                  {dayRows.map((row) => (
                    <SubmissionDetail
                      key={row.id}
                      form={form}
                      row={row}
                      gradient={category.gradient}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// Empty state that also points at the nearest days that DO have data.
function EmptyDay({ countsByDate, selectedDate, onPick }) {
  const nearby = Object.keys(countsByDate)
    .filter((d) => d !== selectedDate)
    .sort((a, b) => (a < b ? 1 : -1))
    .slice(0, 5)

  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-14 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">
        No submissions on this day
      </h3>
      <p className="text-sm text-slate-500 mb-5">
        Nothing was submitted for the selected date.
      </p>
      {nearby.length > 0 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">Recent days with data:</span>
          {nearby.map((d) => (
            <button
              key={d}
              onClick={() => onPick(d)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {d} · {countsByDate[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Reports
