import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

// Full-page sign-in screen shown whenever there is no valid Google credential.
function Login() {
  const { authReady, renderSignInButton } = useAuth()
  const btnRef = useRef(null)

  useEffect(() => {
    if (authReady && btnRef.current) {
      renderSignInButton(btnRef.current)
    }
  }, [authReady, renderSignInButton])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200/70 max-w-md w-full overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:via-violet-500 before:to-fuchsia-500">
        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-5 shadow-md shadow-indigo-500/25">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <rect x="7" y="10" width="3" height="7" />
              <rect x="12" y="6" width="3" height="11" />
              <rect x="17" y="13" width="3" height="4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            Forms Report
          </h1>
          <p className="text-slate-600 mb-6">
            Sign in with your Carolina Furniture Concepts Google account to view
            submissions.
          </p>
          <div ref={btnRef} className="flex justify-center min-h-[44px]" />
          {!authReady && (
            <p className="text-xs text-slate-400 mt-4">
              Loading Google sign-in…
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
