import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              Forms Report
            </div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Submission Dashboard
            </div>
          </div>
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            {user.picture && (
              <img
                src={user.picture}
                alt=""
                className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-900 leading-tight">
                {user.name}
              </div>
              <div className="text-xs text-slate-500 leading-tight">
                {user.email}
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-sm text-slate-700 hover:text-indigo-600 font-medium border border-slate-200 rounded-lg px-3.5 py-1.5 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
