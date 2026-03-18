import { useState } from 'react'

export default function Login({ onLogin, onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username === 'andrea' && password === 'admin2025') {
      onLogin({ role: 'admin', name: 'Andrea Boen' })
    } else {
      setError('Credenziali non valide')
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-card">
        {onClose && (
          <button className="form-close" onClick={onClose} aria-label="Chiudi">
            &times;
          </button>
        )}
        <h2 className="form-title">Area Riservata</h2>
        <p className="form-subtitle">Accesso amministratore</p>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn--primary">
            Accedi
          </button>
        </form>
      </div>
    </div>
  )
}
