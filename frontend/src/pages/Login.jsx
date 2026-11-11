import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../api'

export default function Login({ setAuth }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await loginUser({ username, password })
      setAuth(true)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card fade-up" style={{ padding: '40px', maxWidth: 400, width: '100%' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: 8, textAlign: 'center' }}>Welcome Back</h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 32 }}>Log in to track your lifting gains.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="login-username" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>USERNAME</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              className="input" 
              required
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="e.g. IronLifter99"
            />
          </div>
          <div>
            <label htmlFor="login-password" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>PASSWORD</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="input" 
              required
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 6 }}>{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#8b5cf6', textDecoration: 'none', fontWeight: 600 }}>Sign up here</Link>
        </div>
      </div>
    </div>
  )
}
