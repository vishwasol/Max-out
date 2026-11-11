import { Link, useNavigate } from 'react-router-dom'
import MuscleMap from './MuscleMap'
import { MUSCLE_GROUPS } from '../utils/exerciseLibrary'
import { classifyLevel, LEVEL_COLORS, LEGEND } from '../utils/strengthVisualizerLogic'

const getConfidenceLabel = (value) => {
  if (value >= 0.8) return 'High confidence'
  if (value >= 0.5) return 'Medium confidence'
  if (value > 0) return 'Low confidence'
  return 'No data'
}

const formatExerciseList = (exercises) => {
  if (!exercises?.length) return 'No logged lifts yet'
  return exercises.map(exercise => exercise.name).join(' • ')
}

export default function StrengthVisualizerSystem({ scores = {}, confidence = {}, topExercises = {} }) {
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
        {MUSCLE_GROUPS.map(muscle => (
          <Link key={muscle} to={exerciseLink(muscle)} className="muscle-score-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(139,92,246,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 }}>
              <div style={{ textTransform: 'uppercase', fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.05em' }}>
                {muscle}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: scores[muscle] ? LEVEL_COLORS[classifyLevel(scores[muscle])] : '#94a3b8' }}>
                {scores[muscle] ? `${scores[muscle].toFixed(1)} / 100` : '—'}
              </div>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: 8 }}>
              {getConfidenceLabel(confidence[muscle] || 0)}{confidence[muscle] > 0 && ` · ${Math.round(confidence[muscle] * 100)}%`}
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'rgba(148,163,184,0.16)', overflow: 'hidden', marginBottom: 8 }}>
              <div
                style={{
                  width: `${scores[muscle] || 0}%`,
                  height: '100%',
                  background: LEVEL_COLORS[classifyLevel(scores[muscle])] || LEVEL_COLORS[0],
                }}
              />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {formatExerciseList(topExercises[muscle])}
            </div>
          </Link>
        ))}
      </div>

      <div style={{ color: '#64748b', fontSize: '0.82rem', textAlign: 'center', marginBottom: 24 }}>
        Strength is an in-app score. Confidence reflects how much recent, relevant training data supports it.
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
