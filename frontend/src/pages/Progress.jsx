import { useEffect, useState } from 'react'
import { getPerformance, getWorkouts, getUser, resetUser } from '../api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import StrengthVisualizerSystem from '../components/StrengthVisualizerSystem'
import { buildCurrentMuscleProfile } from '../utils/strengthVisualizerLogic'

function PRTable({ prs }) {
  const entries = Object.entries(prs).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569' }}>
      No PRs yet — log some workouts!
    </div>
  )
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
      <thead>
        <tr>
          {['Exercise', 'Best Weight (lbs)'].map(h => (
            <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#475569',
              fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
              borderBottom: '1px solid rgba(139,92,246,0.1)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map(([name, weight], i) => (
          <tr key={name} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
            <td style={{ padding: '12px', fontWeight: 500 }}>{name}</td>
            <td style={{ padding: '12px' }}>
              <span className="badge badge-gold">{weight} lbs</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#12121f', border: '1px solid rgba(139,92,246,0.3)',
      borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem' }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#fbbf24', fontWeight: 700 }}>{payload[0].value.toLocaleString()} lbs</div>
    </div>
  )
}

export default function Progress() {
  const showResetControls = import.meta.env.DEV
  const [perf, setPerf] = useState(null)
  const [chartData, setChartData] = useState([])
  const [muscleScores, setMuscleScores] = useState({})
  const [muscleConfidence, setMuscleConfidence] = useState({})
  const [muscleTopExercises, setMuscleTopExercises] = useState({})
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    Promise.all([getPerformance(), getWorkouts(30), getUser()])
      .then(([p, w, u]) => {
        setPerf(p.data)
        // Build volume-over-time chart
        const data = [...w.data].reverse().map(workout => {
          const vol = workout.exercises.reduce((s, e) => s + e.weight * e.reps * e.sets, 0)
          const d = new Date(workout.date)
          return {
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            volume: Math.round(vol),
          }
        })
        setChartData(data)

        const currentMuscleProfile = buildCurrentMuscleProfile(
          w.data,
          parseFloat(u.data?.bodyweight) || 180
        )
        setMuscleScores(currentMuscleProfile.scores)
        setMuscleConfidence(currentMuscleProfile.confidence)
        setMuscleTopExercises(currentMuscleProfile.topExercises)
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false))
  }, [])

  const executeReset = async () => {
    setIsResetting(true);
    try {
      await resetUser();
      window.location.reload();
    } catch {
      alert("Failed to reset user.");
      setIsResetting(false);
      setShowConfirm(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <div className="pulse-glow" style={{ width: 12, height: 12, borderRadius: '50%', background: '#8b5cf6' }} />
      <span style={{ color: '#94a3b8' }}>Loading stats…</span>
    </div>
  )

  if (loadFailed) return <p role="alert">Could not load your progress.</p>

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title gradient-text fade-up">Progress</h1>
          <p className="page-subtitle fade-up">Track your strength gains and training volume over time.</p>
        </div>
        
        {showResetControls && showConfirm ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>Delete ALL data?</span>
            <button onClick={executeReset} disabled={isResetting} className="badge badge-gold" style={{ background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>
              {isResetting ? "..." : "Yes"}
            </button>
            <button onClick={() => setShowConfirm(false)} disabled={isResetting} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
              Cancel
            </button>
          </div>
        ) : showResetControls ? (
          <button 
            onClick={() => setShowConfirm(true)} 
            disabled={isResetting}
            style={{ 
              background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
            }}>
            Reset Data (Testing)
          </button>
        ) : null}
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Workouts', value: perf?.workouts_count ?? 0, icon: '🏋️' },
          { label: 'Day Streak', value: `${perf?.streak ?? 0} days`, icon: '🔥' },
          { label: 'Total Volume', value: `${Math.round((perf?.total_volume ?? 0) / 1000)}k lbs`, icon: '📦' },
          { label: 'PRs Set', value: Object.keys(perf?.prs ?? {}).length, icon: '🏆' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card fade-up" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '1.3rem', marginBottom: 6 }}>{icon}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.3rem' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Strength Level Visualizer Component */}
      <div style={{ marginBottom: 24, position: 'relative' }}>
        <StrengthVisualizerSystem 
          scores={muscleScores}
          confidence={muscleConfidence}
          topExercises={muscleTopExercises}
        />
      </div>

      {/* Volume chart */}
      <div className="card fade-up" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.1rem', marginBottom: 20 }}>
          Volume Over Time
        </h2>
        {chartData.length < 2 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569' }}>
            Log at least 2 workouts to see your volume trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2.5}
                dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#06b6d4', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* PR table */}
      <div className="card fade-up" style={{ padding: '24px 28px' }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>
          Personal Records 🏆
        </h2>
        <PRTable prs={perf?.prs ?? {}} />
      </div>
    </div>
  )
}
