import { useEffect, useMemo, useState } from 'react'
import {
  CATEGORIES,
  FORMS_META,
  getFormsByCategory,
} from '../data/formsMeta.js'
import { fetchSummary, fetchSubmissions } from '../api.js'
import Sidebar from '../components/Sidebar.jsx'
import DataTable from '../components/DataTable.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'

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
  const [search, setSearch] = useState('')
  const [detailRow, setDetailRow] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const form = selectedFormKey ? FORMS_META[selectedFormKey] : null
  const category = findCategory(selectedFormKey)

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
      const data = await fetchSubmissions(key)
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

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.trim().toLowerCase()
    return rows.filter((r) =>
      Object.values(r).some((v) =>
        v === null || v === undefined
          ? false
          : String(v).toLowerCase().includes(q)
      )
    )
  }, [rows, search])

  return (
    <div className="flex h-[calc(100vh-61px)]">
      <Sidebar
        selectedFormKey={selectedFormKey}
        onSelect={setSelectedFormKey}
        counts={counts}
      />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {form && (
          <>
            <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${category.bg} ${category.accent} text-xs font-bold uppercase tracking-wider`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${category.gradient}`}
                    />
                    {category.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {rows.length}{' '}
                    {rows.length === 1 ? 'submission' : 'submissions'}
                    {lastUpdated
                      ? ` · updated ${lastUpdated.toLocaleTimeString()}`
                      : ''}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {form.title}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search rows…"
                    className="pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <button
                  onClick={() => {
                    refreshSummary()
                    loadRows(selectedFormKey)
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition-all flex items-center gap-1.5"
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
                  Refresh
                </button>
              </div>
            </div>

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
            ) : (
              <DataTable
                columns={form.columns}
                rows={filtered}
                onRowClick={setDetailRow}
              />
            )}
          </>
        )}
      </main>

      {detailRow && form && (
        <DetailDrawer
          form={form}
          row={detailRow}
          categoryGradient={category.gradient}
          onClose={() => setDetailRow(null)}
        />
      )}
    </div>
  )
}

export default Reports
