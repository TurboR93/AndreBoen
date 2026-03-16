import { useState } from 'react'
import ClientLanding from './components/ClientLanding'
import AdminMap from './components/AdminMap'
import Login from './components/Login'

export default function App() {
  const [user, setUser] = useState(null)
  const [showLogin, setShowLogin] = useState(false)

  const handleLogin = (userData) => {
    setUser(userData)
    setShowLogin(false)
  }

  const handleLogout = () => {
    setUser(null)
  }

  // Admin view
  if (user && user.role === 'admin') {
    return <AdminMap user={user} onLogout={handleLogout} />
  }

  // Client view
  return (
    <>
      <ClientLanding onLoginClick={() => setShowLogin(true)} />
      {showLogin && (
        <Login
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}
    </>
  )
}
