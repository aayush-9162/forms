import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { startRetryLoop } from './outbox/retrier.js'
import { registerServiceWorker, seedAuthForSync } from './outbox/sync.js'
import { pruneExpiredArchive } from './outbox/archive.js'
import './index.css'
import App from './App.jsx'

// The Service Worker needs an absolute API base (it has no page origin to be
// relative to). Default to this page's origin so a server-hosted build reaches
// its own API regardless of IP/port.
const apiBase = import.meta.env.VITE_API_URL || window.location.origin

// Seed the API URL into IDB so the Service Worker can reach the backend when
// the tab is closed. The Google credential is seeded by AuthContext whenever
// the user signs in or the token rotates.
seedAuthForSync({ apiBase })

// Outbox background machinery. Safe to start immediately — drain() no-ops
// until there's a valid Google credential in IDB.
startRetryLoop()
pruneExpiredArchive()
setInterval(pruneExpiredArchive, 60 * 60 * 1000)
registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
