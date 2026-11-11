import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUser, getWorkouts, getPerformance, deleteWorkout } from '../api'
import PointsBar from '../components/PointsBar'

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="card fade-up" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '2rem', fontWeight: 700, color: accent || '#f1f5f9', lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: '1.6rem', opacity: 0.85 }}>{icon}</div>
      </div>
    </div>
  )
}

function WorkoutRow({ workout, onDelete }) {
  const date = new Date(workout.date)
  const exNames = [...new Set(workout.exercises.map(e => e.name))].slice(0, 3)
  const totalVol = workout.exercises.reduce((s, e) => s + e.weight * e.reps * e.sets, 0)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: '1px solid rgba(139,92,246,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
        }}>🏋️</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            {exNames.join(', ')}{exNames.length < workout.exercises.length ? '…' : ''}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
            {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''} · {Math.round(totalVol).toLocaleString()} lbs volume
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
        <button 
          onClick={() => onDelete(workout.id)}
          style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [workouts, setWorkouts] = useState([])
  const [perf, setPerf] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  const fetchAll = () => {
    Promise.all([getUser(), getWorkouts(), getPerformance()])
      .then(([u, w, p]) => {
        setLoadFailed(false)
        setUser(u.data)
        setWorkouts(w.data)
        setPerf(p.data)
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleDeleteWorkout = async (id) => {
    if (!window.confirm('Delete this workout session? Points earned will be removed.')) return
    
    try {
      await deleteWorkout(id)
      setLoading(true)
      fetchAll()
    } catch {
      alert('Failed to delete workout.')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <div className="pulse-glow" style={{ width: 12, height: 12, borderRadius: '50%', background: '#8b5cf6' }} />
      <span style={{ color: '#94a3b8' }}>Loading your stats…</span>
    </div>
  )

  if (loadFailed) return <p role="alert">Could not load your dashboard.</p>

  const prCount = perf ? Object.keys(perf.prs).length : 0

  return (
    <div className="page">
      {/* Hero */}
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>Welcome back,</span>
          <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{user?.username ?? 'Athlete'}</span>
        </div>
        <h1 className="page-title gradient-text" style={{ fontSize: '2.4rem' }}>Your Dashboard</h1>
        <p className="page-subtitle">Keep pushing. Every rep counts.</p>
      </div>

      {/* XP Bar card */}
      <div className="card fade-up glow-purple" style={{ padding: '24px 28px', marginBottom: 28 }}>
        <PointsBar totalPoints={user?.total_points ?? 0} />
      </div>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Points" value={(user?.total_points ?? 0).toLocaleString()} sub="All time" accent="#fbbf24" />
        <StatCard label="Day Streak" value={perf?.streak ?? 0} sub="consecutive days" accent="#f97316" />
        <StatCard label="Personal Records" value={prCount} sub="exercises" accent="#8b5cf6" />
        <StatCard label="Workouts" value={perf?.workouts_count ?? 0} sub="logged total" accent="#06b6d4" />
      </div>

      {/* Recent workouts */}
      <div className="card fade-up" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.1rem' }}>Recent Workouts</h2>
          <Link to="/log" className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.8rem', textDecoration: 'none' }}>
            + Log Workout
          </Link>
        </div>

        {workouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏋️</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No workouts yet</div>
            <div style={{ fontSize: '0.85rem' }}>Log your first session to start earning points.</div>
          </div>
        ) : (
          workouts.slice(0, 8).map(w => (
            <WorkoutRow key={w.id} workout={w} onDelete={handleDeleteWorkout} />
          ))
        )}
      </div>
    </div>
  )
}
