import { CATEGORIES, getFormsByCategory } from '../data/formsMeta.js'

function Sidebar({ selectedFormKey, onSelect, counts }) {
  const grouped = getFormsByCategory()
  // Count only the forms actually shown in the sidebar (excludes any form
  // omitted from FORMS_META, e.g. To Do List / Hot Button).
  const totalCount = Object.values(grouped)
    .flat()
    .reduce((s, f) => s + (counts?.[f.key]?.count || 0), 0)

  return (
    <aside className="w-72 shrink-0 border-r border-slate-200/60 bg-white/40 backdrop-blur-sm overflow-y-auto">
      <div className="p-4 border-b border-slate-200/60">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          Total submissions
        </div>
        <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          {totalCount.toLocaleString()}
        </div>
      </div>
      <div className="p-3 space-y-5">
        {CATEGORIES.map((cat) => {
          const forms = grouped[cat.key] || []
          if (!forms.length) return null
          return (
            <div key={cat.key}>
              <div className="flex items-center gap-2 px-2 mb-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${cat.gradient}`}
                />
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {cat.label}
                </div>
              </div>
              <div className="space-y-1">
                {forms.map((form) => {
                  const count = counts?.[form.key]?.count ?? 0
                  const isActive = selectedFormKey === form.key
                  return (
                    <button
                      key={form.key}
                      onClick={() => onSelect(form.key)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2 group ${
                        isActive
                          ? 'bg-gradient-to-r ' +
                            cat.gradient +
                            ' text-white shadow-md shadow-indigo-500/20'
                          : 'hover:bg-white hover:shadow-sm text-slate-700'
                      }`}
                    >
                      <span className="text-sm font-semibold truncate">
                        {form.title}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : `${cat.bg} ${cat.accent}`
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar
