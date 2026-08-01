import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import OutboxBadge from './OutboxBadge.jsx'
import ArchiveButton from './ArchiveButton.jsx'

function Navbar() {
  const { user, signOut } = useAuth()

  // Keycloak's signOut redirects to the realm logout endpoint, so there's
  // nothing to navigate to client-side — the browser is bounced to the
  // Keycloak login page.
  const handleSignOut = () => signOut()

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="15" y2="17" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Forms Portal
          </span>
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <ArchiveButton />
            <OutboxBadge />
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
              onClick={handleSignOut}
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
