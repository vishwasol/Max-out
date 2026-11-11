import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signupUser } from '../api'

export default function Signup({ setAuth }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [bodyweight, setBodyweight] = useState(180)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signupUser({
        username,
        password,
        bodyweight: Number(bodyweight)
      })

      setAuth(true)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Username might be taken.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card fade-up" style={{ padding: '40px', maxWidth: 400, width: '100%' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: 8, textAlign: 'center' }}>Create Account</h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 32 }}>Enter your baseline stats to start tracking.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="signup-username" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>USERNAME</label>
            <input
              id="signup-username"
              type="text"
              autoComplete="username"
              maxLength={64}
              pattern="[^\s]+"
              className="input" 
              required
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          <div>
            <label htmlFor="signup-password" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>PASSWORD</label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={256}
              placeholder="At least 12 characters"
              className="input" 
              required
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <div>
            <label htmlFor="signup-bodyweight" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>BODYWEIGHT (lbs)</label>
            <input
              id="signup-bodyweight"
              type="number" 
              step="0.5"
              min="0.5"
              max="2000"
              className="input" 
              required
              value={bodyweight} 
              onChange={e => setBodyweight(e.target.value)} 
            />
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 6 }}>{error}</div>}

          <button type="submit" className="badge-gold" disabled={loading} style={{ marginTop: 12, border: 'none', padding: '14px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
          Already have an account? <Link to="/login" style={{ color: '#8b5cf6', textDecoration: 'none', fontWeight: 600 }}>Log in</Link>
        </div>
      </div>
    </div>
  )
}
