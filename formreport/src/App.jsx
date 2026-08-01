import Navbar from './components/Navbar.jsx'
import Login from './components/Login.jsx'
import Reports from './pages/Reports.jsx'
import { useAuth } from './context/AuthContext.jsx'

// Sign in with Google gates the whole dashboard: no valid credential → login
// screen. The @123cfc.com domain check is enforced server-side on every
// /api/reports call.

function App() {
  const { user } = useAuth()

  if (!user) return <Login />

  return (
    <div className="min-h-screen">
      <Navbar />
      <Reports />
    </div>
  )
}

export default App
