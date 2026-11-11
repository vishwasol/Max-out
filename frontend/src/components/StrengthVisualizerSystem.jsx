import { Link, useNavigate } from 'react-router-dom'
import MuscleMap from './MuscleMap'
import { MUSCLE_GROUPS } from '../utils/exerciseLibrary'
import { classifyLevel, LEVEL_COLORS, LEGEND } from '../utils/strengthVisualizerLogic'

export default function StrengthVisualizerSystem({ scores = {} }) {
  const navigate = useNavigate()
  const exerciseLink = muscle => `/log?muscle=${muscle}`

  return (
    <div className="card fade-up" style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.4rem' }}>
            Current Muscle Map
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4, maxWidth: 560 }}>
            Strength scores are estimated from your logged lifts relative to your bodyweight. Select a muscle group to browse its exercises.
          </p>
        </div>
        <div className="badge badge-gold" style={{ fontSize: '0.8rem', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
          Current capability
        </div>
      </div>

      <MuscleMap scores={scores} onSelect={muscle => navigate(exerciseLink(muscle))} />

      <div className="muscle-score-grid">
        {MUSCLE_GROUPS.map(muscle => {
          const score = scores[muscle] || 0
          const color = score ? LEVEL_COLORS[classifyLevel(score)] : '#94a3b8'
          return (
            <Link key={muscle} to={exerciseLink(muscle)} className="muscle-score-card">
              <div className="muscle-score-card-heading">
                <span>{muscle}</span>
                <strong>{score ? `${score.toFixed(1)} / 100` : '—'}</strong>
              </div>
              <div className="muscle-score-track" aria-hidden="true">
                <div style={{ width: `${score}%`, background: color }} />
              </div>
            </Link>
          )
        })}
      </div>

      <div style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.02)',
        padding: '14px',
        borderRadius: 12,
      }}>
        {LEGEND.map((item) => (
          <div
            key={item.label}
            style={{
              background: item.color,
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
