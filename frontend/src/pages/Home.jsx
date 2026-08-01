import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const BuildingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="9" y1="7" x2="9" y2="7.01" />
    <line x1="15" y1="7" x2="15" y2="7.01" />
    <line x1="9" y1="11" x2="9" y2="11.01" />
    <line x1="15" y1="11" x2="15" y2="11.01" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
)

const WarehouseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21V7l9-4 9 4v14" />
    <path d="M7 21V12h10v9" />
    <path d="M10 21v-4h4v4" />
  </svg>
)

const StoreIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l1-5h16l1 5" />
    <path d="M5 9v11h14V9" />
    <path d="M9 20v-6h6v6" />
  </svg>
)

const sharedStoreForms = [
  {
    path: '/forms/customer-service-request',
    label: 'Customer Service Request',
  },
]

const locations = [
  {
    key: 'arden',
    title: 'Arden',
    subtitle: 'Arden Location Forms',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    accentText: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    accentHover: 'hover:bg-emerald-50 hover:border-emerald-300',
    shadow: 'shadow-emerald-500/20',
    ring: 'group-hover:bg-emerald-100',
    icon: <BuildingIcon />,
    forms: [
      {
        path: '/forms/cash-received-arden',
        label: 'Cash Batch Report',
      },
      {
        path: '/forms/managers-opening-checklist-arden',
        label: 'Mgr Opening Checklist',
      },
      {
        path: '/forms/managers-closing-checklist-arden',
        label: 'Mgr Closing Checklist',
      },
      ...sharedStoreForms,
    ],
  },
  {
    key: 'warehouse',
    title: 'Warehouse',
    subtitle: 'Operations & Logistics',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    accentText: 'text-amber-600',
    accentBg: 'bg-amber-50',
    accentHover: 'hover:bg-amber-50 hover:border-amber-300',
    shadow: 'shadow-amber-500/20',
    ring: 'group-hover:bg-amber-100',
    icon: <WarehouseIcon />,
    forms: [
      {
        path: '/forms/warehouse-notification',
        label: 'Warehouse Notification',
      },
      {
        path: '/forms/warehouse-opening-checklist',
        label: 'Warehouse Opening Checklist',
      },
      {
        path: '/forms/warehouse-closing-checklist',
        label: 'Warehouse Closing Checklist',
      },
      {
        path: '/forms/part-received',
        label: 'Part Received',
      },
      {
        path: '/forms/delivery-checklist',
        label: 'Delivery Checklist',
      },
      {
        path: '/forms/pre-delivery-checklist',
        label: 'Pre-Delivery Checklist',
      },
    ],
  },
  {
    key: 'waynesville',
    title: 'Waynesville',
    subtitle: 'Waynesville Location Forms',
    gradient: 'from-violet-500 via-fuchsia-500 to-pink-600',
    accentText: 'text-violet-600',
    accentBg: 'bg-violet-50',
    accentHover: 'hover:bg-violet-50 hover:border-violet-300',
    shadow: 'shadow-violet-500/20',
    ring: 'group-hover:bg-violet-100',
    icon: <StoreIcon />,
    forms: [
      {
        path: '/forms/cash-received-wvl',
        label: 'Cash Batch Report',
      },
      {
        path: '/forms/managers-opening-checklist-waynesville',
        label: 'Mgr Opening Checklist',
      },
      {
        path: '/forms/managers-closing-checklist-waynesville',
        label: 'Mgr Closing Checklist',
      },
      ...sharedStoreForms,
    ],
  },
]

function Home() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'there'
  const totalForms = locations.reduce((sum, l) => sum + l.forms.length, 0)

  return (
    <div>
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/70 text-indigo-700 text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          {totalForms} forms available
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3">
          Welcome back,{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Choose a location below to access its forms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {locations.map((loc) => (
          <div
            key={loc.key}
            className="relative bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden flex flex-col"
          >
            <div
              className={`relative bg-gradient-to-br ${loc.gradient} px-6 py-5 text-white overflow-hidden`}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
                  {loc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold tracking-tight leading-tight">
                    {loc.title}
                  </h2>
                  <p className="text-white/85 text-xs font-medium">
                    {loc.subtitle}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold ring-1 ring-white/30">
                  {loc.forms.length}
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-2">
              {loc.forms.map((form, idx) => (
                <Link
                  key={form.path}
                  to={form.path}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 ${loc.accentHover} transition-all hover:shadow-sm hover:-translate-y-0.5`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${loc.accentBg} ${loc.ring} flex items-center justify-center transition-colors`}
                  >
                    <span
                      className={`text-sm font-bold ${loc.accentText}`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <span
                    className={`flex-1 text-sm font-semibold text-slate-800 group-hover:${loc.accentText}`}
                  >
                    {form.label}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-slate-400 group-hover:${loc.accentText} opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
